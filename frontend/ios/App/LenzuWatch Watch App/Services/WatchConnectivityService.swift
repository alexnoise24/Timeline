import WatchConnectivity
import SwiftUI
import Combine
import UserNotifications

class WatchConnectivityService: NSObject, WCSessionDelegate, ObservableObject {

    static let shared = WatchConnectivityService()

    @Published var projects: [WatchProject] = []
    @Published var activeProjectId: String?
    @Published var weddingModeActive: Bool = false

    private var syncRetryTimer: Timer?
    private var syncRetryCount = 0
    private let maxSyncRetries = 5
    private let syncRetryInterval: TimeInterval = 2.0

    override init() {
        super.init()
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
            NSLog("⌚️ [Watch] WCSession.activate() called")
        } else {
            NSLog("⌚️ [Watch] WCSession not supported on this device")
        }
    }

    // MARK: - Receive from iPhone

    // MARK: - Receive transferUserInfo from iPhone (works even when Watch app is in background)

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        NSLog("⌚️ [Watch] didReceiveUserInfo — keys=%@", userInfo.keys.joined(separator: ","))
        // Route through the same handler as sendMessage
        self.session(session, didReceiveMessage: userInfo)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            guard let action = message["action"] as? String else { return }
            NSLog("📨 [Watch] didReceiveMessage action=%@", action)

            switch action {
            case "syncProjects":
                if let dataString = message["data"] as? String,
                   let jsonData = dataString.data(using: .utf8) {
                    do {
                        let decoder = JSONDecoder()
                        decoder.dateDecodingStrategy = .iso8601
                        let projects = try decoder.decode([WatchProject].self, from: jsonData)
                        self.projects = projects
                        self.cancelRetry()
                        print("✅ [Watch] Received \(projects.count) projects")
                        // Derive weddingModeActive from project data so reconnection
                        // after iPhone ends wedding mode exits the watch view correctly.
                        if let active = projects.first(where: { $0.weddingModeActive }) {
                            self.weddingModeActive = true
                            self.activeProjectId = active.id
                        } else {
                            self.weddingModeActive = false
                            self.activeProjectId = nil
                            // No active wedding — clear any stale notifications (pending + delivered)
                            UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
                            UNUserNotificationCenter.current().removeAllDeliveredNotifications()
                        }
                    } catch {
                        print("❌ [Watch] Decode error: \(error)")
                    }
                } else {
                    print("❌ [Watch] syncProjects — data missing or wrong type: \(type(of: message["data"]))")
                }

            case "syncWeddingMode":
                NSLog("⌚️ [Watch] syncWeddingMode received — active=%@ type=%@",
                      String(describing: message["active"]),
                      String(describing: type(of: message["active"])))
                let isActive: Bool
                if let b = message["active"] as? Bool {
                    isActive = b
                } else if let n = message["active"] as? Int {
                    isActive = n == 1
                } else {
                    NSLog("⌚️ [Watch] syncWeddingMode — could not parse 'active' field, skipping")
                    break
                }
                self.weddingModeActive = isActive
                NSLog("⌚️ [Watch] weddingModeActive set to %d", isActive ? 1 : 0)
                if let projectId = message["projectId"] as? String {
                    self.activeProjectId = isActive ? projectId : nil
                }
                // Cancel ALL notifications (pending + delivered) when wedding mode ends
                if !isActive {
                    UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
                    UNUserNotificationCenter.current().removeAllDeliveredNotifications()
                    NSLog("⌚️ [Watch] Cancelled all pending + delivered notifications (wedding mode ended)")
                }

            default:
                print("⌚️ [Watch] Unknown action: \(action)")
            }
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        print("📦 [Watch] Received applicationContext, keys=\(applicationContext.keys.joined(separator: ","))")
        DispatchQueue.main.async {
            if let data = applicationContext["projects"] as? Data,
               let projects = try? JSONDecoder().decode([WatchProject].self, from: data) {
                self.projects = projects
                print("✅ [Watch] Projects loaded from applicationContext: \(projects.count)")
            }
        }
    }

    // MARK: - Send to iPhone

    /// Best-effort: drops the message if the iPhone is not immediately reachable.
    /// Use for non-critical, high-frequency messages (e.g. toggleShotItem).
    func sendToPhone(_ message: [String: Any]) {
        let session = WCSession.default
        guard session.isReachable else {
            print("⌚️ [Watch→iPhone] Not reachable, message dropped: \(message["action"] ?? "?")")
            return
        }
        session.sendMessage(message, replyHandler: nil) { error in
            print("❌ [Watch→iPhone] sendMessage error: \(error.localizedDescription)")
        }
    }

    /// Reliable delivery: tries sendMessage first; if not reachable or sendMessage fails,
    /// falls back to transferUserInfo which is queued and delivered when reachable.
    /// Use for critical one-shot actions (finishWeddingDay, startWeddingDay).
    private func sendToPhoneReliable(_ message: [String: Any]) {
        let session = WCSession.default
        let action = message["action"] as? String ?? "?"
        if session.isReachable {
            session.sendMessage(message, replyHandler: nil) { error in
                NSLog("⌚️ [Watch→iPhone] sendMessage failed for '%@' (%@) — queuing via transferUserInfo",
                      action, error.localizedDescription)
                session.transferUserInfo(message)
            }
        } else {
            NSLog("⌚️ [Watch→iPhone] Not reachable for '%@' — queuing via transferUserInfo", action)
            session.transferUserInfo(message)
        }
    }

    func toggleShotItem(projectId: String, itemId: String, completed: Bool) {
        sendToPhone([
            "action": "toggleShotItem",
            "projectId": projectId,
            "itemId": itemId,
            "completed": completed
        ])
    }

    func startWeddingDay(projectId: String) {
        sendToPhoneReliable(["action": "startWeddingDay", "projectId": projectId])
    }

    func finishWeddingDay(projectId: String) {
        // Optimistic update: cancel locally without waiting for iPhone confirmation.
        // The UI reacts immediately; the iPhone receives the message when reachable.
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        weddingModeActive = false
        activeProjectId = nil
        NSLog("⌚️ [Watch] finishWeddingDay — local state cleared, notifying iPhone reliably")
        sendToPhoneReliable(["action": "finishWeddingDay", "projectId": projectId])
    }

    // MARK: - Sync request with retry

    func requestSync() {
        cancelRetry()
        syncRetryCount = 0
        attemptSync()
    }

    private func attemptSync() {
        let session = WCSession.default
        print("⌚️ [Watch] Sync attempt \(syncRetryCount + 1)/\(maxSyncRetries) — isReachable=\(session.isReachable) activationState=\(session.activationState.rawValue)")

        if session.isReachable {
            session.sendMessage(["action": "requestSync"], replyHandler: nil) { error in
                print("❌ [Watch] requestSync error: \(error.localizedDescription)")
            }
        } else if syncRetryCount < maxSyncRetries {
            syncRetryCount += 1
            print("⌚️ [Watch] Not reachable — retrying in \(syncRetryInterval)s (attempt \(syncRetryCount)/\(maxSyncRetries))")
            syncRetryTimer = Timer.scheduledTimer(withTimeInterval: syncRetryInterval, repeats: false) { [weak self] _ in
                self?.attemptSync()
            }
        } else {
            print("⌚️ [Watch] Max retries reached — giving up until reachability changes")
        }
    }

    private func cancelRetry() {
        syncRetryTimer?.invalidate()
        syncRetryTimer = nil
        syncRetryCount = 0
    }

    // MARK: - WCSessionDelegate lifecycle

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            NSLog("❌ [Watch] WCSession activation error: %@", error.localizedDescription)
            return
        }
        NSLog("✅ [Watch] WCSession activated — state=%ld isReachable=%d", activationState.rawValue, session.isReachable ? 1 : 0)
        if activationState == .activated {
            DispatchQueue.main.async { self.requestSync() }
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        NSLog("📡 [Watch] Reachability changed → isReachable=%d", session.isReachable ? 1 : 0)
        if session.isReachable {
            NSLog("📡 [Watch] iPhone became reachable — requesting sync")
            DispatchQueue.main.async { self.requestSync() }
        }
    }
}

import UIKit
import Capacitor
import WatchConnectivity
import UserNotifications
import WebKit
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    /// FCM token received before the Capacitor bridge was ready — sent once bridge loads
    private var pendingFCMToken: String?
    /// Notification tap URL received before the bridge was ready — navigated once bridge loads
    private var pendingNavigationURL: String?

    func application(_ application: UIApplication,
                     didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        NSLog("🚀 [Lenzu] didFinishLaunchingWithOptions — starting setup")

        // ── 1. Firebase must be configured before any other Firebase call ──────
        FirebaseApp.configure()
        NSLog("✅ [Lenzu] FirebaseApp.configure() complete")

        // ── 2. Set delegates ─────────────────────────────────────────────────
        Messaging.messaging().delegate = self
        NSLog("📲 [Lenzu] Messaging.messaging().delegate = self")

        UNUserNotificationCenter.current().delegate = self
        NSLog("🔔 [Lenzu] UNUserNotificationCenter.current().delegate = self")

        // ── 3. Request authorisation (alert + sound + badge) ─────────────────
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .sound, .badge]
        ) { granted, error in
            if let error = error {
                NSLog("❌ [Lenzu] requestAuthorization error: %@", error.localizedDescription)
            } else {
                NSLog("🔔 [Lenzu] requestAuthorization result — granted: %@", granted ? "YES" : "NO")
            }
            guard granted else { return }
            DispatchQueue.main.async {
                NSLog("📡 [Lenzu] Calling registerForRemoteNotifications()")
                application.registerForRemoteNotifications()
            }
        }

        // ── 4. WatchBridge + bridge-dependent tasks ───────────────────────────
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            guard let rootVC = self.window?.rootViewController as? CAPBridgeViewController,
                  let bridge = rootVC.bridge else {
                NSLog("❌ [Lenzu] Could not obtain CAPBridgeViewController / bridge")
                return
            }

            WatchBridge.shared.setup(bridge: bridge)
            NSLog("✅ [Lenzu] WatchBridge initialised via rootViewController")

            // Drain any pending FCM token or nav URL
            if let token = self.pendingFCMToken {
                NSLog("📤 [Lenzu] Bridge ready — sending queued FCM token to JS")
                self.forwardFCMTokenToJS(token, bridge: bridge)
                self.pendingFCMToken = nil
            }
            if let url = self.pendingNavigationURL {
                NSLog("🔗 [Lenzu] Bridge ready — sending queued navigation URL: %@", url)
                self.sendNavigationEvent(url: url, bridge: bridge)
                self.pendingNavigationURL = nil
            }
        }

        NSLog("✅ [Lenzu] didFinishLaunchingWithOptions complete")
        return true
    }

    // ── APNs token callbacks ─────────────────────────────────────────────────

    func application(_ application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        let hex = deviceToken.map { String(format: "%02x", $0) }.joined()
        NSLog("📱 [Lenzu] APNs device token: %@", hex)

        // Give APNs token to Firebase so it can map it to an FCM token
        Messaging.messaging().apnsToken = deviceToken
        NSLog("✅ [Lenzu] APNs token forwarded to FirebaseMessaging")
    }

    func application(_ application: UIApplication,
                     didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NSLog("❌ [Lenzu] didFailToRegisterForRemoteNotifications: %@", error.localizedDescription)
    }

    // ── Capacitor URL / deep-link handling ───────────────────────────────────

    func application(_ app: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity,
                                                           restorationHandler: restorationHandler)
    }

    // ── Bridge helpers ───────────────────────────────────────────────────────

    /// Fire a JS event carrying the FCM token so the React layer can POST it to the backend.
    private func forwardFCMTokenToJS(_ token: String, bridge: CAPBridgeProtocol) {
        NSLog("🔥 [Lenzu] Forwarding FCM token to JS: %@", token)
        bridge.triggerJSEvent(
            eventName: "nativeFCMToken",
            target: "window",
            data: "{ \"token\": \"\(token)\" }"
        )
    }

    /// Fire a JS event so React can navigate to the tapped-notification URL.
    private func sendNavigationEvent(url: String, bridge: CAPBridgeProtocol) {
        NSLog("🔗 [Lenzu] Sending pushNotificationTap event — url: %@", url)
        bridge.triggerJSEvent(
            eventName: "pushNotificationTap",
            target: "window",
            data: "{ \"url\": \"\(url)\" }"
        )
    }

    // ── App lifecycle ────────────────────────────────────────────────────────
    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}
}

// MARK: - MessagingDelegate

extension AppDelegate: MessagingDelegate {
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let fcmToken else {
            NSLog("⚠️ [Lenzu] MessagingDelegate: received nil FCM token")
            return
        }
        NSLog("🔥 [Lenzu] MessagingDelegate: FCM registration token = %@", fcmToken)

        // Persist locally so it survives the 2-second bridge delay
        UserDefaults.standard.set(fcmToken, forKey: "lenzu_fcm_token")

        DispatchQueue.main.async {
            if let rootVC = self.window?.rootViewController as? CAPBridgeViewController,
               let bridge = rootVC.bridge {
                self.forwardFCMTokenToJS(fcmToken, bridge: bridge)
            } else {
                NSLog("⏳ [Lenzu] Bridge not ready — queuing FCM token")
                self.pendingFCMToken = fcmToken
            }
        }
    }
}

// MARK: - UNUserNotificationCenterDelegate

extension AppDelegate: UNUserNotificationCenterDelegate {

    /// Show banner + sound even when the app is in the foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                 willPresent notification: UNNotification,
                                 withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let info = notification.request.content.userInfo
        NSLog("📬 [Lenzu] willPresentNotification (foreground): %@", info)
        completionHandler([.banner, .sound, .badge])
    }

    /// Handle a tap on a delivered notification (app backgrounded or cold-launched)
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                 didReceive response: UNNotificationResponse,
                                 withCompletionHandler completionHandler: @escaping () -> Void) {
        let info = response.notification.request.content.userInfo
        NSLog("👆 [Lenzu] didReceiveNotificationResponse: %@", info)

        // FCM puts custom data at the top level of userInfo
        let url = (info["url"] as? String) ?? (info["gcm.notification.url"] as? String) ?? ""

        if !url.isEmpty {
            NSLog("🔗 [Lenzu] Notification tap — navigating to: %@", url)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                if let rootVC = self.window?.rootViewController as? CAPBridgeViewController,
                   let bridge = rootVC.bridge {
                    self.sendNavigationEvent(url: url, bridge: bridge)
                } else {
                    NSLog("⏳ [Lenzu] Bridge not ready — queuing navigation URL")
                    self.pendingNavigationURL = url
                }
            }
        }

        completionHandler()
    }
}

// MARK: - WatchBridge

class WatchBridge: NSObject, WCSessionDelegate, WKScriptMessageHandler {
    static let shared = WatchBridge()
    weak var bridge: CAPBridgeProtocol?

    /// Last syncProjects payload — replayed when Watch becomes reachable or requests sync
    private var lastSyncData: [String: Any]?

    func setup(bridge: CAPBridgeProtocol) {
        self.bridge = bridge
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
            NSLog("📡 [iPhone] WCSession.activate() called in WatchBridge.setup()")
        } else {
            NSLog("📡 [iPhone] WCSession NOT supported on this device")
        }

        // Register script message handler for JS communication
        if let webView = bridge.webView {
            webView.configuration.userContentController.add(self, name: "watchBridge")
        }
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController,
                                didReceive message: WKScriptMessage) {
        print("📨 WatchBridge received JS message: \(message.body)")

        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String else {
            print("⚠️ WatchBridge: invalid message format")
            return
        }

        print("🔄 WatchBridge action from JS: \(action)")

        switch action {
        case "scheduleNotifications":
            if let events = body["events"] as? [[String: Any]] {
                NSLog("📱 [iPhone] Scheduling notifications for %d events", events.count)
                NotificationScheduler.shared.scheduleEventNotifications(events: events)
            }
        case "cancelNotifications":
            NSLog("🚫 [iPhone] Canceling all notifications")
            NotificationScheduler.shared.cancelAllNotifications()
        case "syncProjects", "syncWeddingMode":
            NSLog("📡 [iPhone] JS action received: %@", action)
            syncToWatch(data: body)
        default:
            break
        }
    }

    // MARK: - Send to Watch

    func syncToWatch(data: [String: Any]) {
        let action = data["action"] as? String ?? "unknown"
        NSLog("📡 [iPhone→Watch] syncToWatch called — action=%@", action)

        guard WCSession.default.isPaired,
              WCSession.default.isWatchAppInstalled else {
            NSLog("📡 [iPhone→Watch] Skipped: not paired=%d appInstalled=%d",
                  WCSession.default.isPaired ? 1 : 0,
                  WCSession.default.isWatchAppInstalled ? 1 : 0)
            return
        }

        // Cache syncProjects so it can be replayed on demand
        if action == "syncProjects" {
            lastSyncData = data
            NSLog("📡 [iPhone→Watch] syncProjects cached")
        }

        let session = WCSession.default
        NSLog("📡 [iPhone→Watch] isReachable=%d activationState=%ld",
              session.isReachable ? 1 : 0,
              session.activationState.rawValue)

        // syncWeddingMode: always use transferUserInfo so it delivers even when
        // the Watch app is in the background (sendMessage silently fails otherwise)
        if action == "syncWeddingMode" {
            NSLog("📡 [iPhone→Watch] syncWeddingMode — using transferUserInfo()")
            session.transferUserInfo(data)
            return
        }

        // For other actions try sendMessage first, fall back to applicationContext
        if session.isReachable {
            NSLog("📡 [iPhone→Watch] Calling sendMessage for action=%@", action)
            session.sendMessage(data, replyHandler: nil) { error in
                NSLog("❌ [iPhone→Watch] sendMessage error: %@ — falling back to applicationContext",
                      error.localizedDescription)
                try? session.updateApplicationContext(data)
            }
        } else {
            NSLog("📡 [iPhone→Watch] Not reachable — using applicationContext for action=%@", action)
            try? session.updateApplicationContext(data)
        }
    }

    // MARK: - Receive from Watch

    /// Handles transferUserInfo messages from the Watch (background / queued delivery).
    /// Routes through the same handler as sendMessage so all actions are processed identically.
    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        let action = userInfo["action"] as? String ?? "?"
        NSLog("📨 [Watch→iPhone] didReceiveUserInfo action=%@", action)
        self.session(session, didReceiveMessage: userInfo)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let action = message["action"] as? String else { return }
        print("📨 [Watch→iPhone] action=\(action)")

        // Watch asked for a sync — reply immediately with cached data without waiting for JS
        if action == "requestSync", let cached = lastSyncData {
            print("📡 [iPhone→Watch] Replying to requestSync with cached syncProjects")
            if session.isReachable {
                session.sendMessage(cached, replyHandler: nil) { error in
                    print("❌ [iPhone→Watch] Replay error: \(error.localizedDescription)")
                }
            }
        }

        // Also forward to JS so React can respond / refresh data
        DispatchQueue.main.async {
            self.bridge?.triggerJSEvent(
                eventName: "watchAction",
                target: "window",
                data: """
                    { "action": "\(action)", "data": \(self.jsonString(message)) }
                """)
        }
    }

    // MARK: - WCSessionDelegate lifecycle

    func session(_ session: WCSession,
                 activationDidCompleteWith activationState: WCSessionActivationState,
                 error: Error?) {
        if let error = error {
            NSLog("❌ [iPhone] WCSession activation error: %@", error.localizedDescription)
            return
        }
        NSLog("✅ [iPhone] WCSession activated — state=%ld isPaired=%d isWatchAppInstalled=%d isReachable=%d",
              activationState.rawValue,
              session.isPaired ? 1 : 0,
              session.isWatchAppInstalled ? 1 : 0,
              session.isReachable ? 1 : 0)

        // If Watch is already reachable at activation, push cached data proactively
        if activationState == .activated, session.isReachable, let cached = lastSyncData {
            NSLog("📡 [iPhone] Watch reachable at activation, pushing cached syncProjects")
            session.sendMessage(cached, replyHandler: nil) { error in
                NSLog("❌ [iPhone] Proactive push error: %@", error.localizedDescription)
            }
        }
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        NSLog("📡 [iPhone] Reachability changed → isReachable=%d", session.isReachable ? 1 : 0)
        guard session.isReachable, let cached = lastSyncData else { return }
        NSLog("📡 [iPhone] Watch became reachable — pushing cached syncProjects")
        session.sendMessage(cached, replyHandler: nil) { error in
            NSLog("❌ [iPhone] Reachability push error: %@", error.localizedDescription)
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {
        NSLog("📡 [iPhone] WCSession became inactive")
    }

    func sessionDidDeactivate(_ session: WCSession) {
        NSLog("📡 [iPhone] WCSession deactivated — reactivating")
        WCSession.default.activate()
    }

    // MARK: - Helpers

    private func jsonString(_ dict: [String: Any]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let str = String(data: data, encoding: .utf8)
        else { return "{}" }
        return str
    }
}

// MARK: - NotificationScheduler

class NotificationScheduler {
    static let shared = NotificationScheduler()

    func requestPermission(completion: ((Bool) -> Void)? = nil) {
        UNUserNotificationCenter.current().requestAuthorization(
            options: [.alert, .sound, .badge]
        ) { granted, error in
            if let error = error {
                print("Notification permission error: \(error)")
            }
            print("Notification permission granted: \(granted)")
            completion?(granted)
        }
    }

    func scheduleEventNotifications(events: [[String: Any]]) {
        print("📅 scheduleEventNotifications called with \(events.count) events")

        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()

        let calendar = Calendar.current
        let now = Date()

        for event in events {
            guard let time = event["time"] as? String,
                  let title = event["title"] as? String,
                  let eventId = event["id"] as? String
            else { continue }

            let components = time.split(separator: ":")
            guard components.count == 2,
                  let hour = Int(components[0]),
                  let minute = Int(components[1])
            else { continue }

            // Calcular 10 minutos antes
            var notifMinute = minute - 10
            var notifHour = hour
            if notifMinute < 0 {
                notifMinute += 60
                notifHour -= 1
            }
            if notifHour < 0 { notifHour = 23 }

            // Usar fecha completa de HOY (year, month, day, hour, minute)
            var triggerComponents = calendar.dateComponents([.year, .month, .day], from: now)
            triggerComponents.hour = notifHour
            triggerComponents.minute = notifMinute
            triggerComponents.second = 0

            // Verificar que la hora no haya pasado
            guard let triggerDate = calendar.date(from: triggerComponents),
                  triggerDate > now else {
                print("⏭️ Skipping \(title) - notification time already passed")
                continue
            }

            let content = UNMutableNotificationContent()
            content.title = "Próximo evento en 10 min"
            content.body = "\(time) — \(title)"
            content.sound = .default

            let trigger = UNCalendarNotificationTrigger(
                dateMatching: triggerComponents,
                repeats: false
            )

            let request = UNNotificationRequest(
                identifier: "event-\(eventId)",
                content: content,
                trigger: trigger
            )

            UNUserNotificationCenter.current().add(request) { error in
                if let error = error {
                    print("❌ Error scheduling \(title): \(error)")
                } else {
                    print("✅ Scheduled: \(title) at \(notifHour):\(String(format: "%02d", notifMinute))")
                }
            }
        }
    }

    func scheduleWeddingDayStart(coupleName: String) {
        let content = UNMutableNotificationContent()
        content.title = "¡Día de boda!"
        content.body = "Modo boda activado para \(coupleName)"
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "wedding-day-start",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
    }

    func cancelAllNotifications() {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
    }
}

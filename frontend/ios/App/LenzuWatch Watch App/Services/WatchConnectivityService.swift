import WatchConnectivity
import SwiftUI
import Combine

class WatchConnectivityService: NSObject, WCSessionDelegate, ObservableObject {
    
    static let shared = WatchConnectivityService()
    
    @Published var projects: [WatchProject] = []
    @Published var activeProjectId: String?
    @Published var weddingModeActive: Bool = false
    
    override init() {
        super.init()
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            if let data = message["projects"] as? Data,
               let projects = try? JSONDecoder().decode([WatchProject].self, from: data) {
                self.projects = projects
            }
            if let activeId = message["activeProjectId"] as? String {
                self.activeProjectId = activeId
            }
            if let weddingMode = message["weddingModeActive"] as? Bool {
                self.weddingModeActive = weddingMode
            }
        }
    }
    
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        DispatchQueue.main.async {
            if let data = applicationContext["projects"] as? Data,
               let projects = try? JSONDecoder().decode([WatchProject].self, from: data) {
                self.projects = projects
            }
        }
    }
    
    func sendToPhone(_ message: [String: Any]) {
        guard WCSession.default.isReachable else { return }
        WCSession.default.sendMessage(message, replyHandler: nil, errorHandler: nil)
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
        sendToPhone([
            "action": "startWeddingDay",
            "projectId": projectId
        ])
    }
    
    func finishWeddingDay(projectId: String) {
        sendToPhone([
            "action": "finishWeddingDay",
            "projectId": projectId
        ])
    }
    
    func requestSync() {
        sendToPhone(["action": "requestSync"])
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated {
            requestSync()
        }
    }
    
}

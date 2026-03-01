import WatchConnectivity
import Capacitor

class WatchBridge: NSObject, WCSessionDelegate {
    static let shared = WatchBridge()
    weak var bridge: CAPBridgeProtocol?
    
    func setup(bridge: CAPBridgeProtocol) {
        self.bridge = bridge
        if WCSession.isSupported() {
            WCSession.default.delegate = self
            WCSession.default.activate()
        }
    }
    
    func syncToWatch(data: [String: Any]) {
        guard WCSession.default.isPaired,
              WCSession.default.isWatchAppInstalled else { return }
        
        if WCSession.default.isReachable {
            WCSession.default.sendMessage(data, replyHandler: nil, errorHandler: nil)
        } else {
            try? WCSession.default.updateApplicationContext(data)
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        guard let action = message["action"] as? String else { return }
        
        DispatchQueue.main.async {
            self.bridge?.triggerJSEvent(
                eventName: "watchAction",
                target: "window",
                data: """
                    { "action": "\(action)", "data": \(self.jsonString(message)) }
                """)
        }
    }
    
    private func jsonString(_ dict: [String: Any]) -> String {
        guard let data = try? JSONSerialization.data(withJSONObject: dict),
              let str = String(data: data, encoding: .utf8)
        else { return "{}" }
        return str
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {}
    
    func sessionDidBecomeInactive(_ session: WCSession) {}
    
    func sessionDidDeactivate(_ session: WCSession) {
        WCSession.default.activate()
    }
}

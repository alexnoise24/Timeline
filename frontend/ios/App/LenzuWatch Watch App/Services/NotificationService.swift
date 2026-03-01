import UserNotifications
import Foundation

class NotificationService {
    static let shared = NotificationService()
    
    func requestPermission() {
        UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }
    
    func scheduleEventNotifications(for events: [WatchEvent], coupleName: String) {
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        
        let calendar = Calendar.current
        let today = Date()
        
        for event in events {
            guard let eventTime = event.timeAsDate else { continue }
            
            var components = calendar.dateComponents([.hour, .minute], from: eventTime)
            components.year = calendar.component(.year, from: today)
            components.month = calendar.component(.month, from: today)
            components.day = calendar.component(.day, from: today)
            
            guard let fireDate = calendar.date(from: components),
                  fireDate > today else { continue }
            
            let triggerDate = fireDate.addingTimeInterval(-10 * 60)
            guard triggerDate > today else { continue }
            
            let content = UNMutableNotificationContent()
            content.title = coupleName
            content.body = "En 10 min: \(event.time) — \(event.title)"
            content.sound = .default
            
            let triggerComponents = calendar.dateComponents(
                [.year, .month, .day, .hour, .minute],
                from: triggerDate)
            let trigger = UNCalendarNotificationTrigger(
                dateMatching: triggerComponents, repeats: false)
            
            let request = UNNotificationRequest(
                identifier: "event-\(event.id)",
                content: content, trigger: trigger)
            
            UNUserNotificationCenter.current().add(request, withCompletionHandler: nil)
        }
    }
}

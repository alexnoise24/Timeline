import UserNotifications
import Foundation

class NotificationService {
    static let shared = NotificationService()
    
    func requestPermission() {
        UNUserNotificationCenter.current()
            .requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }
    
    func scheduleEventNotifications(for events: [WatchEvent], coupleName: String, weddingDate: String) {
        // Cancel both pending and already-delivered notifications before scheduling new ones
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()

        let calendar = Calendar.current
        let today = Date()

        // Guard: only schedule if the wedding date is today.
        // weddingDate arrives as ISO-8601 (e.g. "2026-03-30T00:00:00.000Z"); compare the date prefix.
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let todayString = dateFormatter.string(from: today)
        let weddingDatePrefix = String(weddingDate.prefix(10))
        guard weddingDatePrefix == todayString else {
            NSLog("⌚️ [NotificationService] Wedding date %@ ≠ today %@ — skipping notification scheduling",
                  weddingDatePrefix, todayString)
            return
        }

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

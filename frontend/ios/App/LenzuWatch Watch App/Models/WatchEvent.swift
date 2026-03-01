import Foundation

struct WatchEvent: Identifiable, Codable {
    let id: String
    let time: String
    let title: String
    let category: String
    let notes: String?
    var isCompleted: Bool
    
    var timeAsDate: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm"
        return formatter.date(from: time)
    }
}

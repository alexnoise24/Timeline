import Foundation

struct WatchShotItem: Identifiable, Codable, Equatable {
    let id: String
    let title: String
    let category: String
    var isCompleted: Bool
}

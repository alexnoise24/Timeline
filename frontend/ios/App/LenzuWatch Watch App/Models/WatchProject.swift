import Foundation

struct WatchProject: Identifiable, Codable {
    let id: String
    let coupleName: String
    let date: Date
    let location: String?
    var events: [WatchEvent]
    var shotItems: [WatchShotItem]
    var weddingModeActive: Bool
}

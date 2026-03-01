import SwiftUI

struct ShotListWatchView: View {
    let project: WatchProject
    @EnvironmentObject var connectivity: WatchConnectivityService
    
    var completedCount: Int {
        project.shotItems.filter { $0.isCompleted }.count
    }
    
    var body: some View {
        VStack(spacing: 0) {
            // Progress bar
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color(red: 0.15, green: 0.16, blue: 0.21))
                        .frame(height: 4)
                    Rectangle()
                        .fill(Color(red: 0.66, green: 0.69, blue: 0.83))
                        .frame(
                            width: project.shotItems.isEmpty ? 0 :
                                geo.size.width * CGFloat(completedCount) / CGFloat(project.shotItems.count),
                            height: 4)
                }
                .cornerRadius(2)
            }
            .frame(height: 4)
            .padding(.horizontal)
            .padding(.bottom, 8)
            
            // Shot items list
            List(project.shotItems) { item in
                HStack(spacing: 8) {
                    Image(systemName: item.isCompleted ? "checkmark.square.fill" : "square")
                        .foregroundColor(item.isCompleted ? Color(red: 0.66, green: 0.69, blue: 0.83) : .gray)
                        .font(.caption)
                        .onTapGesture {
                            connectivity.toggleShotItem(
                                projectId: project.id,
                                itemId: item.id,
                                completed: !item.isCompleted)
                        }
                    
                    Text(item.title)
                        .font(.caption2)
                        .foregroundColor(item.isCompleted ? .gray : .white)
                        .strikethrough(item.isCompleted)
                }
            }
        }
        .navigationTitle("Shot List")
    }
}

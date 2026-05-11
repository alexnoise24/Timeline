import SwiftUI

struct ShotListWatchView: View {
    let project: WatchProject
    @EnvironmentObject var connectivity: WatchConnectivityService
    @State private var localItems: [WatchShotItem] = []

    var completedCount: Int {
        localItems.filter { $0.isCompleted }.count
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
                            width: localItems.isEmpty ? 0 :
                                geo.size.width * CGFloat(completedCount) / CGFloat(localItems.count),
                            height: 4)
                }
                .cornerRadius(2)
            }
            .frame(height: 4)
            .padding(.horizontal)
            .padding(.bottom, 8)

            // Shot items list
            List($localItems) { $item in
                Button {
                    item.isCompleted.toggle()
                    connectivity.toggleShotItem(
                        projectId: project.id,
                        itemId: item.id,
                        completed: item.isCompleted)
                } label: {
                    HStack(spacing: 8) {
                        Image(systemName: item.isCompleted ? "checkmark.square.fill" : "square")
                            .foregroundColor(item.isCompleted ? Color(red: 0.66, green: 0.69, blue: 0.83) : .gray)
                            .font(.caption)

                        Text(item.title)
                            .font(.caption2)
                            .foregroundColor(item.isCompleted ? .gray : .white)
                            .strikethrough(item.isCompleted)

                        Spacer()
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .navigationTitle("Shot List")
        .onAppear {
            localItems = project.shotItems
        }
        .onChange(of: project.shotItems) { updated in
            // Merge incoming sync from iPhone preserving any in-flight local toggles
            localItems = updated
        }
    }
}

import SwiftUI

struct ProjectListView: View {
    @EnvironmentObject var connectivity: WatchConnectivityService
    @State private var selectedProject: WatchProject? = nil
    
    var body: some View {
        NavigationStack {
            List(connectivity.projects) { project in
                Button(action: {
                    selectedProject = project
                }) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(project.coupleName)
                            .font(.headline)
                            .foregroundColor(.white)
                        Text(project.date, style: .date)
                            .font(.caption2)
                            .foregroundColor(.gray)
                        if project.weddingModeActive {
                            HStack(spacing: 4) {
                                Circle()
                                    .fill(Color(red: 0.66, green: 0.69, blue: 0.83))
                                    .frame(width: 6, height: 6)
                                Text("EN VIVO")
                                    .font(.system(size: 9, weight: .bold))
                                    .foregroundColor(Color(red: 0.66, green: 0.69, blue: 0.83))
                            }
                        }
                    }
                }
            }
            .navigationTitle("Lenzu")
            .navigationDestination(isPresented: Binding(
                get: { selectedProject != nil },
                set: { if !$0 { selectedProject = nil } }
            )) {
                if let project = selectedProject {
                    TimelineWatchView(project: project)
                }
            }
        }
    }
}

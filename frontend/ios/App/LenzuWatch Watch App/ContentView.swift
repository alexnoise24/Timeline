import SwiftUI

struct ContentView: View {
    @EnvironmentObject var connectivity: WatchConnectivityService
    
    var body: some View {
        Group {
            if connectivity.projects.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "camera.fill")
                    Text("Sin proyectos")
                    Text("Abre Lenzu en tu iPhone")
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            } else if connectivity.weddingModeActive,
                      let activeId = connectivity.activeProjectId,
                      let activeProject = connectivity.projects.first(where: { $0.id == activeId }) {
                TimelineWatchView(project: activeProject)
            } else {
                ProjectListView()
            }
        }
        .onAppear {
            connectivity.requestSync()
            // Safety stop: if a background session is somehow still running when
            // the app is visibly in the foreground, kill it here.
            ExtendedRuntimeSessionManager.shared.stopSession(caller: "ContentView.onAppear")
        }
    }
}

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var connectivity: WatchConnectivityService
    
    var body: some View {
        Group {
            if connectivity.projects.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "camera.fill")
                        .font(.title2)
                        .foregroundColor(.gray)
                    Text("Sin proyectos")
                        .font(.caption)
                        .foregroundColor(.gray)
                    Text("Abre Lenzu en tu iPhone")
                        .font(.caption2)
                        .foregroundColor(.gray.opacity(0.7))
                        .multilineTextAlignment(.center)
                }
            } else {
                ProjectListView()
            }
        }
        .onAppear {
            connectivity.requestSync()
        }
    }
}

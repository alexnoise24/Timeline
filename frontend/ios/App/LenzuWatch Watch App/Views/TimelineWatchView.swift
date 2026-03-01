import SwiftUI

struct TimelineWatchView: View {
    let project: WatchProject
    @EnvironmentObject var connectivity: WatchConnectivityService
    @State private var selectedTab = 0
    
    var sortedEvents: [WatchEvent] {
        project.events.sorted { a, b in
            let timeA = Int(a.time.replacingOccurrences(of: ":", with: "")) ?? 0
            let timeB = Int(b.time.replacingOccurrences(of: ":", with: "")) ?? 0
            return timeA < timeB
        }
    }
    
    var activeEvent: WatchEvent? {
        let now = Date()
        let calendar = Calendar.current
        let currentMinutes = calendar.component(.hour, from: now) * 60 + calendar.component(.minute, from: now)
        
        return sortedEvents
            .filter { event in
                guard let t = event.timeAsDate else { return false }
                let eventMinutes = calendar.component(.hour, from: t) * 60 + calendar.component(.minute, from: t)
                return eventMinutes <= currentMinutes
            }
            .last
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // Panel 1 — Timeline
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(sortedEvents) { event in
                            EventRowView(
                                event: event,
                                isActive: event.id == activeEvent?.id
                            )
                            .id(event.id)
                        }
                    }
                    .padding(.horizontal, 4)
                }
                .onAppear {
                    if let activeId = activeEvent?.id {
                        proxy.scrollTo(activeId, anchor: .center)
                    }
                    NotificationService.shared.scheduleEventNotifications(
                        for: sortedEvents,
                        coupleName: project.coupleName)
                }
            }
            .tag(0)
            
            // Panel 2 — Shot List
            ShotListWatchView(project: project)
                .tag(1)
            
            // Panel 3 — Control
            VStack(spacing: 12) {
                Image(systemName: "camera.fill")
                    .font(.title2)
                    .foregroundColor(.gray)
                
                if project.weddingModeActive {
                    Button("Finalizar día") {
                        connectivity.finishWeddingDay(projectId: project.id)
                    }
                    .foregroundColor(.red.opacity(0.8))
                    .font(.caption)
                } else {
                    Button("Iniciar día") {
                        connectivity.startWeddingDay(projectId: project.id)
                    }
                    .foregroundColor(Color(red: 0.66, green: 0.69, blue: 0.83))
                    .font(.caption)
                    .fontWeight(.medium)
                }
            }
            .tag(2)
        }
        .tabViewStyle(.verticalPage)
        .navigationTitle(project.coupleName)
        .navigationBarTitleDisplayMode(.inline)
    }
}

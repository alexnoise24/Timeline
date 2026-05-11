import SwiftUI

struct TimelineWatchView: View {
    let project: WatchProject
    @EnvironmentObject var connectivity: WatchConnectivityService
    @State private var selectedTab = 0

    // MARK: - Finish-day feedback state
    private enum FinishState: Equatable { case idle, finishing, done }
    @State private var finishState: FinishState = .idle

    /// `true` cuando la pantalla está atenuada — Always-On Display activo
    @Environment(\.isLuminanceReduced) private var isLuminanceReduced

    // MARK: - Event helpers

    var sortedEvents: [WatchEvent] {
        project.events.sorted { a, b in
            let timeA = Int(a.time.replacingOccurrences(of: ":", with: "")) ?? 0
            let timeB = Int(b.time.replacingOccurrences(of: ":", with: "")) ?? 0
            return timeA < timeB
        }
    }

    /// Último evento cuya hora ya pasó (evento "en curso")
    func activeEvent(for now: Date) -> WatchEvent? {
        let cal = Calendar.current
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        return sortedEvents
            .filter { event in
                guard let t = event.timeAsDate else { return false }
                let evMin = cal.component(.hour, from: t) * 60 + cal.component(.minute, from: t)
                return evMin <= nowMin
            }
            .last
    }

    /// Primer evento que aún no ha empezado
    func nextEvent(for now: Date) -> WatchEvent? {
        let cal = Calendar.current
        let nowMin = cal.component(.hour, from: now) * 60 + cal.component(.minute, from: now)
        return sortedEvents
            .first { event in
                guard let t = event.timeAsDate else { return false }
                let evMin = cal.component(.hour, from: t) * 60 + cal.component(.minute, from: t)
                return evMin > nowMin
            }
    }

    // MARK: - Body

    var body: some View {
        if isLuminanceReduced {
            TimelineView(.periodic(from: .now, by: 60)) { context in
                alwaysOnView(for: context.date)
            }
        } else {
            interactiveView()
        }
    }

    // MARK: - Interactive view (extracted to reduce body complexity)

    @ViewBuilder
    private func interactiveView() -> some View {
        TabView(selection: $selectedTab) {
            timelinePanel().tag(0)
            ShotListWatchView(project: project).tag(1)
            controlPanel().tag(2)
        }
        .tabViewStyle(.verticalPage)
        .navigationTitle(project.coupleName)
        .navigationBarTitleDisplayMode(.inline)
    }

    /// Panel 1 — scrolling timeline with auto-scroll to active event.
    @ViewBuilder
    private func timelinePanel() -> some View {
        TimelineView(.periodic(from: .now, by: 30)) { context in
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(sortedEvents) { event in
                            EventRowView(
                                event: event,
                                isActive: event.id == activeEvent(for: context.date)?.id
                            )
                            .id(event.id)
                        }
                    }
                    .padding(.horizontal, 4)
                }
                .onAppear {
                    if let activeId = activeEvent(for: context.date)?.id {
                        proxy.scrollTo(activeId, anchor: .center)
                    }
                    // Only schedule notifications while wedding mode is active and the
                    // wedding date is today — NotificationService performs the date guard too.
                    if project.weddingModeActive {
                        let fmt = DateFormatter()
                        fmt.dateFormat = "yyyy-MM-dd"
                        NotificationService.shared.scheduleEventNotifications(
                            for: sortedEvents,
                            coupleName: project.coupleName,
                            weddingDate: fmt.string(from: project.date))
                    }
                }
                .onChange(of: activeEvent(for: context.date)?.id) { _, activeId in
                    if let activeId {
                        withAnimation(.easeInOut(duration: 0.4)) {
                            proxy.scrollTo(activeId, anchor: .center)
                        }
                    }
                }
            }
        }
    }

    /// Panel 3 — start/finish wedding day with inline feedback states.
    @ViewBuilder
    private func controlPanel() -> some View {
        VStack(spacing: 12) {
            if finishState == .done {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title2)
                    .foregroundColor(.green)
                Text("¡Listo!")
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(.green)

            } else if finishState == .finishing {
                ProgressView()
                    .tint(.gray)
                    .scaleEffect(0.8)
                Text("Finalizando…")
                    .font(.caption2)
                    .foregroundColor(.gray)

            } else {
                Image(systemName: "camera.fill")
                    .font(.title2)
                    .foregroundColor(.gray)

                if connectivity.weddingModeActive {
                    Button("Finalizar día") {
                        finishState = .finishing
                        connectivity.finishWeddingDay(projectId: project.id)
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                            finishState = .done
                        }
                        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                            finishState = .idle
                        }
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
        }
    }

    // MARK: - Always-On Display

    /// Vista minimalista para pantalla atenuada.
    /// Reglas AOD de Apple: fondo negro, sin gradientes, sin animaciones.
    @ViewBuilder
    private func alwaysOnView(for date: Date) -> some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 10) {

                // Hora actual — peso fino para minimizar píxeles encendidos
                Text(date, style: .time)
                    .font(.system(size: 32, weight: .thin, design: .rounded))
                    .foregroundColor(.white.opacity(0.9))
                    .monospacedDigit()

                // Separador sutil
                Rectangle()
                    .fill(Color.white.opacity(0.15))
                    .frame(height: 1)
                    .padding(.horizontal, 24)

                // Próximo evento
                if let next = nextEvent(for: date) {
                    let _ = NSLog("⌚️ [AOD] Próximo: %@ — %@", next.time, next.title)
                    aodEventRow(label: "PRÓXIMO", event: next)

                // Si no hay siguiente, mostrar el activo
                } else if let active = activeEvent(for: date) {
                    let _ = NSLog("⌚️ [AOD] Activo: %@ — %@", active.time, active.title)
                    aodEventRow(label: "AHORA", event: active)

                // Sin eventos
                } else {
                    Text(project.coupleName)
                        .font(.system(size: 13, weight: .light))
                        .foregroundColor(.gray)
                }
            }
            .padding(.horizontal, 8)
        }
    }

    @ViewBuilder
    private func aodEventRow(label: String, event: WatchEvent) -> some View {
        let accent = Color(red: 0.66, green: 0.69, blue: 0.83)
        VStack(spacing: 4) {
            Text(label)
                .font(.system(size: 9, weight: .semibold))
                .foregroundColor(accent)
                .tracking(1.5)
            Text(event.time)
                .font(.system(size: 20, weight: .medium, design: .rounded))
                .foregroundColor(accent)
                .monospacedDigit()
            Text(event.title)
                .font(.system(size: 12))
                .foregroundColor(.white.opacity(0.75))
                .multilineTextAlignment(.center)
                .lineLimit(2)
        }
    }
}

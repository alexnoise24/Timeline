import WatchKit
import UserNotifications

/// Manages a `WKExtendedRuntimeSession` that keeps the app alive in the background
/// during a wedding (field mode). Key behaviors:
///
/// - Started during `willResignActive` (the ONLY valid window to start a background session).
/// - Stopped immediately when the app returns to the foreground (`didBecomeActive`).
/// - **Chain renewal**: when `willExpire` fires, a new session is started immediately
///   so there is no gap in background execution.
/// - **Auto-restart on unexpected invalidation**: if the system kills the session
///   (not the app), a 0.5 s debounced restart is attempted. If the app is already
///   fully suspended this attempt will be a no-op; the next `willResignActive`
///   (triggered by the anchor notification path: notification → user raises wrist →
///   app re-opens → wrist lowered) will restart the session cleanly.
/// - **Anchor notifications**: a repeating silent local notification fires every
///   25 minutes while wedding mode is active. Its only job is to appear on the
///   wrist when watchOS suspends the app, giving the user a tap target to re-open
///   Lenzu and restart the session naturally.
class ExtendedRuntimeSessionManager: NSObject, WKExtendedRuntimeSessionDelegate {

    static let shared = ExtendedRuntimeSessionManager()

    private var session: WKExtendedRuntimeSession?
    /// Debounced restart after unexpected invalidation.
    private var restartWorkItem: DispatchWorkItem?
    /// Set when an unexpected invalidation occurs while wedding mode is active.
    /// Consumed on the next `willResignActive` so we don't double-start.
    private var pendingRestart = false
    /// Tracks running state ourselves to avoid WKExtendedRuntimeSession.state,
    /// whose nested State enum is unavailable in some watchOS SDK versions.
    private var _isRunning = false

    var isRunning: Bool { _isRunning }

    // MARK: - Init

    override init() {
        super.init()
        NSLog("⌚️ [ERS] init — nuking any existing session")
        nukeSession()
        registerLifecycleObservers()
    }

    private func registerLifecycleObservers() {
        let nc = NotificationCenter.default
        nc.addObserver(self, selector: #selector(handleWillResignActive),
                       name: WKApplication.willResignActiveNotification, object: nil)
        nc.addObserver(self, selector: #selector(handleDidBecomeActive),
                       name: WKApplication.didBecomeActiveNotification, object: nil)
        NSLog("⌚️ [ERS] Observers registered: willResignActive + didBecomeActive")
    }

    // MARK: - Lifecycle observers

    @objc private func handleWillResignActive() {
        let wedding = WatchConnectivityService.shared.weddingModeActive
        NSLog("⌚️ [ERS] 🔔 willResignActive — weddingMode=%d sessionRunning=%d",
              wedding ? 1 : 0, _isRunning ? 1 : 0)
        guard wedding else {
            NSLog("⌚️ [ERS]    Wedding mode off — skipping start")
            return
        }
        // Consume any pending-restart flag: we are about to start/confirm a session.
        pendingRestart = false
        restartWorkItem?.cancel()
        restartWorkItem = nil
        startSession(caller: "willResignActive")
    }

    @objc private func handleDidBecomeActive() {
        NSLog("⌚️ [ERS] 🔔 didBecomeActive — sessionRunning=%d", _isRunning ? 1 : 0)
        // Cancel any debounced restart — willResignActive will handle it next time.
        restartWorkItem?.cancel()
        restartWorkItem = nil
        pendingRestart = false
        stopSession(caller: "didBecomeActive")
    }

    // MARK: - Public API

    func startSession(caller: String = "external") {
        NSLog("⌚️ [ERS] startSession(caller:%@) — isRunning=%d sessionNil=%d",
              caller, _isRunning ? 1 : 0, session == nil ? 1 : 0)

        guard !_isRunning else {
            NSLog("⌚️ [ERS]    Already running — skipping")
            return
        }

        // Invalidate any stuck session object before creating a fresh one.
        if session != nil {
            NSLog("⌚️ [ERS]    Stale session object found — invalidating before restart")
            session?.invalidate()
            session = nil
        }

        NSLog("⌚️ [ERS] ▶️ Creating and starting new WKExtendedRuntimeSession")
        let s = WKExtendedRuntimeSession()
        s.delegate = self
        s.start()
        session = s
        NSLog("⌚️ [ERS]    start() called")

        // Schedule anchor notifications for the duration of the wedding mode.
        scheduleAnchorNotifications()
    }

    func stopSession(caller: String = "external") {
        NSLog("⌚️ [ERS] ⏹ stopSession(caller:%@) — isRunning=%d", caller, _isRunning ? 1 : 0)
        guard session != nil else {
            NSLog("⌚️ [ERS]    No session to stop")
            return
        }
        _isRunning = false
        session?.invalidate()
        session = nil
        NSLog("⌚️ [ERS]    invalidate() called, session set to nil")
        cancelAnchorNotifications()
    }

    // MARK: - WKExtendedRuntimeSessionDelegate

    func extendedRuntimeSessionDidStart(_ extendedRuntimeSession: WKExtendedRuntimeSession) {
        _isRunning = true
        NSLog("⌚️ [ERS] ✅ Session DID start — isRunning=1")
    }

    func extendedRuntimeSessionWillExpire(_ extendedRuntimeSession: WKExtendedRuntimeSession) {
        let wedding = WatchConnectivityService.shared.weddingModeActive
        NSLog("⌚️ [ERS] ⏰ Session WILL expire — weddingMode=%d", wedding ? 1 : 0)
        guard wedding else {
            NSLog("⌚️ [ERS]    Wedding mode off — not renewing expiring session")
            return
        }

        // Chain a new session immediately inside the willExpire window.
        // The old session expires on its own; its subsequent didInvalidate
        // will be ignored because `session` already points to the new object.
        NSLog("⌚️ [ERS]    Chaining new session before expiry")
        let s = WKExtendedRuntimeSession()
        s.delegate = self
        s.start()
        session = s
        // _isRunning stays true; extendedRuntimeSessionDidStart on `s` will confirm it.
        NSLog("⌚️ [ERS]    New session chained — waiting for didStart")
    }

    func extendedRuntimeSession(
        _ extendedRuntimeSession: WKExtendedRuntimeSession,
        didInvalidateWith reason: WKExtendedRuntimeSessionInvalidationReason,
        error: Error?
    ) {
        let isCurrent = (session === extendedRuntimeSession)
        let reasonStr = reasonDescription(reason)
        NSLog("⌚️ [ERS] ❌ Session didInvalidate — reason=%ld (%@) isCurrent=%d",
              reason.rawValue, reasonStr, isCurrent ? 1 : 0)
        if let err = error as NSError? {
            NSLog("⌚️ [ERS]    error domain=%@ code=%ld msg=%@",
                  err.domain, err.code, err.localizedDescription)
        } else {
            NSLog("⌚️ [ERS]    no error object attached")
        }

        if isCurrent { session = nil; _isRunning = false }

        // Determine whether this was an expected invalidation (app-requested or
        // a stale session from the chain-renewal path).
        let appRequestedIt  = (reason == .none)
        let weddingActive   = WatchConnectivityService.shared.weddingModeActive

        NSLog("⌚️ [ERS]    appRequested=%d weddingActive=%d isCurrent=%d",
              appRequestedIt ? 1 : 0, weddingActive ? 1 : 0, isCurrent ? 1 : 0)

        guard isCurrent, !appRequestedIt, weddingActive else {
            if !isCurrent    { NSLog("⌚️ [ERS]    → stale session (chain-renewal), ignoring") }
            if appRequestedIt{ NSLog("⌚️ [ERS]    → app requested this invalidation, no restart") }
            if !weddingActive{ NSLog("⌚️ [ERS]    → wedding mode off, no restart") }
            return
        }

        // The session died unexpectedly while wedding mode is still active.
        // Try a short-delay restart. This only succeeds if the app is still
        // in an active (or just-backgrounded) context where main queue work runs.
        // If the app is fully suspended the restart will be a no-op — the anchor
        // notification path will naturally restart the session the next time the
        // user opens the app and lowers their wrist.
        pendingRestart = true
        NSLog("⌚️ [ERS]    Scheduling auto-restart in 0.5 s (pendingRestart=true)")

        let workItem = DispatchWorkItem { [weak self] in
            guard let self, self.pendingRestart else {
                NSLog("⌚️ [ERS]    Auto-restart cancelled (pendingRestart cleared)")
                return
            }
            NSLog("⌚️ [ERS]    Executing auto-restart after unexpected invalidation")
            self.pendingRestart = false
            self.startSession(caller: "autoRestart-didInvalidate")
        }
        restartWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5, execute: workItem)
    }

    // MARK: - Anchor notifications

    /// Schedules a repeating, **silent** local notification every 25 minutes.
    ///
    /// Purpose: when watchOS suspends the app and the user returns to the clock face,
    /// this notification appears on the wrist. Tapping it re-opens Lenzu, and the next
    /// wrist-lower triggers `willResignActive` → new ERS session → app stays alive again.
    /// It does NOT wake the app by itself — it is a user-visible "breadcrumb" only.
    private func scheduleAnchorNotifications() {
        let center = UNUserNotificationCenter.current()
        // Remove previous anchor to avoid duplicates if startSession is called more than once.
        center.removePendingNotificationRequests(withIdentifiers: ["lenzu-keepalive-anchor"])

        let content = UNMutableNotificationContent()
        content.title = "Lenzu en curso"
        content.body  = "Toca para volver al timeline"
        content.sound = nil   // silent — no audio during the ceremony

        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: 25 * 60,  // 25 minutes
            repeats: true)
        let request = UNNotificationRequest(
            identifier: "lenzu-keepalive-anchor",
            content: content,
            trigger: trigger)

        center.add(request) { error in
            if let error {
                NSLog("⌚️ [ERS] ⚠️ Anchor notification scheduling failed: %@",
                      error.localizedDescription)
            } else {
                NSLog("⌚️ [ERS] 🔔 Anchor notification scheduled (every 25 min, silent)")
            }
        }
    }

    private func cancelAnchorNotifications() {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: ["lenzu-keepalive-anchor"])
        NSLog("⌚️ [ERS] 🔕 Anchor notifications cancelled")
    }

    // MARK: - Helpers

    private func reasonDescription(
        _ reason: WKExtendedRuntimeSessionInvalidationReason
    ) -> String {
        // Raw values observed in practice (Apple does not document them all publicly).
        // Add new cases here as you discover them from the logs during real events.
        switch reason {
        case .none:
            return "none — app explicitly invalidated the session"
        case .error:
            return "error — system/runtime error (check error object above)"
        default:
            return "unknown(\(reason.rawValue)) — log and file a radar"
        }
    }

    // sessionStateDescription removed — state is now tracked via _isRunning Bool.

    /// Hard-invalidates the session regardless of nil check — used in init to clear stale state.
    private func nukeSession() {
        session?.invalidate()
        session = nil
    }
}

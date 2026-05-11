import WatchKit

/// Provides `WKExtensionDelegate`-based lifecycle hooks as a defense-in-depth layer
/// alongside the `NotificationCenter` observers in `ExtendedRuntimeSessionManager`.
///
/// Both mechanisms target the same events. `startSession()` and `stopSession()` are
/// idempotent (guarded against double calls), so firing twice is harmless.
///
/// Connected to the app via `@WKExtensionDelegateAdaptor` in `LenzuWatchApp`.
class AppLifecycleDelegate: NSObject, WKExtensionDelegate {

    // MARK: - Foreground → Background

    /// Called BEFORE the app loses focus (wrist-lower, Digital Crown press, notification).
    /// This is the ONLY valid window to call `WKExtendedRuntimeSession.start()` and
    /// still be counted as "in the foreground" by watchOS.
    func applicationWillResignActive() {
        let wedding = WatchConnectivityService.shared.weddingModeActive
        let running = ExtendedRuntimeSessionManager.shared.isRunning
        NSLog("⌚️ [Delegate] applicationWillResignActive — weddingMode=%d ersRunning=%d",
              wedding ? 1 : 0, running ? 1 : 0)
        guard wedding else {
            NSLog("⌚️ [Delegate]    Wedding mode off — skipping ERS start")
            return
        }
        ExtendedRuntimeSessionManager.shared.startSession(caller: "Delegate.willResignActive")
    }

    /// Called after the app has fully entered the background. At this point it is too
    /// late to start a new ERS — only log and confirm the session is running.
    func applicationDidEnterBackground() {
        let running = ExtendedRuntimeSessionManager.shared.isRunning
        NSLog("⌚️ [Delegate] applicationDidEnterBackground — ersRunning=%d", running ? 1 : 0)
        if !running && WatchConnectivityService.shared.weddingModeActive {
            NSLog("⌚️ [Delegate] ⚠️ ERS not running in background with wedding mode ON — " +
                  "session was NOT started during willResignActive window (too late now)")
        }
    }

    // MARK: - Background → Foreground

    func applicationWillEnterForeground() {
        NSLog("⌚️ [Delegate] applicationWillEnterForeground")
    }

    /// Called when the app regains focus. Stop any running ERS so it doesn't consume
    /// resources while the app is fully visible and interactive.
    func applicationDidBecomeActive() {
        let running = ExtendedRuntimeSessionManager.shared.isRunning
        NSLog("⌚️ [Delegate] applicationDidBecomeActive — ersRunning=%d → stopping", running ? 1 : 0)
        ExtendedRuntimeSessionManager.shared.stopSession(caller: "Delegate.didBecomeActive")
    }
}

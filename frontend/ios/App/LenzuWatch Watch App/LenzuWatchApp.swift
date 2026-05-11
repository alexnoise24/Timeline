//
//  LenzuWatchApp.swift
//  LenzuWatch Watch App
//
//  Created by Alejandro Obregon on 01/03/26.
//

import SwiftUI

@main
struct LenzuWatchApp: App {
    // Defense-in-depth: AppLifecycleDelegate hooks applicationWillResignActive /
    // applicationDidBecomeActive via the WKExtensionDelegate protocol.
    // ExtendedRuntimeSessionManager ALSO listens via NotificationCenter, so lifecycle
    // events are caught by at least one mechanism even if the other fires late.
    @WKExtensionDelegateAdaptor(AppLifecycleDelegate.self) var lifecycleDelegate

    @StateObject private var connectivity = WatchConnectivityService.shared

    init() {
        // Instantiating the shared instance here registers its NotificationCenter
        // lifecycle observers (willResignActive / didBecomeActive) immediately,
        // before any view is shown.
        _ = ExtendedRuntimeSessionManager.shared
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(connectivity)
                .onAppear {
                    NotificationService.shared.requestPermission()
                }
                .onChange(of: connectivity.weddingModeActive) { _, isActive in
                    print("⌚️ [App] weddingModeActive → \(isActive)")
                    // Wedding mode turned off mid-session → stop immediately
                    if !isActive {
                        ExtendedRuntimeSessionManager.shared.stopSession()
                    }
                }
        }
    }
}

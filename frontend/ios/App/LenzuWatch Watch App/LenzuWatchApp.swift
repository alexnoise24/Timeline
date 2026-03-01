//
//  LenzuWatchApp.swift
//  LenzuWatch Watch App
//
//  Created by Alejandro Obregon on 01/03/26.
//

import SwiftUI

@main
struct LenzuWatchApp: App {
    @StateObject private var connectivity = WatchConnectivityService.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(connectivity)
                .onAppear {
                    NotificationService.shared.requestPermission()
                }
        }
    }
}

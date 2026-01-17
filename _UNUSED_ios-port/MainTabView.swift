//
//  MainTabView.swift
//  Haseeb
//
//  Main container with TabView navigation
//

import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            // MARK: - Home Tab
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
            
            // MARK: - Analytics Tab
            AnalyticsView()
                .tabItem {
                    Label("Analytics", systemImage: "chart.bar.fill")
                }
                .tag(1)
            
            // MARK: - Profile Tab
            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
                .tag(2)
        }
        .accentColor(.blue) // Selected tab color
        .preferredColorScheme(.dark)
        .onAppear {
            // Configure tab bar appearance for glass effect
            let appearance = UITabBarAppearance()
            appearance.configureWithOpaqueBackground()
            
            // Dark translucent background
            appearance.backgroundColor = UIColor(white: 0.05, alpha: 0.95)
            
            // Remove default shadow
            appearance.shadowColor = .clear
            
            // Selected item (blue)
            appearance.stackedLayoutAppearance.selected.iconColor = UIColor(Color.blue)
            appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
                .foregroundColor: UIColor(Color.blue),
                .font: UIFont.systemFont(ofSize: 10, weight: .semibold)
            ]
            
            // Unselected item (white with opacity)
            appearance.stackedLayoutAppearance.normal.iconColor = UIColor(white: 1.0, alpha: 0.5)
            appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
                .foregroundColor: UIColor(white: 1.0, alpha: 0.5),
                .font: UIFont.systemFont(ofSize: 10, weight: .medium)
            ]
            
            UITabBar.appearance().standardAppearance = appearance
            if #available(iOS 15.0, *) {
                UITabBar.appearance().scrollEdgeAppearance = appearance
            }
        }
    }
}

// MARK: - Preview

struct MainTabView_Previews: PreviewProvider {
    static var previews: some View {
        MainTabView()
    }
}

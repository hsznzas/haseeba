//
//  ProfileView.swift
//  Haseeb
//
//  User profile and settings page
//

import SwiftUI

struct ProfileView: View {
    @ObservedObject private var authManager = AuthManager.shared
    @State private var showLogoutAlert = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // MARK: - Spiritual Night Sky Background
                LinearGradient(
                    colors: [
                        Color(hex: "1e1b4b"), // Deep indigo
                        Color(hex: "000000")  // Pure black
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // MARK: - Content
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 24) {
                        // MARK: - Profile Header
                        VStack(spacing: 16) {
                            // Avatar
                            ZStack {
                                Circle()
                                    .fill(.ultraThinMaterial)
                                    .frame(width: 100, height: 100)
                                    .overlay(
                                        Circle()
                                            .strokeBorder(
                                                LinearGradient(
                                                    colors: [.white.opacity(0.3), .white.opacity(0.1)],
                                                    startPoint: .topLeading,
                                                    endPoint: .bottomTrailing
                                                ),
                                                lineWidth: 2
                                            )
                                    )
                                    .shadow(color: .black.opacity(0.3), radius: 15, x: 0, y: 8)
                                
                                Image(systemName: "person.fill")
                                    .font(.system(size: 44, weight: .semibold, design: .rounded))
                                    .foregroundColor(.white.opacity(0.9))
                            }
                            
                            // Name
                            Text("Guest User")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            
                            // Email
                            Text("guest@haseeb.app")
                                .font(.system(size: 15, weight: .medium, design: .rounded))
                                .foregroundColor(.white.opacity(0.6))
                        }
                        .padding(.top, 32)
                        .padding(.bottom, 16)
                        
                        // MARK: - Stats Summary (Glass Cards)
                        HStack(spacing: 12) {
                            statCard(icon: "flame.fill", value: "7", label: "Day Streak")
                            statCard(icon: "checkmark.circle.fill", value: "42", label: "Completed")
                            statCard(icon: "trophy.fill", value: "95%", label: "Success")
                        }
                        .padding(.horizontal, 20)
                        
                        // MARK: - Settings Section
                        VStack(spacing: 12) {
                            sectionHeader("Settings")
                            
                            settingsRow(icon: "bell.fill", title: "Notifications", color: .blue)
                            settingsRow(icon: "globe", title: "Language", color: .green)
                            settingsRow(icon: "paintbrush.fill", title: "Theme", color: .purple)
                            settingsRow(icon: "clock.fill", title: "Reminders", color: .orange)
                        }
                        .padding(.horizontal, 20)
                        
                        // MARK: - Account Section
                        VStack(spacing: 12) {
                            sectionHeader("Account")
                            
                            settingsRow(icon: "person.crop.circle", title: "Edit Profile", color: .cyan)
                            settingsRow(icon: "lock.fill", title: "Privacy", color: .indigo)
                            settingsRow(icon: "questionmark.circle", title: "Help & Support", color: .teal)
                        }
                        .padding(.horizontal, 20)
                        
                        // MARK: - Logout Button
                        Button {
                            showLogoutAlert = true
                        } label: {
                            HStack(spacing: 12) {
                                Image(systemName: "arrow.right.square.fill")
                                    .font(.system(size: 18, weight: .semibold, design: .rounded))
                                
                                Text("Log Out")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 20)
                                    .fill(
                                        LinearGradient(
                                            colors: [.red.opacity(0.8), .red.opacity(0.6)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 20)
                                            .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                                    )
                                    .shadow(color: .red.opacity(0.3), radius: 12, x: 0, y: 6)
                            )
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 24)
                        
                        // App Version
                        Text("Haseeb v1.0.0")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                            .foregroundColor(.white.opacity(0.4))
                            .padding(.top, 16)
                            .padding(.bottom, 32)
                    }
                }
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .preferredColorScheme(.dark)
        .alert("Log Out", isPresented: $showLogoutAlert) {
            Button("Cancel", role: .cancel) { }
            Button("Log Out", role: .destructive) {
                authManager.logout()
            }
        } message: {
            Text("Are you sure you want to log out?")
        }
    }
    
    // MARK: - Stat Card
    
    private func statCard(icon: String, value: String, label: String) -> some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 20, weight: .semibold, design: .rounded))
                .foregroundColor(.blue.opacity(0.9))
            
            Text(value)
                .font(.system(size: 22, weight: .bold, design: .rounded))
                .foregroundColor(.white)
            
            Text(label)
                .font(.system(size: 11, weight: .medium, design: .rounded))
                .foregroundColor(.white.opacity(0.6))
                .lineLimit(1)
                .minimumScaleFactor(0.8)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 16)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        )
    }
    
    // MARK: - Section Header
    
    private func sectionHeader(_ title: String) -> some View {
        HStack {
            Text(title)
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundColor(.white.opacity(0.5))
                .textCase(.uppercase)
            
            Spacer()
        }
        .padding(.horizontal, 4)
        .padding(.top, 8)
    }
    
    // MARK: - Settings Row
    
    private func settingsRow(icon: String, title: String, color: Color) -> some View {
        Button {
            print("⚙️ \(title) tapped")
        } label: {
            HStack(spacing: 14) {
                // Icon
                ZStack {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(color.opacity(0.2))
                        .frame(width: 38, height: 38)
                    
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(color)
                }
                
                // Title
                Text(title)
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                
                Spacer()
                
                // Chevron
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundColor(.white.opacity(0.3))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .strokeBorder(.white.opacity(0.15), lineWidth: 1)
                    )
            )
        }
    }
}

// MARK: - Preview

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
    }
}

//
//  AppRootView.swift
//  Haseeb
//
//  Root view that manages authentication state
//

import SwiftUI

struct AppRootView: View {
    @State private var isLoggedIn: Bool = false
    @State private var isCheckingAuth: Bool = true
    
    var body: some View {
        ZStack {
            if isCheckingAuth {
                // Splash screen while checking auth
                splashScreen
            } else if isLoggedIn {
                // Show main app
                MainTabView()
                    .transition(.opacity.combined(with: .scale))
            } else {
                // Show login
                LoginView(isLoggedIn: $isLoggedIn)
                    .transition(.opacity.combined(with: .scale))
            }
        }
        .onAppear {
            checkAuthStatus()
        }
    }
    
    // MARK: - Splash Screen
    
    private var splashScreen: some View {
        ZStack {
            // Spiritual Night Sky Background
            LinearGradient(
                colors: [
                    Color(hex: "1e1b4b"),
                    Color(hex: "000000")
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 24) {
                // Logo with glow
                ZStack {
                    Circle()
                        .fill(
                            RadialGradient(
                                colors: [.blue.opacity(0.4), .clear],
                                center: .center,
                                startRadius: 0,
                                endRadius: 80
                            )
                        )
                        .frame(width: 160, height: 160)
                        .blur(radius: 20)
                    
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 100, height: 100)
                        .overlay(
                            Circle()
                                .strokeBorder(
                                    LinearGradient(
                                        colors: [.white.opacity(0.4), .white.opacity(0.1)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 2
                                )
                        )
                    
                    Image(systemName: "flame.fill")
                        .font(.system(size: 46, weight: .semibold))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.orange, .red],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                }
                
                // App name
                Text("Haseeb")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                
                // Loading indicator
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white.opacity(0.8)))
                    .scaleEffect(1.2)
                    .padding(.top, 8)
            }
        }
        .preferredColorScheme(.dark)
    }
    
    // MARK: - Check Auth Status
    
    private func checkAuthStatus() {
        print("🔍 Checking authentication status...")
        
        // Simulate checking auth (e.g., validating token)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            // Check if token exists in UserDefaults
            if let token = UserDefaults.standard.string(forKey: "user_session_token"), !token.isEmpty {
                print("✅ Auth token found: \(token.prefix(20))...")
                
                withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                    isLoggedIn = true
                    isCheckingAuth = false
                }
            } else {
                print("⚠️ No auth token found. Showing login screen.")
                
                withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                    isLoggedIn = false
                    isCheckingAuth = false
                }
            }
        }
    }
}

// MARK: - Preview

struct AppRootView_Previews: PreviewProvider {
    static var previews: some View {
        AppRootView()
    }
}

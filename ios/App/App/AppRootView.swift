//
//  AppRootView.swift
//  Haseeb
//
//  Root view that manages authentication state (Fixed with @AppStorage)
//

import SwiftUI

struct AppRootView: View {
    // 🚀 CRITICAL FIX: This variable "watches" the database token in real-time.
    // If ProfileView deletes this token, this View AUTOMATICALLY reloads.
    @AppStorage("user_session_token") private var userToken: String = ""
    
    // We keep this local state just to satisfy the LoginView's requirement for a binding.
    // The actual navigation is now controlled by 'userToken' above.
    @State private var isLoginState: Bool = false
    
    var body: some View {
        ZStack {
            if userToken.isEmpty {
                // 🔴 Token is missing -> Show Login Screen
                LoginView(isLoggedIn: $isLoginState)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
            } else {
                // 🟢 Token exists -> Show Main App
                MainTabView()
                // 🚀 FORCE RESET: This ID ensures that if the token changes/clears,
                // SwiftUI destroys this view and rebuilds the hierarchy from scratch.
                    .id(userToken)
                    .transition(.opacity.combined(with: .move(edge: .bottom)))
            }
        }
        // Smooth animation when switching between Login and Home
        .animation(.spring(response: 0.5, dampingFraction: 0.8), value: userToken.isEmpty)
    }
    
}

  
// MARK: - Color Extension Fix
// (Kept from your original file to ensure colors work)
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}

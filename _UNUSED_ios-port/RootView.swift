//
//  RootView.swift
//  Haseeb
//
//  Root view that controls app authentication flow
//

import SwiftUI

struct RootView: View {
    @StateObject private var authManager = AuthManager.shared
    
    var body: some View {
        Group {
            if authManager.isLoggedIn {
                MainTabView()
                    .transition(.asymmetric(
                        insertion: .move(edge: .trailing).combined(with: .opacity),
                        removal: .move(edge: .leading).combined(with: .opacity)
                    ))
            } else {
                LoginView(isLoggedIn: $authManager.isLoggedIn)
                    .transition(.asymmetric(
                        insertion: .move(edge: .leading).combined(with: .opacity),
                        removal: .move(edge: .trailing).combined(with: .opacity)
                    ))
            }
        }
        .animation(.spring(response: 0.6, dampingFraction: 0.8), value: authManager.isLoggedIn)
    }
}

// MARK: - Preview

struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView()
    }
}

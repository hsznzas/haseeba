//
//  AuthManager.swift
//  Haseeb
//
//  Simple auth helper for login/logout
//

import Foundation
import Combine

class AuthManager: ObservableObject {
    static let shared = AuthManager()
    
    @Published var isLoggedIn: Bool = false
    
    private init() {
        checkAuthStatus()
    }
    
    // MARK: - Check Auth Status
    
    func checkAuthStatus() {
        if let token = UserDefaults.standard.string(forKey: "user_session_token"), !token.isEmpty {
            print("✅ Auth token found: \(token.prefix(20))...")
            isLoggedIn = true
        } else {
            print("⚠️ No auth token found")
            isLoggedIn = false
        }
    }
    
    // MARK: - Login
    
    func login(token: String) {
        UserDefaults.standard.set(token, forKey: "user_session_token")
        print("✅ Token saved: \(token.prefix(20))...")
        isLoggedIn = true
    }
    
    // MARK: - Logout
    
    func logout() {
        UserDefaults.standard.removeObject(forKey: "user_session_token")
        print("🚪 User logged out - token cleared")
        isLoggedIn = false
    }
}

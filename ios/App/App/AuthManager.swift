//
//  AuthManager.swift
//  Haseeb
//
//  Real Supabase Authentication
//

import Foundation
import Combine

// ✅ BRIDGE: Simple Session struct to satisfy HabitService
struct Session {
    let accessToken: String
}

class AuthManager: ObservableObject {
    static let shared = AuthManager()
    
    @Published var isLoggedIn: Bool = false
    
    // ✅ BRIDGE: This is the specific variable HabitService is looking for
    var session: Session? {
        if let token = UserDefaults.standard.string(forKey: "user_session_token"), !token.isEmpty {
            return Session(accessToken: token)
        }
        return nil
    }
    
    // ✅ Access Token helper (just in case other views need it directly)
    var accessToken: String? {
        return UserDefaults.standard.string(forKey: "user_session_token")
    }
    
    // API Keys
    private let baseURL = "https://aaeanbogmiqwxnihvnsg.supabase.co"
    private let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWFuYm9nbWlxd3huaWh2bnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDgxNzMsImV4cCI6MjA3OTMyNDE3M30.EjimV2EZnmwtljQ-1r8XR4g5Ok14oOmDITtgv5yvWkU"
    
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
    
    // MARK: - Sign In (Real Network Call)
    func signIn(email: String, password: String) async throws {
        let url = URL(string: "\(baseURL)/auth/v1/token?grant_type=password")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = [
            "email": email,
            "password": password
        ]
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "Auth", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        if httpResponse.statusCode != 200 {
            if let errorJson = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let msg = errorJson["error_description"] as? String {
                throw NSError(domain: "Auth", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: msg])
            }
            throw NSError(domain: "Auth", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Login failed (HTTP \(httpResponse.statusCode))"])
        }
        
        let decodedResponse = try JSONDecoder().decode(SupabaseAuthResponse.self, from: data)
        
        await MainActor.run {
            UserDefaults.standard.set(decodedResponse.access_token, forKey: "user_session_token")
            UserDefaults.standard.set(decodedResponse.refresh_token, forKey: "user_refresh_token")
            self.isLoggedIn = true
            print("✅ Real Token Saved: \(decodedResponse.access_token.prefix(20))...")
        }
    }
    
    // MARK: - Manual Login (For Demo Mode)
    func login(token: String) {
        UserDefaults.standard.set(token, forKey: "user_session_token")
        print("✅ Token saved manually: \(token.prefix(20))...")
        isLoggedIn = true
    }
    
    // MARK: - Logout
    func logout() {
        UserDefaults.standard.removeObject(forKey: "user_session_token")
        UserDefaults.standard.removeObject(forKey: "user_refresh_token")
        print("🚪 User logged out - tokens cleared")
        isLoggedIn = false
    }
}

// Helper Structs for Parsing
struct SupabaseAuthResponse: Codable {
    let access_token: String
    let refresh_token: String
    let user: SupabaseUser
}

struct SupabaseUser: Codable {
    let id: String
    let email: String?
}

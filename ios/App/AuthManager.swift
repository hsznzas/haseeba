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
    
    // MARK: - Sign In with Supabase
    
    func signIn(email: String, password: String) async throws {
        let baseURL = "https://aaeanbogmiqwxnihvnsg.supabase.co"
        let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWFuYm9nbWlxd3huaWh2bnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDgxNzMsImV4cCI6MjA3OTMyNDE3M30.EjimV2EZnmwtljQ-1r8XR4g5Ok14oOmDITtgv5yvWkU"
        
        guard let url = URL(string: "\(baseURL)/auth/v1/token?grant_type=password") else {
            throw NSError(domain: "AuthManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = [
            "email": email,
            "password": password
        ]
        
        request.httpBody = try JSONEncoder().encode(body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "AuthManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        // Handle HTTP errors
        guard httpResponse.statusCode == 200 else {
            // Try to parse error message from Supabase
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let errorMsg = json["error_description"] as? String ?? json["msg"] as? String {
                throw NSError(domain: "AuthManager", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMsg])
            }
            throw NSError(domain: "AuthManager", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Authentication failed with status \(httpResponse.statusCode)"])
        }
        
        // Parse response to get access token
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let authResponse = try decoder.decode(AuthResponse.self, from: data)
        
        // Save the access token (JWT) - this is what RLS policies check!
        await MainActor.run {
            self.login(token: authResponse.accessToken)
        }
        
        print("✅ Successfully authenticated with Supabase")
        print("📝 User ID: \(authResponse.user.id)")
    }
    
    // MARK: - Logout
    
    func logout() {
        UserDefaults.standard.removeObject(forKey: "user_session_token")
        print("🚪 User logged out - token cleared")
        isLoggedIn = false
    }
}
// MARK: - Auth Response Models

private struct AuthResponse: Codable {
    let accessToken: String
    let tokenType: String
    let expiresIn: Int
    let refreshToken: String
    let user: AuthUser
}

private struct AuthUser: Codable {
    let id: String
    let email: String
    let emailConfirmedAt: String?
}


import Foundation

// MARK: - The Data Service
class HabitService {
    static let shared = HabitService()
    
    // MARK: - Configuration
    private let baseURL = "https://aaeanbogmiqwxnihvnsg.supabase.co"
    private let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWFuYm9nbWlxd3huaWh2bnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDgxNzMsImV4cCI6MjA3OTMyNDE3M30.EjimV2EZnmwtljQ-1r8XR4g5Ok14oOmDITtgv5yvWkU"
    
    // MARK: - Auth (Login)
    struct AuthResponse: Decodable {
        let accessToken: String
    }
    
    func signIn(email: String, password: String) async throws -> String {
        guard let url = URL(string: "\(baseURL)/auth/v1/token?grant_type=password") else { throw URLError(.badURL) }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
            throw NSError(domain: "Auth", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "Login Failed"])
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        let authData = try decoder.decode(AuthResponse.self, from: data)
        return authData.accessToken
    }
    
    // MARK: - Fetch Habits (With Diagnostics)
    func fetchHabits(userToken: String) async throws -> [Habit] {
        // Raw URL to get all data
        guard let url = URL(string: "\(baseURL)/rest/v1/habits?select=*") else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        // 1. Check Server Status
        if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
            print("❌ Server Error: \(httpResponse.statusCode)")
            throw URLError(.badServerResponse)
        }
        
        // 2. DEBUG: Print the Raw JSON so we can see what Supabase sent
        if let jsonString = String(data: data, encoding: .utf8) {
            print("📦 RAW JSON FROM DB: \(jsonString)")
        }
        
        // 3. Decode with specific error catching
        let decoder = JSONDecoder()
        
        do {
            return try decoder.decode([Habit].self, from: data)
        } catch let DecodingError.keyNotFound(key, context) {
            print("❌ CRASH CAUSE: Missing Key '\(key.stringValue)'")
            print("   👉 Your 'Habit' struct expects '\(key.stringValue)', but the Database didn't send it.")
            print("   👉 Fix: Add column '\(key.stringValue)' to Supabase OR make it Optional in Models.swift.")
            throw DecodingError.keyNotFound(key, context)
        } catch let DecodingError.valueNotFound(value, context) {
            print("❌ CRASH CAUSE: Value not found for '\(value)'")
            print("   👉 The Database returned null, but Swift expected a value.")
            throw DecodingError.valueNotFound(value, context)
        } catch let DecodingError.typeMismatch(type, context) {
            print("❌ CRASH CAUSE: Type Mismatch for \(type)")
            print("   👉 Path: \(context.codingPath)")
            throw DecodingError.typeMismatch(type, context)
        } catch {
            print("❌ Unknown Decode Error: \(error)")
            throw error
        }
    }
    
    // MARK: - Real Network Methods
        
        func fetchLogs(userToken: String, startDate: String, endDate: String) async throws -> [HabitLog] {
            var components = URLComponents(string: "\(baseURL)/rest/v1/habit_logs")
            
            components?.queryItems = [
                URLQueryItem(name: "select", value: "*"),
                URLQueryItem(name: "log_date", value: "gte.\(startDate)"), // ✅ Uses correct column
                URLQueryItem(name: "log_date", value: "lte.\(endDate)")
            ]
            
            guard let url = components?.url else { throw URLError(.badURL) }
            
            var request = URLRequest(url: url)
            request.httpMethod = "GET"
            request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
            request.setValue(apiKey, forHTTPHeaderField: "apikey")
            
            let (data, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
                print("❌ Fetch Logs Error: \(httpResponse.statusCode)")
                print(String(data: data, encoding: .utf8) ?? "No Error Body")
                throw URLError(.badServerResponse)
            }
            
            let decoder = JSONDecoder()
            // ❌ REMOVED: .convertFromSnakeCase (HabitLog handles this now)
            return try decoder.decode([HabitLog].self, from: data)
        }
        
        func saveLog(userToken: String, log: HabitLog) async throws {
            guard let url = URL(string: "\(baseURL)/rest/v1/habit_logs") else { throw URLError(.badURL) }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
            request.setValue(apiKey, forHTTPHeaderField: "apikey")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
            
            let encoder = JSONEncoder()
            // ❌ REMOVED: .convertToSnakeCase (HabitLog handles this now)
            let jsonData = try encoder.encode(log)
            request.httpBody = jsonData
            
            if let jsonString = String(data: jsonData, encoding: .utf8) {
                print("📤 Sending Log: \(jsonString)")
            }
            
            let (_, response) = try await URLSession.shared.data(for: request)
            
            if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
                print("❌ Save Log Failed: \(httpResponse.statusCode)")
                throw URLError(.badServerResponse)
            }
        }
    /// Delete a log from Supabase
    func deleteLog(userToken: String, logId: String) async throws {
        // Query: Delete where id equals logId
        guard let url = URL(string: "\(baseURL)/rest/v1/habit_logs?id=eq.\(logId)") else { throw URLError(.badURL) }
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        if let httpResponse = response as? HTTPURLResponse, !(200...299).contains(httpResponse.statusCode) {
            print("❌ Delete Log Failed: \(httpResponse.statusCode)")
            throw URLError(.badServerResponse)
        }
    }
    
    // Placeholder for order update (can be implemented later)
    func updateHabitsOrder(userToken: String, habits: [Habit]) async throws {}
}


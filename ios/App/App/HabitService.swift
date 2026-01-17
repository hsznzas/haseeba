//
//  HabitService.swift
//  Haseeb
//
//  Backend API service for fetching habits and logs
//

import Foundation

class HabitService {
    static let shared = HabitService()
    
    // MARK: - Configuration
    private let supabaseUrl = "https://aaeanbogmiqwxnihvnsg.supabase.co"
    // Use the API key from your logs/previous code
    private let apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhZWFuYm9nbWlxd3huaWh2bnNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDgxNzMsImV4cCI6MjA3OTMyNDE3M30.EjimV2EZnmwtljQ-1r8XR4g5Ok14oOmDITtgv5yvWkU"
    
    private init() {}
    
    // MARK: - Helpers
    private func getAuthHeader() -> String {
        if let session = AuthManager.shared.session {
            return "Bearer \(session.accessToken)"
        }
        return "Bearer \(apiKey)"
    }
    
    // MARK: - Fetch Habits
    func fetchHabits() async throws -> [Habit] {
        // ✅ FIX: Uses 'is_active' and 'order_index' (Matches DB Report)
        let url = URL(string: "\(supabaseUrl)/rest/v1/habits?select=*&is_active=eq.true&order=order_index.asc")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue(getAuthHeader(), forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        if httpResponse.statusCode != 200 {
            if let errorText = String(data: data, encoding: .utf8) {
                print("❌ SUPABASE ERROR (Fetch Habits): \(errorText)")
            }
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode([Habit].self, from: data)
    }
    
    // MARK: - Fetch Logs
    func fetchLogs(startDate: String, endDate: String) async throws -> [HabitLog] {
        // ✅ FIX: Uses 'log_date', sorted DESC to get newest first, limit 2000
        let url = URL(string: "\(supabaseUrl)/rest/v1/habit_logs?select=*&log_date=gte.\(startDate)&log_date=lte.\(endDate)&order=log_date.desc&limit=2000")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue(getAuthHeader(), forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        if httpResponse.statusCode != 200 {
            if let errorText = String(data: data, encoding: .utf8) {
                print("❌ SUPABASE ERROR (Fetch Logs): \(errorText)")
            }
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        return try decoder.decode([HabitLog].self, from: data)
    }
    
    // MARK: - Save Log
    func saveLog(log: HabitLog) async throws {
        let url = URL(string: "\(supabaseUrl)/rest/v1/habit_logs")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        request.setValue(getAuthHeader(), forHTTPHeaderField: "Authorization")
        
        let encoder = JSONEncoder()
        let jsonData = try encoder.encode(log) // CodingKeys will convert 'count' -> 'value'
        request.httpBody = jsonData
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }

        if !(200...299).contains(httpResponse.statusCode) {
            if let errorText = String(data: data, encoding: .utf8) {
                print("❌ SUPABASE ERROR (Save): \(errorText)")
            }
            throw URLError(.badServerResponse)
        }
    }
    
    // MARK: - Delete Log
    func deleteLog(logId: String) async throws {
        let url = URL(string: "\(supabaseUrl)/rest/v1/habit_logs?id=eq.\(logId)")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue(getAuthHeader(), forHTTPHeaderField: "Authorization")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }
    
    // MARK: - Update Order
    func updateHabitsOrder(habits: [Habit]) async throws {
        for habit in habits {
            let url = URL(string: "\(supabaseUrl)/rest/v1/habits?id=eq.\(habit.id)")!
            var request = URLRequest(url: url)
            request.httpMethod = "PATCH"
            request.setValue(apiKey, forHTTPHeaderField: "apikey")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue(getAuthHeader(), forHTTPHeaderField: "Authorization")
            
            // ✅ FIX: Uses 'order_index' (Matches DB Report)
            let body = ["order_index": habit.order]
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            let _ = try await URLSession.shared.data(for: request)
        }
    }
    
    // MARK: - Create Habit
    func createHabit(name: String, emoji: String, type: HabitType = .regular, dailyTarget: Int = 1) async throws {
        let url = URL(string: "\(supabaseUrl)/rest/v1/habits")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        request.setValue(getAuthHeader(), forHTTPHeaderField: "Authorization")
        
        // Build the habit payload
        // Note: user_id is typically auto-filled by RLS policies in Supabase
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let today = dateFormatter.string(from: Date())
        
        var body: [String: Any] = [
            "name": name,
            "emoji": emoji,
            "type": type.rawValue,
            "daily_target": dailyTarget,
            "is_active": true,
            "order_index": 99, // Will be placed at the end
            "start_date": today
        ]
        
        // Add user_id if we have one stored
        if let userId = UserDefaults.standard.string(forKey: "user_id") {
            body["user_id"] = userId
        }
        
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        if !(200...299).contains(httpResponse.statusCode) {
            if let errorText = String(data: data, encoding: .utf8) {
                print("❌ SUPABASE ERROR (Create Habit): \(errorText)")
            }
            throw URLError(.badServerResponse)
        }
        
        print("✅ Habit created successfully: \(name)")
    }
}

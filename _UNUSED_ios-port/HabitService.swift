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
    
    // TODO: Replace with your actual Supabase URL
    private let baseURL = "https://YOUR_SUPABASE_URL.supabase.co"
    private let apiKey = "YOUR_SUPABASE_ANON_KEY"
    
    private init() {}
    
    // MARK: - Fetch Habits
    
    /// Fetch all active habits for the authenticated user
    func fetchHabits(userToken: String) async throws -> [Habit] {
        let url = URL(string: "\(baseURL)/rest/v1/habits?select=*&isActive=eq.true&order=order.asc")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "HabitService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NSError(domain: "HabitService", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP \(httpResponse.statusCode)"])
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let habits = try decoder.decode([Habit].self, from: data)
        return habits
    }
    
    // MARK: - Fetch Logs
    
    /// Fetch logs for a date range
    func fetchLogs(userToken: String, startDate: String, endDate: String) async throws -> [HabitLog] {
        let url = URL(string: "\(baseURL)/rest/v1/habit_logs?select=*&date=gte.\(startDate)&date=lte.\(endDate)&order=date.desc")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "HabitService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        guard httpResponse.statusCode == 200 else {
            throw NSError(domain: "HabitService", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP \(httpResponse.statusCode)"])
        }
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let logs = try decoder.decode([HabitLog].self, from: data)
        return logs
    }
    
    // MARK: - Save Log
    
    /// Save a new habit log
    func saveLog(userToken: String, log: HabitLog) async throws {
        let url = URL(string: "\(baseURL)/rest/v1/habit_logs")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("return=minimal", forHTTPHeaderField: "Prefer")
        
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        
        let jsonData = try encoder.encode(log)
        request.httpBody = jsonData
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "HabitService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw NSError(domain: "HabitService", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP \(httpResponse.statusCode)"])
        }
    }
    
    // MARK: - Delete Log
    
    /// Delete a habit log by ID
    func deleteLog(userToken: String, logId: String) async throws {
        let url = URL(string: "\(baseURL)/rest/v1/habit_logs?id=eq.\(logId)")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        
        let (_, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NSError(domain: "HabitService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"])
        }
        
        guard (200...299).contains(httpResponse.statusCode) else {
            throw NSError(domain: "HabitService", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: "HTTP \(httpResponse.statusCode)"])
        }
    }
    
    // MARK: - Update Habit Order
    
    /// Update the order of multiple habits
    func updateHabitsOrder(userToken: String, habits: [Habit]) async throws {
        // Batch update habit orders
        for habit in habits {
            let url = URL(string: "\(baseURL)/rest/v1/habits?id=eq.\(habit.id)")!
            
            var request = URLRequest(url: url)
            request.httpMethod = "PATCH"
            request.setValue("Bearer \(userToken)", forHTTPHeaderField: "Authorization")
            request.setValue(apiKey, forHTTPHeaderField: "apikey")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            
            let body = ["order": habit.order]
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
            
            let (_, response) = try await URLSession.shared.data(for: request)
            
            guard let httpResponse = response as? HTTPURLResponse,
                  (200...299).contains(httpResponse.statusCode) else {
                throw NSError(domain: "HabitService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to update habit order"])
            }
        }
    }
}

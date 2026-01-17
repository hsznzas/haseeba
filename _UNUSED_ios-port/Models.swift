//
//  Models.swift
//  Haseeb
//
//  Data models matching the TypeScript interfaces
//

import Foundation
import SwiftUI

// MARK: - Enums

enum HabitType: String, Codable {
    case regular = "REGULAR"
    case prayer = "PRAYER"
    case counter = "COUNTER"
}

enum LogStatus: String, Codable {
    case done = "DONE"
    case fail = "FAIL"
    case skip = "SKIP"
    case excused = "EXCUSED"
}

enum PrayerQuality: Int, Codable {
    case missed = 0
    case onTime = 1
    case jamaa = 2
    case takbirah = 3
}

// MARK: - Habit Model

struct Habit: Identifiable, Codable, Equatable {
    let id: String
    var name: String
    var nameAr: String
    var type: HabitType
    var emoji: String?
    var icon: String?
    var color: String?
    var dailyTarget: Int?
    var presetId: String?
    var isActive: Bool
    var order: Int
    var startDate: String?
    var isArchived: Bool?
    var requireReason: Bool?
    var affectsScore: Bool?
    var createdAt: String?
    var updatedAt: String?
    
    // Computed property for display name based on language
    func displayName(language: String) -> String {
        return language == "ar" ? nameAr : name
    }
    
    // Check if habit should be visible on a given date
    func shouldShow(on date: Date, dayOfWeek: Int) -> Bool {
        guard isActive else { return false }
        
        // Check start date
        if let startDateStr = startDate {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            if let startDate = formatter.date(from: startDateStr),
               date < startDate {
                return false
            }
        }
        
        // Special fasting habits
        if id == "fasting_monday" {
            return dayOfWeek == 2 // Monday (Swift Calendar uses 1=Sunday, 2=Monday)
        }
        
        if id == "fasting_thursday" {
            return dayOfWeek == 5 // Thursday
        }
        
        return true
    }
}

// MARK: - HabitLog Model

struct HabitLog: Identifiable, Codable, Equatable {
    let id: String
    var habitId: String
    var date: String // Format: "yyyy-MM-dd"
    var value: Int
    var status: LogStatus?
    var notes: String?
    var timestamp: Double
    var reason: String?
    
    // Check if log represents success
    func isSuccessful(for habit: Habit) -> Bool {
        switch habit.type {
        case .prayer:
            return value == PrayerQuality.takbirah.rawValue
        case .counter:
            let target = habit.dailyTarget ?? 1
            return value >= target || status == .done
        case .regular:
            return status == .done
        }
    }
}

// MARK: - User Preferences

struct UserPreferences: Codable {
    var language: String
    var gender: String
    var isExcused: Bool
    var showHijri: Bool
    var dateOfBirth: String?
    var theme: String
    
    static let defaultPreferences = UserPreferences(
        language: "en",
        gender: "male",
        isExcused: false,
        showHijri: true,
        dateOfBirth: nil,
        theme: "dark"
    )
}

// MARK: - Daily Stats

struct DailyStats {
    var done: Int = 0
    var failed: Int = 0
    var pending: Int = 0
}

// MARK: - Color Extension

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
            (a, r, g, b) = (255, 255, 255, 255)
        }

        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}


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
    // ✅ FIX: Changed ID to String to match 'id (text)' in DB Report
    let id: String
    let userId: String?
    
    var nameEn: String
    var nameAr: String?
    var type: HabitType?
    
    // ✅ FIX: Added 'emoji' from DB Report
    var emoji: String?
    
    // Optional properties (Some might not be in DB, so we make them optional)
    var color: String? // Not in DB Report, but needed for UI (will be nil if fetched)
    var unit: String?  // Not in DB Report
    
    var targetCount: Int?
    var presetId: String?
    var isActive: Bool
    var order: Int
    var startDate: String?
    var requireReason: Bool?
    var affectsScore: Bool?
    var createdAt: String?
    
    // ✅ CRITICAL: Map Swift names to YOUR Database columns
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case nameEn = "name"       // Report says 'name'
        case nameAr = "name_ar"
        case type
        case emoji                 // Report says 'emoji'
        case color                 // Will be ignored if missing in DB
        case unit                  // Will be ignored if missing in DB
        case targetCount = "daily_target" // Report says 'daily_target'
        case presetId = "preset_id"
        case isActive = "is_active"
        case order = "order_index" // Report says 'order_index'
        case startDate = "start_date"
        case requireReason = "require_reason"
        case affectsScore = "affects_score"
        case createdAt = "created_at"
    }
    
    func displayName(language: String) -> String {
        if language == "ar", let arabic = nameAr, !arabic.isEmpty {
            return arabic
        }
        return nameEn
    }
    
    func shouldShow(on date: Date, dayOfWeek: Int) -> Bool {
        guard isActive else { return false }
        
        // Check start date if present
        if let startDateStr = startDate {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withFullDate] // "yyyy-MM-dd"
            if let start = formatter.date(from: startDateStr), date < start {
                return false
            }
        }
        
        if nameEn.lowercased().contains("monday") && type == .regular {
             return dayOfWeek == 2
        }
        if nameEn.lowercased().contains("thursday") && type == .regular {
             return dayOfWeek == 5
        }
        return true
    }
}

// MARK: - Habit Log Model
struct HabitLog: Identifiable, Codable {
    // ✅ FIX: Changed ID to String to match DB
    let id: String?
    let userId: String?
    let habitId: String
    
    let count: Int
    let date: String
    let completedAt: String?
    let status: LogStatus?
    let notes: String?
    let reason: String?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case habitId = "habit_id"
        case count = "value"       // ✅ FIX: Report says 'value'
        case date = "log_date"     // ✅ FIX: Report says 'log_date'
        case completedAt = "completed_at"
        case status
        case notes
        case reason
    }
    
    // Custom Encoder
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encodeIfPresent(id, forKey: .id)
        try container.encode(habitId, forKey: .habitId)
        try container.encode(count, forKey: .count)
        try container.encode(date, forKey: .date)
        try container.encodeIfPresent(completedAt, forKey: .completedAt)
        try container.encodeIfPresent(userId, forKey: .userId)
        try container.encodeIfPresent(status, forKey: .status)
        try container.encodeIfPresent(notes, forKey: .notes)
        try container.encodeIfPresent(reason, forKey: .reason)
    }
    
    func isSuccessful(for habit: Habit) -> Bool {
        guard let type = habit.type else { return count > 0 }
        switch type {
        case .prayer:
            return count >= PrayerQuality.takbirah.rawValue
        case .counter:
            let target = habit.targetCount ?? 1
            return count >= target
        case .regular:
            if let s = status, s == .done { return true }
            return count > 0
        }
    }
}

// MARK: - User Preferences (Matches Report)
struct UserPreferences: Codable {
    var language: String
    var gender: String
    var showHijri: Bool
    var dateOfBirth: String?
    
    // Not in DB report, but kept for UI state (won't be fetched if not in CodingKeys)
    var isExcused: Bool = false
    var theme: String = "dark"
    
    enum CodingKeys: String, CodingKey {
        case language
        case gender
        case showHijri = "show_hijri"
        case dateOfBirth = "date_of_birth"
    }
    
    static let defaultPreferences = UserPreferences(
        language: "en",
        gender: "male",
        showHijri: true,
        dateOfBirth: nil,
        isExcused: false,
        theme: "dark"
    )
}

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

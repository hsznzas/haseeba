import Foundation

// MARK: - Enums
enum HabitType: String, Codable {
    case prayer = "PRAYER"
    case regular = "REGULAR"
    case counter = "COUNTER"
}

enum LogStatus: String, Codable {
    case done = "DONE"
    case fail = "FAIL"
    case excused = "EXCUSED"
}

// MARK: - Habit Model
struct Habit: Identifiable, Codable {
    let id: String
    let name: String
    let nameAr: String?
    let type: HabitType
    let emoji: String?
    let dailyTarget: Int?
    let presetId: String?
    let isActive: Bool
    let orderIndex: Int
    let startDate: String?
    let requireReason: Bool?
    let affectsScore: Bool?
    
    // ✅ CRITICAL FIX: Explicitly map DB columns (snake_case) to Swift properties (camelCase)
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case nameAr = "name_ar"
        case type
        case emoji
        case dailyTarget = "daily_target"
        case presetId = "preset_id"
        case isActive = "is_active"       // 👈 This fixes the crash!
        case orderIndex = "order_index"
        case startDate = "start_date"
        case requireReason = "require_reason"
        case affectsScore = "affects_score"
    }
    
    // Helper to check if it should show on a specific day
    func shouldShow(on date: Date, dayOfWeek: Int) -> Bool {
        return isActive
    }
}

// MARK: - Habit Log Model
struct HabitLog: Identifiable, Codable {
    let id: String
    let habitId: String
    let date: String
    let value: Int
    let status: LogStatus?
    let notes: String?
    
    // Internal fields (NOT sent to Supabase)
    var timestamp: Double? = nil
    var reason: String? = nil
    
    enum CodingKeys: String, CodingKey {
        case id
        case habitId = "habit_id"
        case date = "log_date"
        case value
        case status
        case notes
        // timestamp & reason are omitted so they aren't sent
    }
}

// MARK: - User Preferences
struct UserPreferences: Codable {
    var notificationsEnabled: Bool
    var theme: String
    static let defaultPreferences = UserPreferences(notificationsEnabled: true, theme: "dark")
}

// MARK: - Stats
struct DailyStats {
    var done: Int = 0
    var failed: Int = 0
    var pending: Int = 0
}

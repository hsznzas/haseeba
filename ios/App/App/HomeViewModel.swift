//
//  HomeViewModel.swift
//  Haseeb
//
//  View model for Home screen with full data cycle
//

import Foundation
import SwiftUI

@MainActor
class HomeViewModel: ObservableObject {
    // MARK: - Published Properties
    
    @Published var habits: [Habit] = []
    @Published var logs: [HabitLog] = []
    @Published var selectedDate: Date = Date()
    @Published var preferences: UserPreferences = .defaultPreferences
    @Published var userName: String = "Guest"
    @Published var isSortMode: Bool = false
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    
    // MARK: - Computed Properties
    
    var selectedDateString: String {
        dateFormatter.string(from: selectedDate)
    }
    
    // Filter habits visible on selected date
    var visibleHabits: [Habit] {
        let dayOfWeek = Calendar.current.component(.weekday, from: selectedDate)
        return habits
            .filter { $0.shouldShow(on: selectedDate, dayOfWeek: dayOfWeek) }
            .sorted { $0.order < $1.order }
    }
    
    // Separate core and bonus habits
    var coreHabits: [Habit] {
        visibleHabits.filter { $0.affectsScore != false }
    }
    
    var bonusHabits: [Habit] {
        visibleHabits.filter { $0.affectsScore == false }
    }
    
    // MARK: - Private Properties
    
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    
    private var userToken: String?
    
    // MARK: - Initialization
    
    init() {
        print("🚀 HomeViewModel initializing...")
        
        // Read auth token from UserDefaults (Capacitor Preferences saves here)
        if let token = UserDefaults.standard.string(forKey: "user_session_token"), !token.isEmpty {
            self.userToken = token
            print("✅ Auth token found: \(token.prefix(20))...")
            
            // Fetch real data from backend
            Task {
                await fetchData()
            }
        } else {
            print("⚠️ No auth token found. Loading dummy data for UI preview.")
            loadDummyData()
        }
    }
    
    // MARK: - Public Methods - Data Fetching
    
    /// Fetch habits and logs from backend
    func fetchData() async {
        guard let token = userToken else {
            print("❌ Cannot fetch data: No auth token")
            loadDummyData()
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            print("📡 Fetching habits from backend...")
            
            // Call HabitService to fetch habits
            let fetchedHabits = try await HabitService.shared.fetchHabits(userToken: token)
            
            print("✅ Successfully fetched \(fetchedHabits.count) habits")
            
            // Update published properties on main actor
            await MainActor.run {
                self.habits = fetchedHabits
                self.isLoading = false
            }
            
            // Fetch logs for the selected date range
            await fetchLogs()
            
        } catch {
            print("❌ Failed to fetch habits: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            isLoading = false
            
            // Fallback to dummy data so UI is still visible
            print("🔄 Falling back to dummy data for UI testing")
            loadDummyData()
        }
    }
    
    /// Fetch logs from backend
    private func fetchLogs() async {
        guard let token = userToken else { return }
        
        do {
            print("📡 Fetching logs from backend...")
            
            // Fetch logs for last 30 days (for streak calculation)
            let startDate = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
            let endDate = Date()
            
            let fetchedLogs = try await HabitService.shared.fetchLogs(
                userToken: token,
                startDate: dateFormatter.string(from: startDate),
                endDate: dateFormatter.string(from: endDate)
            )
            
            print("✅ Successfully fetched \(fetchedLogs.count) logs")
            
            await MainActor.run {
                self.logs = fetchedLogs
            }
            
        } catch {
            print("⚠️ Failed to fetch logs: \(error.localizedDescription)")
            // Continue with empty logs
        }
    }
    
    /// Refresh data (pull-to-refresh)
    func refreshData() async {
        print("🔄 Refreshing data...")
        await fetchData()
    }
    
    // MARK: - Public Methods - Habit Actions
    
    /// Toggle habit status (mark as done/fail/delete)
    func toggleHabit(id: String, value: Int, status: LogStatus) {
        let logId = "\(id)-\(selectedDateString)"
        
        // Check if log already exists
        if let index = logs.firstIndex(where: { $0.id == logId }) {
            // Remove existing log (optimistic update)
            logs.remove(at: index)
            
            // If we have a token, sync to backend
            if let token = userToken {
                Task {
                    do {
                        try await HabitService.shared.deleteLog(
                            userToken: token,
                            logId: logId
                        )
                        print("✅ Log deleted from backend")
                    } catch {
                        print("❌ Failed to delete log: \(error.localizedDescription)")
                        // Re-add log on failure
                        await MainActor.run {
                            self.logs.insert(HabitLog(
                                id: logId,
                                habitId: id,
                                date: selectedDateString,
                                value: value,
                                status: status,
                                notes: nil,
                                timestamp: Date().timeIntervalSince1970,
                                reason: nil
                            ), at: index)
                        }
                    }
                }
            }
        } else {
            // Add new log (optimistic update)
            let newLog = HabitLog(
                id: logId,
                habitId: id,
                date: selectedDateString,
                value: value,
                status: status,
                notes: nil,
                timestamp: Date().timeIntervalSince1970,
                reason: nil
            )
            logs.append(newLog)
            
            // If we have a token, sync to backend
            if let token = userToken {
                Task {
                    do {
                        try await HabitService.shared.saveLog(
                            userToken: token,
                            log: newLog
                        )
                        print("✅ Log saved to backend")
                    } catch {
                        print("❌ Failed to save log: \(error.localizedDescription)")
                        // Remove log on failure
                        await MainActor.run {
                            self.logs.removeAll { $0.id == logId }
                        }
                    }
                }
            }
        }
    }
    
    /// Delete log for a habit on selected date
    func deleteLog(habitId: String) {
        let logId = "\(habitId)-\(selectedDateString)"
        logs.removeAll { $0.habitId == habitId && $0.date == selectedDateString }
        
        // If we have a token, sync to backend
        if let token = userToken {
            Task {
                do {
                    try await HabitService.shared.deleteLog(
                        userToken: token,
                        logId: logId
                    )
                    print("✅ Log deleted from backend")
                } catch {
                    print("❌ Failed to delete log: \(error.localizedDescription)")
                }
            }
        }
    }
    
    /// Get log for specific habit on selected date
    func getLog(for habitId: String) -> HabitLog? {
        logs.first { $0.habitId == habitId && $0.date == selectedDateString }
    }
    
    /// Calculate streak for a habit as of selected date
    func calculateStreak(for habit: Habit) -> Int {
        let habitLogs = logs.filter { $0.habitId == habit.id }
            .sorted { $0.date < $1.date }
        
        var currentStreak = 0
        var checkDate = selectedDate
        
        // Get log for selected date
        let selectedLog = habitLogs.first { $0.date == selectedDateString }
        
        // Check if selected date has successful log or is excused
        if let log = selectedLog {
            if log.status == .excused {
                // Excused day - continue checking backwards
                checkDate = Calendar.current.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
            } else if log.isSuccessful(for: habit) {
                currentStreak = 1
                checkDate = Calendar.current.date(byAdding: .day, value: -1, to: selectedDate) ?? selectedDate
            } else {
                return 0
            }
        } else {
            return 0
        }
        
        // Check backwards for consecutive days
        while true {
            let checkDateStr = dateFormatter.string(from: checkDate)
            
            // Check if before habit start date
            if let startDateStr = habit.startDate,
               let startDate = dateFormatter.date(from: startDateStr),
               checkDate < startDate {
                break
            }
            
            if let log = habitLogs.first(where: { $0.date == checkDateStr }) {
                if log.status == .excused {
                    // Excused day - bridge, don't increment but continue
                    if let newDate = Calendar.current.date(byAdding: .day, value: -1, to: checkDate) {
                        checkDate = newDate
                        continue
                    } else {
                        break
                    }
                } else if log.isSuccessful(for: habit) {
                    currentStreak += 1
                    if let newDate = Calendar.current.date(byAdding: .day, value: -1, to: checkDate) {
                        checkDate = newDate
                    } else {
                        break
                    }
                } else {
                    break
                }
            } else {
                break
            }
        }
        
        return currentStreak
    }
    
    /// Calculate stats for a specific date
    func calculateStats(for date: Date) -> DailyStats {
        let dateStr = dateFormatter.string(from: date)
        let dayLogs = logs.filter { $0.date == dateStr }
        let dayOfWeek = Calendar.current.component(.weekday, from: date)
        
        var stats = DailyStats()
        
        let habitsForDate = habits.filter { $0.shouldShow(on: date, dayOfWeek: dayOfWeek) }
        
        for habit in habitsForDate {
            if let log = dayLogs.first(where: { $0.habitId == habit.id }) {
                // Has log
                if habit.type == .prayer {
                    if log.value >= PrayerQuality.onTime.rawValue {
                        stats.done += 1
                    } else {
                        stats.failed += 1
                    }
                } else if habit.type == .counter {
                    let target = habit.dailyTarget ?? 1
                    if log.value >= target || log.status == .done {
                        stats.done += 1
                    } else {
                        stats.failed += 1
                    }
                } else {
                    if log.status == .done {
                        stats.done += 1
                    } else {
                        stats.failed += 1
                    }
                }
            } else {
                // No log - pending
                stats.pending += 1
            }
        }
        
        return stats
    }
    
    /// Reorder habits
    func reorderHabits(_ reorderedHabits: [Habit]) {
        var updated = reorderedHabits
        for (index, _) in updated.enumerated() {
            updated[index].order = index
        }
        habits = updated
        
        // If we have a token, sync to backend
        if let token = userToken {
            Task {
                do {
                    try await HabitService.shared.updateHabitsOrder(
                        userToken: token,
                        habits: updated
                    )
                    print("✅ Habit order synced to backend")
                } catch {
                    print("❌ Failed to sync habit order: \(error.localizedDescription)")
                }
            }
        }
    }
    
    // MARK: - Private Methods - Dummy Data Fallback
    
    private func loadDummyData() {
        let today = dateFormatter.string(from: Date())
        
        print("🎨 Loading dummy data for UI preview...")
        
        // Create dummy habits
        habits = [
            Habit(
                id: "fajr",
                name: "Fajr",
                nameAr: "الفجر",
                type: .prayer,
                emoji: "🌅",
                icon: nil,
                color: "#3b82f6",
                dailyTarget: nil,
                presetId: "fajr",
                isActive: true,
                order: 0,
                startDate: today,
                isArchived: false,
                requireReason: true,
                affectsScore: true,
                createdAt: today,
                updatedAt: today
            ),
            Habit(
                id: "dhuhr",
                name: "Dhuhr",
                nameAr: "الظهر",
                type: .prayer,
                emoji: "☀️",
                icon: nil,
                color: "#3b82f6",
                dailyTarget: nil,
                presetId: "dhuhr",
                isActive: true,
                order: 1,
                startDate: today,
                isArchived: false,
                requireReason: true,
                affectsScore: true,
                createdAt: today,
                updatedAt: today
            ),
            Habit(
                id: "asr",
                name: "Asr",
                nameAr: "العصر",
                type: .prayer,
                emoji: "🌤️",
                icon: nil,
                color: "#3b82f6",
                dailyTarget: nil,
                presetId: "asr",
                isActive: true,
                order: 2,
                startDate: today,
                isArchived: false,
                requireReason: true,
                affectsScore: true,
                createdAt: today,
                updatedAt: today
            ),
            Habit(
                id: "maghrib",
                name: "Maghrib",
                nameAr: "المغرب",
                type: .prayer,
                emoji: "🌆",
                icon: nil,
                color: "#3b82f6",
                dailyTarget: nil,
                presetId: "maghrib",
                isActive: true,
                order: 3,
                startDate: today,
                isArchived: false,
                requireReason: true,
                affectsScore: true,
                createdAt: today,
                updatedAt: today
            ),
            Habit(
                id: "isha",
                name: "Isha",
                nameAr: "العشاء",
                type: .prayer,
                emoji: "🌙",
                icon: nil,
                color: "#3b82f6",
                dailyTarget: nil,
                presetId: "isha",
                isActive: true,
                order: 4,
                startDate: today,
                isArchived: false,
                requireReason: true,
                affectsScore: true,
                createdAt: today,
                updatedAt: today
            ),
            Habit(
                id: "quran",
                name: "Quran Reading",
                nameAr: "قراءة القرآن",
                type: .regular,
                emoji: "📖",
                icon: nil,
                color: "#10b981",
                dailyTarget: nil,
                presetId: nil,
                isActive: true,
                order: 5,
                startDate: today,
                isArchived: false,
                requireReason: true,
                affectsScore: true,
                createdAt: today,
                updatedAt: today
            ),
            Habit(
                id: "dhikr",
                name: "Morning Dhikr",
                nameAr: "أذكار الصباح",
                type: .regular,
                emoji: "🤲",
                icon: nil,
                color: "#f59e0b",
                dailyTarget: nil,
                presetId: nil,
                isActive: true,
                order: 6,
                startDate: today,
                isArchived: false,
                requireReason: true,
                affectsScore: true,
                createdAt: today,
                updatedAt: today
            ),
            Habit(
                id: "water",
                name: "Drink Water",
                nameAr: "شرب الماء",
                type: .counter,
                emoji: "💧",
                icon: nil,
                color: "#06b6d4",
                dailyTarget: 8,
                presetId: nil,
                isActive: true,
                order: 7,
                startDate: today,
                isArchived: false,
                requireReason: false,
                affectsScore: false, // Bonus habit
                createdAt: today,
                updatedAt: today
            ),
            Habit(
                id: "exercise",
                name: "Exercise",
                nameAr: "التمارين",
                type: .counter,
                emoji: "💪",
                icon: nil,
                color: "#ef4444",
                dailyTarget: 30,
                presetId: nil,
                isActive: true,
                order: 8,
                startDate: today,
                isArchived: false,
                requireReason: false,
                affectsScore: false, // Bonus habit
                createdAt: today,
                updatedAt: today
            )
        ]
        
        // Create some dummy logs for yesterday to show streaks
        if let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: Date()) {
            let yesterdayStr = dateFormatter.string(from: yesterday)
            
            logs = [
                HabitLog(
                    id: "fajr-\(yesterdayStr)",
                    habitId: "fajr",
                    date: yesterdayStr,
                    value: PrayerQuality.takbirah.rawValue,
                    status: .done,
                    notes: nil,
                    timestamp: yesterday.timeIntervalSince1970,
                    reason: nil
                ),
                HabitLog(
                    id: "dhuhr-\(yesterdayStr)",
                    habitId: "dhuhr",
                    date: yesterdayStr,
                    value: PrayerQuality.jamaa.rawValue,
                    status: .done,
                    notes: nil,
                    timestamp: yesterday.timeIntervalSince1970,
                    reason: nil
                ),
                HabitLog(
                    id: "quran-\(yesterdayStr)",
                    habitId: "quran",
                    date: yesterdayStr,
                    value: 1,
                    status: .done,
                    notes: nil,
                    timestamp: yesterday.timeIntervalSince1970,
                    reason: nil
                ),
                HabitLog(
                    id: "water-\(yesterdayStr)",
                    habitId: "water",
                    date: yesterdayStr,
                    value: 5,
                    status: nil,
                    notes: nil,
                    timestamp: yesterday.timeIntervalSince1970,
                    reason: nil
                )
            ]
        }
        
        print("✅ Dummy data loaded successfully")
    }
}

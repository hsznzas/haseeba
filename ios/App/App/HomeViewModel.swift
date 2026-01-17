//
//  HomeViewModel.swift
//  Haseeb
//
//  View model for Home screen with full data cycle
//

import Foundation
import SwiftUI
import Combine

// MARK: - Notification Names
extension Notification.Name {
    static let refreshHabits = Notification.Name("refreshHabits")
}

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
    
    private var cancellables = Set<AnyCancellable>()
    
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
    
    // MARK: - Private Properties
    
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
    
    // MARK: - Initialization
    
    init() {
        print("🚀 HomeViewModel initializing...")
        
        // Listen for auth changes
        AuthManager.shared.$isLoggedIn
            .receive(on: RunLoop.main)
            .sink { [weak self] isLoggedIn in
                if isLoggedIn {
                    Task { await self?.fetchData() }
                } else {
                    self?.loadGuestData()
                }
            }
            .store(in: &cancellables)
        
        // Listen for refresh notifications (e.g., after adding a habit)
        NotificationCenter.default.publisher(for: .refreshHabits)
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in
                Task { await self?.fetchData() }
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Public Methods
    
    func fetchData() async {
        isLoading = true
        errorMessage = nil
        
        do {
            print("📡 Fetching habits from backend...")
            let fetchedHabits = try await HabitService.shared.fetchHabits()
            self.habits = fetchedHabits
            print("✅ Successfully fetched \(fetchedHabits.count) habits")
            
            await fetchLogs()
            
        } catch {
            print("❌ Failed to fetch habits: \(error.localizedDescription)")
            errorMessage = error.localizedDescription
            if habits.isEmpty {
                print("🔄 Falling back to dummy data")
                loadDummyData()
            }
        }
        
        isLoading = false
    }
    
    private func fetchLogs() async {
        do {
            print("📡 Fetching logs from backend...")
            let startDate = Calendar.current.date(byAdding: .day, value: -30, to: Date()) ?? Date()
            let endDate = Date()
            
            let fetchedLogs = try await HabitService.shared.fetchLogs(
                startDate: dateFormatter.string(from: startDate),
                endDate: dateFormatter.string(from: endDate)
            )
            
            self.logs = fetchedLogs
            print("✅ Successfully fetched \(fetchedLogs.count) logs")
            
        } catch {
            print("⚠️ Failed to fetch logs: \(error.localizedDescription)")
        }
    }
    
    func refreshData() async {
        print("🔄 Refreshing data...")
        await fetchData()
    }
    
    // MARK: - Habit Actions
    
    func toggleHabit(_ habit: Habit) {
        if let existingLog = logs.first(where: { $0.habitId == habit.id && $0.date == selectedDateString }) {
            deleteLog(existingLog)
        } else {
            logHabit(habit)
        }
    }
    
    func logHabit(_ habit: Habit, count: Int? = nil, status: LogStatus = .done, reason: String? = nil) {
        let logCount: Int
        if let providedCount = count {
            logCount = providedCount
        } else {
            logCount = (habit.type == .counter) ? (habit.targetCount ?? 1) : 1
        }
        
        let newLog = HabitLog(
            id: nil,
            userId: nil,
            habitId: habit.id,
            count: logCount,
            date: selectedDateString,
            completedAt: ISO8601DateFormatter().string(from: Date()),
            status: status,
            notes: nil,
            reason: reason
        )
        
        logs.append(newLog)
        
        Task {
            do {
                try await HabitService.shared.saveLog(log: newLog)
                print("✅ Log saved to backend")
                await fetchLogs() // Refresh to get real ID
            } catch {
                print("❌ Failed to save log: \(error)")
                if let index = logs.firstIndex(where: { $0.habitId == habit.id && $0.date == selectedDateString }) {
                    logs.remove(at: index)
                }
            }
        }
    }
    
    /// Log a habit as FAIL with a reason
    func logHabitWithReason(_ habit: Habit, reason: String) {
        logHabit(habit, count: 0, status: .fail, reason: reason.isEmpty ? nil : reason)
    }
    
    func deleteLog(_ log: HabitLog) {
        let targetHabitId = log.habitId
        let targetDate = log.date
        
        // Remove ONLY the specific log for this habit and date
        logs.removeAll { $0.habitId == targetHabitId && $0.date == targetDate }
        
        guard let logId = log.id else {
            print("⚠️ Log has no ID, skipping backend delete")
            return
        }
        
        Task {
            do {
                try await HabitService.shared.deleteLog(logId: logId)
                print("✅ Log deleted from backend for habit: \(targetHabitId)")
            } catch {
                print("❌ Failed to delete log: \(error)")
                // Optionally re-fetch to restore consistency
            }
        }
    }
    
    func getLog(for habitId: String) -> HabitLog? {
        // Return ONLY the log for this specific habit AND the selected date
        logs.first { $0.habitId == habitId && $0.date == selectedDateString }
    }
    
    func calculateStats(for date: Date) -> DailyStats {
        let dateStr = dateFormatter.string(from: date)
        let dayLogs = logs.filter { $0.date == dateStr }
        let dayOfWeek = Calendar.current.component(.weekday, from: date)
        
        var stats = DailyStats()
        let habitsForDate = habits.filter { $0.shouldShow(on: date, dayOfWeek: dayOfWeek) }
        
        for habit in habitsForDate {
            if let log = dayLogs.first(where: { $0.habitId == habit.id }) {
                if habit.type == .prayer {
                    // Prayer: Check if at least "on time" quality
                    if log.count >= PrayerQuality.onTime.rawValue {
                        stats.done += 1
                    } else {
                        stats.failed += 1
                    }
                } else if let status = log.status {
                    // Regular/Counter: Check status
                    if status == .done {
                        stats.done += 1
                    } else if status == .fail {
                        stats.failed += 1
                    } else {
                        stats.pending += 1
                    }
                } else {
                    stats.done += 1
                }
            } else {
                stats.pending += 1
            }
        }
        return stats
    }
    
    /// Calculate actual consecutive day streak for a specific habit
    func calculateStreak(for habit: Habit) -> Int {
        // Filter logs ONLY for this specific habit
        let habitLogs = logs.filter { $0.habitId == habit.id }
        if habitLogs.isEmpty { return 0 }
        
        // Get unique dates with successful logs, sorted descending
        let successfulDates = habitLogs
            .filter { log in
                // For prayers: count >= 1 means at least on time
                // For others: any log counts
                if habit.type == .prayer {
                    return log.count >= PrayerQuality.onTime.rawValue
                }
                return log.status == .done || log.count > 0
            }
            .compactMap { dateFormatter.date(from: $0.date) }
            .sorted(by: >)
        
        if successfulDates.isEmpty { return 0 }
        
        // Count consecutive days starting from today
        var streak = 0
        let calendar = Calendar.current
        var expectedDate = calendar.startOfDay(for: Date())
        
        for date in successfulDates {
            let logDay = calendar.startOfDay(for: date)
            
            if logDay == expectedDate {
                streak += 1
                expectedDate = calendar.date(byAdding: .day, value: -1, to: expectedDate)!
            } else if logDay < expectedDate {
                // Gap in the streak
                break
            }
            // If logDay > expectedDate, it's a future date (skip)
        }
        
        return streak
    }
    
    func loadGuestData() {
        loadDummyData()
    }
    
    private func loadDummyData() {
            let today = dateFormatter.string(from: Date())
            print("🎨 Loading dummy data for UI preview...")
            
            // ✅ FIX: Swapped 'unit' and 'targetCount' to match Models.swift definition order
            self.habits = [
                Habit(
                    id: "1",
                    userId: "guest",
                    nameEn: "Fajr",
                    nameAr: "الفجر",
                    type: .prayer,
                    emoji: "🌅",
                    color: "#3b82f6",
                    unit: nil,          // ✅ Moved 'unit' before 'targetCount'
                    targetCount: 1,
                    presetId: nil,
                    isActive: true,
                    order: 1,
                    startDate: today,
                    requireReason: nil,
                    affectsScore: nil,
                    createdAt: nil
                ),
                Habit(
                    id: "2",
                    userId: "guest",
                    nameEn: "Drink Water",
                    nameAr: "ماء",
                    type: .counter,
                    emoji: "💧",
                    color: "#007AFF",
                    unit: "cups",       // ✅ Moved 'unit' before 'targetCount'
                    targetCount: 8,
                    presetId: nil,
                    isActive: true,
                    order: 2,
                    startDate: today,
                    requireReason: nil,
                    affectsScore: nil,
                    createdAt: nil
                )
            ]
            
            self.logs = [
                HabitLog(id: "101", userId: "guest", habitId: "1", count: 1, date: today, completedAt: nil, status: .done, notes: nil, reason: nil)
            ]
            
            print("✅ Dummy data loaded successfully")
        }
}

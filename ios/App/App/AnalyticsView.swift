//
//  AnalyticsView.swift
//  Haseeb
//
//  Premium Analytics Dashboard - Liquid Glass Design
//  Ported from React with full feature parity
//

import SwiftUI
import Charts

struct AnalyticsView: View {
    @StateObject private var viewModel = AnalyticsViewModel()
    @State private var currentMonth = Date()
    
    var body: some View {
        NavigationView {
            ZStack {
                // MARK: - Background
                LinearGradient(
                    colors: [Color(hex: "1e1b4b"), Color(hex: "000000")],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                if viewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(1.5)
                } else {
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 24) {
                            // Header
                            headerSection
                            
                            // Global Performance
                            globalPerformanceCard
                            
                            // AI Insight Card
                            aiInsightCard
                            
                            // All Prayers Card
                            allPrayersCard
                            
                            // Individual Prayer Cards
                            prayerCardsGrid
                            
                            // Prayer Streaks Leaderboard
                            streaksLeaderboard
                            
                            // Monthly Calendar
                            monthlyCalendarSection
                            
                            // Rawatib House Calendar
                            rawatibCalendarSection
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 12)
                        .padding(.bottom, 120)
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .preferredColorScheme(.dark)
    }
    
    // MARK: - Header
    
    private var headerSection: some View {
        HStack {
            Text("Analytics")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundColor(.white)
            
            Spacer()
            
            Image("verse")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .frame(height: 40)
                .opacity(0.9)
        }
    }
    
    // MARK: - Global Performance Card
    
    private var globalPerformanceCard: some View {
        let stats = viewModel.globalStats
        let rateColor = AnalyticsViewModel.rateColor(for: stats.winRate)
        
        return VStack(alignment: .leading, spacing: 0) {
            // Section Title
            HStack {
                Text("OVERALL PERFORMANCE")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundColor(.gray)
                    .tracking(1)
                
                Spacer()
            }
            .padding(.bottom, 12)
            
            // Card Content
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Wins")
                        .font(.system(size: 14, design: .rounded))
                        .foregroundColor(.gray)
                    
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\(stats.wins)")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundColor(AnalyticsViewModel.greenColor)
                        
                        Text("/ \(stats.total)")
                            .font(.system(size: 18, design: .rounded))
                            .foregroundColor(.gray)
                    }
                    
                    HStack(spacing: 4) {
                        Text("\(stats.losses)")
                            .foregroundColor(AnalyticsViewModel.redColor)
                        Text("losses")
                            .foregroundColor(.gray)
                    }
                    .font(.system(size: 12, design: .rounded))
                }
                
                Spacer()
                
                // Win Rate Ring
                ZStack {
                    Circle()
                        .stroke(rateColor.opacity(0.3), lineWidth: 4)
                        .frame(width: 80, height: 80)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(stats.winRate) / 100)
                        .stroke(rateColor, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .frame(width: 80, height: 80)
                        .rotationEffect(.degrees(-90))
                    
                    Text("\(stats.winRate)%")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(rateColor)
                }
            }
            .padding(20)
            .background(glassCard)
        }
    }
    
    // MARK: - AI Insight Card
    
    private var aiInsightCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "sparkles")
                    .foregroundColor(AnalyticsViewModel.blueColor)
                
                Text("AI Insight")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(AnalyticsViewModel.blueColor.opacity(0.9))
                
                Spacer()
                
                Button {
                    // Refresh action
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 10))
                        Text("Refresh")
                            .font(.system(size: 10))
                    }
                    .foregroundColor(AnalyticsViewModel.blueColor.opacity(0.8))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(AnalyticsViewModel.blueColor.opacity(0.15))
                    .cornerRadius(8)
                }
            }
            
            Text("Your prayer consistency has improved this week. Focus on maintaining Fajr at Takbirah level - it's your strongest area. Consider setting an earlier alarm for Isha to catch the first row.")
                .font(.system(size: 14, design: .rounded))
                .foregroundColor(.white.opacity(0.9))
                .lineSpacing(4)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(
                    LinearGradient(
                        colors: [
                            AnalyticsViewModel.blueColor.opacity(0.2),
                            Color(hex: "1e293b").opacity(0.9)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(AnalyticsViewModel.blueColor.opacity(0.3), lineWidth: 1)
                )
        )
        .shadow(color: AnalyticsViewModel.blueColor.opacity(0.1), radius: 10, x: 0, y: 5)
    }
    
    // MARK: - All Prayers Card
    
    private var allPrayersCard: some View {
        let stats = viewModel.prayerStats()
        let rateColor = AnalyticsViewModel.rateColor(for: stats.perfectRate)
        let bestStreak = viewModel.calculateBestStreak(for: viewModel.prayerIds)
        
        return VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                Text("All Prayers")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                
                Spacer()
                
                if bestStreak > 0 {
                    HStack(spacing: 4) {
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 12))
                        Text("\(bestStreak)")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                    }
                    .foregroundColor(.orange)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.15))
                    .cornerRadius(8)
                }
            }
            
            HStack(spacing: 20) {
                // Donut Chart
                VStack(spacing: 8) {
                    ZStack {
                        // Chart using native SwiftUI
                        prayerDonutChart(stats: stats)
                            .frame(width: 96, height: 96)
                        
                        Text("\(stats.perfectRate)%")
                            .font(.system(size: 18, weight: .bold, design: .rounded))
                            .foregroundColor(rateColor)
                    }
                    
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(stats.takbirah)")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundColor(rateColor)
                        Text("/ \(stats.total)")
                            .font(.system(size: 12, design: .rounded))
                            .foregroundColor(.gray)
                    }
                    
                    Text("Perfect Rate")
                        .font(.system(size: 10, design: .rounded))
                        .foregroundColor(.gray)
                }
                
                // Quality Breakdown
                VStack(alignment: .leading, spacing: 8) {
                    Text("QUALITY BREAKDOWN")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(.gray)
                        .tracking(1)
                    
                    qualityBreakdownRow(label: "Takbirah", value: stats.takbirah, percentage: stats.percentage(for: .takbirah), color: AnalyticsViewModel.blueColor)
                    qualityBreakdownRow(label: "In Group", value: stats.jamaa, percentage: stats.percentage(for: .jamaa), color: AnalyticsViewModel.goldColor)
                    qualityBreakdownRow(label: "On Time", value: stats.onTime, percentage: stats.percentage(for: .onTime), color: AnalyticsViewModel.orangeColor)
                    qualityBreakdownRow(label: "Missed", value: stats.missed, percentage: stats.percentage(for: .missed), color: AnalyticsViewModel.redColor)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .padding(16)
        .background(glassCard)
    }
    
    private func qualityBreakdownRow(label: String, value: Int, percentage: Int, color: Color) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
            
            Text(label)
                .font(.system(size: 12, design: .rounded))
                .foregroundColor(.gray)
            
            Spacer()
            
            Text("\(percentage)%")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundColor(color)
        }
    }
    
    // MARK: - Prayer Donut Chart
    
    private func prayerDonutChart(stats: AnalyticsViewModel.PrayerStats) -> some View {
        let data = [
            (value: Double(stats.takbirah), color: AnalyticsViewModel.blueColor),
            (value: Double(stats.jamaa), color: AnalyticsViewModel.goldColor),
            (value: Double(stats.onTime), color: AnalyticsViewModel.orangeColor),
            (value: Double(stats.missed), color: AnalyticsViewModel.redColor)
        ].filter { $0.value > 0 }
        
        let total = data.reduce(0) { $0 + $1.value }
        
        return ZStack {
            if total > 0 {
                ForEach(Array(data.enumerated()), id: \.offset) { index, item in
                    let startAngle = data.prefix(index).reduce(0) { $0 + $1.value } / total * 360
                    let endAngle = startAngle + (item.value / total * 360)
                    
                    DonutSegment(startAngle: startAngle, endAngle: endAngle - 5)
                        .stroke(item.color, lineWidth: 12)
                }
            } else {
                Circle()
                    .stroke(Color(hex: "1e293b"), lineWidth: 12)
            }
        }
    }
    
    // MARK: - Individual Prayer Cards Grid
    
    private var prayerCardsGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            ForEach(viewModel.prayerIds, id: \.self) { prayerId in
                prayerCard(for: prayerId)
            }
        }
    }
    
    private func prayerCard(for prayerId: String) -> some View {
        let habit = viewModel.habits.first { $0.id == prayerId }
        let stats = viewModel.prayerStats(for: prayerId)
        let rateColor = AnalyticsViewModel.rateColor(for: stats.perfectRate)
        let bestStreak = viewModel.calculateBestStreak(for: [prayerId])
        
        return VStack(alignment: .leading, spacing: 8) {
            // Header
            HStack {
                Text(habit?.nameEn.uppercased() ?? prayerId.uppercased())
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundColor(.gray)
                    .tracking(1)
                
                Spacer()
                
                if bestStreak > 0 {
                    HStack(spacing: 2) {
                        Image(systemName: "trophy.fill")
                            .font(.system(size: 8))
                        Text("\(bestStreak)")
                            .font(.system(size: 10, weight: .bold, design: .rounded))
                    }
                    .foregroundColor(.orange)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.orange.opacity(0.15))
                    .cornerRadius(6)
                }
            }
            
            HStack {
                // Mini Donut
                ZStack {
                    prayerDonutChart(stats: stats)
                        .frame(width: 56, height: 56)
                    
                    Text("\(stats.perfectRate)%")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(rateColor)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    HStack(alignment: .firstTextBaseline, spacing: 2) {
                        Text("\(stats.takbirah)")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundColor(rateColor)
                        Text("/ \(stats.total)")
                            .font(.system(size: 10, design: .rounded))
                            .foregroundColor(.gray)
                    }
                    
                    Text("Perfect Rate")
                        .font(.system(size: 10, design: .rounded))
                        .foregroundColor(rateColor)
                }
            }
        }
        .padding(12)
        .background(glassCardSmall)
    }
    
    // MARK: - Streaks Leaderboard
    
    private var streaksLeaderboard: some View {
        let allPrayersStreak = viewModel.calculateBestStreak(for: viewModel.prayerIds)
        let prayerStreaks = viewModel.prayerIds
            .map { id -> (id: String, name: String, streak: Int) in
                let habit = viewModel.habits.first { $0.id == id }
                return (id: id, name: habit?.nameEn ?? id, streak: viewModel.calculateBestStreak(for: [id]))
            }
            .filter { $0.streak > 0 }
            .sorted { $0.streak > $1.streak }
            .prefix(5)
        
        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "trophy.fill")
                    .foregroundColor(.orange)
                
                Text("PRAYER STREAKS")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundColor(.gray)
                    .tracking(1)
            }
            
            VStack(spacing: 0) {
                // Innocence Index (All Prayers Perfect)
                innocenceIndexRow(streak: allPrayersStreak)
                
                Divider().background(Color.white.opacity(0.1))
                
                // Individual Streaks
                ForEach(Array(prayerStreaks.enumerated()), id: \.element.id) { index, item in
                    streakRow(rank: index + 1, name: item.name, streak: item.streak)
                    
                    if index < prayerStreaks.count - 1 {
                        Divider().background(Color.white.opacity(0.1))
                    }
                }
            }
            .background(glassCard)
        }
    }
    
    private func innocenceIndexRow(streak: Int) -> some View {
        HStack(spacing: 12) {
            // Checkmark Badge
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: [AnalyticsViewModel.greenColor, Color(hex: "0D9488")],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 40, height: 40)
                    .shadow(color: AnalyticsViewModel.greenColor.opacity(0.4), radius: 8, x: 0, y: 4)
                
                Text("✓")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text("Innocence Index")
                    .font(.system(size: 16, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                
                Text("All 5 prayers at Takbirah level")
                    .font(.system(size: 11, design: .rounded))
                    .foregroundColor(AnalyticsViewModel.greenColor.opacity(0.8))
            }
            
            Spacer()
            
            HStack(spacing: 4) {
                Text("\(streak)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("days")
                    .font(.system(size: 11, design: .rounded))
                    .foregroundColor(.white.opacity(0.7))
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(Color.white.opacity(0.1))
            .cornerRadius(12)
        }
        .padding(16)
        .background(
            LinearGradient(
                colors: [
                    AnalyticsViewModel.greenColor.opacity(0.15),
                    AnalyticsViewModel.blueColor.opacity(0.1),
                    Color.purple.opacity(0.1)
                ],
                startPoint: .leading,
                endPoint: .trailing
            )
        )
    }
    
    private func streakRow(rank: Int, name: String, streak: Int) -> some View {
        let rankColor: Color = rank == 1 ? Color(hex: "F59E0B") : rank == 2 ? Color.gray : rank == 3 ? Color(hex: "EA580C") : Color(hex: "1E293B")
        
        return HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 8)
                    .fill(rankColor.opacity(0.2))
                    .frame(width: 32, height: 32)
                
                Text("\(rank)")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(rankColor)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundColor(.white)
                
                Text("Prayer")
                    .font(.system(size: 10, design: .rounded))
                    .foregroundColor(.gray)
                    .textCase(.uppercase)
            }
            
            Spacer()
            
            HStack(spacing: 4) {
                Text("\(streak)")
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundColor(.orange)
                Text("days")
                    .font(.system(size: 10, design: .rounded))
                    .foregroundColor(.orange.opacity(0.7))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(Color.orange.opacity(0.1))
            .cornerRadius(8)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
    }
    
    // MARK: - Monthly Calendar
    
    private var monthlyCalendarSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("PRAYERS MONTHLY VIEW")
                    .font(.system(size: 12, weight: .semibold, design: .rounded))
                    .foregroundColor(.gray)
                    .tracking(1)
                
                Spacer()
                
                HStack(spacing: 8) {
                    Button {
                        currentMonth = Calendar.current.date(byAdding: .month, value: -1, to: currentMonth) ?? currentMonth
                    } label: {
                        Image(systemName: "chevron.left")
                            .foregroundColor(.gray)
                    }
                    
                    Text(currentMonth, format: .dateTime.month(.wide).year())
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .frame(minWidth: 100)
                    
                    Button {
                        currentMonth = Calendar.current.date(byAdding: .month, value: 1, to: currentMonth) ?? currentMonth
                    } label: {
                        Image(systemName: "chevron.right")
                            .foregroundColor(.gray)
                    }
                }
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.white.opacity(0.05))
                .cornerRadius(8)
            }
            
            MonthlyPrayerCalendar(
                month: currentMonth,
                logs: viewModel.logs,
                prayerIds: viewModel.prayerIds
            )
            .padding(16)
            .background(glassCard)
        }
    }
    
    // MARK: - Rawatib Calendar
    
    private var rawatibCalendarSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("RAWATIB MONTHLY VIEW")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(.gray)
                .tracking(1)
            
            // Legend
            HStack(spacing: 16) {
                legendItem(color: Color(hex: "1E293B"), label: "Pending")
                legendItem(color: AnalyticsViewModel.blueColor, label: "Partial")
                legendItem(color: AnalyticsViewModel.greenColor, label: "Complete")
            }
            .frame(maxWidth: .infinity)
            
            RawatibMonthlyCalendar(
                month: currentMonth,
                logs: viewModel.logs,
                rawatibIds: viewModel.rawatibIds
            )
            .padding(16)
            .background(glassCard)
        }
    }
    
    private func legendItem(color: Color, label: String) -> some View {
        HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 2)
                .fill(color)
                .frame(width: 12, height: 12)
            
            Text(label)
                .font(.system(size: 10, design: .rounded))
                .foregroundColor(.gray)
        }
    }
    
    // MARK: - Glass Card Backgrounds
    
    private var glassCard: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(.ultraThinMaterial)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
    }
    
    private var glassCardSmall: some View {
        RoundedRectangle(cornerRadius: 12)
            .fill(.ultraThinMaterial)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(Color.white.opacity(0.1), lineWidth: 1)
            )
            .shadow(color: .black.opacity(0.15), radius: 6, x: 0, y: 3)
    }
}

// MARK: - Donut Segment Shape

struct DonutSegment: Shape {
    var startAngle: Double
    var endAngle: Double
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let radius = min(rect.width, rect.height) / 2 - 6
        
        path.addArc(
            center: center,
            radius: radius,
            startAngle: .degrees(startAngle - 90),
            endAngle: .degrees(endAngle - 90),
            clockwise: false
        )
        
        return path
    }
}

// MARK: - Monthly Prayer Calendar

struct MonthlyPrayerCalendar: View {
    let month: Date
    let logs: [HabitLog]
    let prayerIds: [String]
    
    private let weekdays = ["S", "M", "T", "W", "T", "F", "S"]
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    
    var body: some View {
        VStack(spacing: 8) {
            // Weekday headers
            HStack {
                ForEach(weekdays, id: \.self) { day in
                    Text(day)
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity)
                }
            }
            
            // Days grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 8) {
                ForEach(daysInMonth(), id: \.self) { day in
                    if let date = day {
                        DayRingView(date: date, logs: logsForDate(date), prayerIds: prayerIds)
                    } else {
                        Color.clear
                            .aspectRatio(1, contentMode: .fit)
                    }
                }
            }
        }
    }
    
    private func daysInMonth() -> [Date?] {
        let calendar = Calendar.current
        let interval = calendar.dateInterval(of: .month, for: month)!
        let firstWeekday = calendar.component(.weekday, from: interval.start)
        
        var days: [Date?] = Array(repeating: nil, count: firstWeekday - 1)
        
        var current = interval.start
        while current < interval.end {
            days.append(current)
            current = calendar.date(byAdding: .day, value: 1, to: current)!
        }
        
        return days
    }
    
    private func logsForDate(_ date: Date) -> [HabitLog?] {
        let dateStr = dateFormatter.string(from: date)
        return prayerIds.map { id in
            logs.first { $0.habitId == id && $0.date == dateStr }
        }
    }
}

// MARK: - Day Ring View

struct DayRingView: View {
    let date: Date
    let logs: [HabitLog?]
    let prayerIds: [String]
    
    var body: some View {
        ZStack {
            // 5-segment ring
            ForEach(0..<5, id: \.self) { index in
                let startAngle = Double(index) * 72
                let endAngle = startAngle + 67
                
                DonutSegment(startAngle: startAngle, endAngle: endAngle)
                    .stroke(colorFor(log: logs[safe: index] ?? nil), lineWidth: 3)
            }
            
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundColor(Calendar.current.isDateInToday(date) ? AnalyticsViewModel.blueColor : .gray)
        }
        .rotationEffect(.degrees(-90))
        .aspectRatio(1, contentMode: .fit)
    }
    
    private func colorFor(log: HabitLog?) -> Color {
        guard let log = log else { return Color(hex: "1E293B") }
        
        if log.status == .excused { return AnalyticsViewModel.slateColor }
        
        switch log.count {
        case PrayerQuality.takbirah.rawValue: return AnalyticsViewModel.blueColor
        case PrayerQuality.jamaa.rawValue: return AnalyticsViewModel.goldColor
        case PrayerQuality.onTime.rawValue: return AnalyticsViewModel.orangeColor
        case PrayerQuality.missed.rawValue: return AnalyticsViewModel.redColor
        default: return Color(hex: "1E293B")
        }
    }
}

// MARK: - Rawatib Monthly Calendar

struct RawatibMonthlyCalendar: View {
    let month: Date
    let logs: [HabitLog]
    let rawatibIds: [String]
    
    private let weekdays = ["S", "M", "T", "W", "T", "F", "S"]
    private let dateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                ForEach(weekdays, id: \.self) { day in
                    Text(day)
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity)
                }
            }
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 8) {
                ForEach(daysInMonth(), id: \.self) { day in
                    if let date = day {
                        RawatibHouseView(date: date, logs: logsForDate(date))
                    } else {
                        Color.clear
                            .aspectRatio(1, contentMode: .fit)
                    }
                }
            }
        }
    }
    
    private func daysInMonth() -> [Date?] {
        let calendar = Calendar.current
        let interval = calendar.dateInterval(of: .month, for: month)!
        let firstWeekday = calendar.component(.weekday, from: interval.start)
        
        var days: [Date?] = Array(repeating: nil, count: firstWeekday - 1)
        
        var current = interval.start
        while current < interval.end {
            days.append(current)
            current = calendar.date(byAdding: .day, value: 1, to: current)!
        }
        
        return days
    }
    
    private func logsForDate(_ date: Date) -> [HabitLog?] {
        let dateStr = dateFormatter.string(from: date)
        return rawatibIds.map { id in
            logs.first { $0.habitId == id && $0.date == dateStr }
        }
    }
}

// MARK: - Rawatib House Shape View

struct RawatibHouseView: View {
    let date: Date
    let logs: [HabitLog?]
    
    private let baseColor = Color(hex: "1E293B")
    private let activeColor = AnalyticsViewModel.goldColor
    private let perfectColor = AnalyticsViewModel.blueColor
    
    // House segments (6 parts)
    private let segments: [(id: Int, path: String)] = [
        (0, "M 20,6 L 6,18"),      // Roof left
        (1, "M 20,6 L 34,18"),     // Roof right
        (2, "M 6,18 L 9,34"),      // Wall left
        (3, "M 34,18 L 31,34"),    // Wall right
        (4, "M 9,34 L 20,34"),     // Floor left
        (5, "M 20,34 L 31,34"),    // Floor right
    ]
    
    private let segmentMapping = [0, 5, 1, 3, 2, 4] // Maps rawatib index to segment
    
    var body: some View {
        let completedCount = logs.compactMap { $0 }.filter { $0.status == .done }.count
        let allCompleted = completedCount == 6
        
        ZStack {
            // Base house outline
            HouseShape()
                .stroke(baseColor, lineWidth: 2.5)
            
            // Active segments
            ForEach(0..<logs.count, id: \.self) { rawatibIdx in
                if logs[safe: rawatibIdx]??.status == .done,
                   let segmentIdx = segmentMapping[safe: rawatibIdx],
                   segmentIdx < segments.count {
                    HouseSegment(segmentIndex: segmentIdx)
                        .stroke(allCompleted ? perfectColor : activeColor, lineWidth: 3)
                }
            }
            
            // Day number
            Text("\(Calendar.current.component(.day, from: date))")
                .font(.system(size: 10, weight: .bold, design: .rounded))
                .foregroundColor(
                    Calendar.current.isDateInToday(date) ? AnalyticsViewModel.blueColor :
                    allCompleted ? AnalyticsViewModel.greenColor : .gray
                )
        }
        .aspectRatio(1, contentMode: .fit)
    }
}

// MARK: - House Shape

struct HouseShape: Shape {
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let scale = min(rect.width, rect.height) / 40
        
        // Roof
        path.move(to: CGPoint(x: 20 * scale, y: 6 * scale))
        path.addLine(to: CGPoint(x: 6 * scale, y: 18 * scale))
        
        path.move(to: CGPoint(x: 20 * scale, y: 6 * scale))
        path.addLine(to: CGPoint(x: 34 * scale, y: 18 * scale))
        
        // Walls
        path.move(to: CGPoint(x: 6 * scale, y: 18 * scale))
        path.addLine(to: CGPoint(x: 9 * scale, y: 34 * scale))
        
        path.move(to: CGPoint(x: 34 * scale, y: 18 * scale))
        path.addLine(to: CGPoint(x: 31 * scale, y: 34 * scale))
        
        // Floor
        path.move(to: CGPoint(x: 9 * scale, y: 34 * scale))
        path.addLine(to: CGPoint(x: 31 * scale, y: 34 * scale))
        
        return path
    }
}

// MARK: - House Segment

struct HouseSegment: Shape {
    let segmentIndex: Int
    
    private let segmentPaths: [(start: (x: CGFloat, y: CGFloat), end: (x: CGFloat, y: CGFloat))] = [
        ((20, 6), (6, 18)),    // 0: Roof left
        ((20, 6), (34, 18)),   // 1: Roof right
        ((6, 18), (9, 34)),    // 2: Wall left
        ((34, 18), (31, 34)),  // 3: Wall right
        ((9, 34), (20, 34)),   // 4: Floor left
        ((20, 34), (31, 34)),  // 5: Floor right
    ]
    
    func path(in rect: CGRect) -> Path {
        var path = Path()
        let scale = min(rect.width, rect.height) / 40
        
        guard segmentIndex < segmentPaths.count else { return path }
        let segment = segmentPaths[segmentIndex]
        
        path.move(to: CGPoint(x: segment.start.x * scale, y: segment.start.y * scale))
        path.addLine(to: CGPoint(x: segment.end.x * scale, y: segment.end.y * scale))
        
        return path
    }
}

// MARK: - Safe Array Access

extension Array {
    subscript(safe index: Int) -> Element? {
        return indices.contains(index) ? self[index] : nil
    }
}

// MARK: - Preview

struct AnalyticsView_Previews: PreviewProvider {
    static var previews: some View {
        AnalyticsView()
    }
}

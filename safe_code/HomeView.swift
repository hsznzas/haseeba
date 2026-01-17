//
//  HomeView.swift
//  Haseeb
//
//  Premium Liquid Glass Home Screen
//

import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @State private var showAddHabit = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // MARK: - Spiritual Night Sky Background
                LinearGradient(
                    colors: [
                        Color(hex: "1e1b4b"), // Deep indigo - top left
                        Color(hex: "000000")  // Pure black - bottom right
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // MARK: - Main Content
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        // MARK: - Header
                        header
                        
                        // MARK: - Glass Date Selector
                        dateSelector
                        
                        // MARK: - Habits List
                        habitsList
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                    .padding(.bottom, 120)
                }
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                            viewModel.isSortMode.toggle()
                        }
                    } label: {
                        Image(systemName: viewModel.isSortMode ? "checkmark.circle.fill" : "arrow.up.arrow.down")
                            .font(.system(size: 16, weight: .semibold, design: .rounded))
                            .foregroundColor(viewModel.isSortMode ? .green : .white)
                    }
                }
            }
            .overlay(alignment: .bottomTrailing) {
                // MARK: - Floating Add Button
                addButton
            }
        }
        .preferredColorScheme(.dark)
    }
    
    // MARK: - Premium Header
    
    private var header: some View {
        HStack(spacing: 16) {
            // Avatar + Greeting
            HStack(spacing: 12) {
                // Glass Avatar
                ZStack {
                    Circle()
                        .fill(.ultraThinMaterial)
                        .frame(width: 44, height: 44)
                        .overlay(
                            Circle()
                                .strokeBorder(
                                    LinearGradient(
                                        colors: [.white.opacity(0.3), .white.opacity(0.1)],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1.5
                                )
                        )
                        .shadow(color: .black.opacity(0.3), radius: 8, x: 0, y: 4)
                    
                    Image(systemName: "person.fill")
                        .font(.system(size: 18, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.9))
                }
                
                Text(viewModel.preferences.language == "ar" ? "مرحبًا، \(viewModel.userName)" : "Hi, \(viewModel.userName)")
                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
            }
            
            Spacer()
            
            // Frosted Stats Pill
            statsPill
        }
        .padding(.vertical, 8)
    }
    
    private var statsPill: some View {
        let stats = viewModel.calculateStats(for: viewModel.selectedDate)
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: viewModel.selectedDate) ?? Date()
        let yesterdayStats = viewModel.calculateStats(for: yesterday)
        
        return HStack(spacing: 14) {
            // Today Stats
            HStack(spacing: 6) {
                Text(dayAbbreviation(viewModel.selectedDate))
                    .font(.system(size: 10, weight: .bold, design: .rounded))
                    .foregroundColor(.green.opacity(0.9))
                
                HStack(spacing: 4) {
                    Text("\(stats.done)✓")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(.green)
                    
                    Text("\(stats.failed)✗")
                        .font(.system(size: 10, weight: .semibold, design: .rounded))
                        .foregroundColor(.red.opacity(0.8))
                    
                    HStack(spacing: 2) {
                        Text("\(stats.pending)")
                            .font(.system(size: 10, weight: .semibold, design: .rounded))
                        Image(systemName: "hourglass")
                            .font(.system(size: 8, weight: .semibold))
                    }
                    .foregroundColor(.yellow.opacity(0.8))
                }
            }
            
            // Glass Divider
            Rectangle()
                .fill(.white.opacity(0.2))
                .frame(width: 1, height: 14)
            
            // Yesterday Stats
            HStack(spacing: 6) {
                Text(dayAbbreviation(yesterday))
                    .font(.system(size: 10, weight: .medium, design: .rounded))
                    .foregroundColor(.gray.opacity(0.8))
                
                HStack(spacing: 4) {
                    Text("\(yesterdayStats.done)✓")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundColor(.green.opacity(0.5))
                    
                    Text("\(yesterdayStats.failed)✗")
                        .font(.system(size: 10, weight: .medium, design: .rounded))
                        .foregroundColor(.red.opacity(0.4))
                    
                    HStack(spacing: 2) {
                        Text("\(yesterdayStats.pending)")
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                        Image(systemName: "hourglass")
                            .font(.system(size: 8, weight: .medium))
                    }
                    .foregroundColor(.yellow.opacity(0.5))
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(
            Capsule()
                .fill(.ultraThinMaterial)
                .overlay(
                    Capsule()
                        .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.2), radius: 8, x: 0, y: 4)
        )
    }
    
    // MARK: - Glass Date Selector
    
    private var dateSelector: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(-7...0, id: \.self) { offset in
                    let date = Calendar.current.date(byAdding: .day, value: offset, to: Date()) ?? Date()
                    dateCell(date)
                }
            }
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
        }
    }
    
    private func dateCell(_ date: Date) -> some View {
        let isSelected = Calendar.current.isDate(date, inSameDayAs: viewModel.selectedDate)
        let day = Calendar.current.component(.day, from: date)
        let weekday = dayAbbreviation(date)
        
        return Button {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                viewModel.selectedDate = date
            }
        } label: {
            VStack(spacing: 6) {
                Text(weekday)
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundColor(isSelected ? .white : .gray.opacity(0.7))
                
                Text("\(day)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(isSelected ? .white : .gray.opacity(0.6))
            }
            .frame(width: 52, height: 66)
            .background(
                Group {
                    if isSelected {
                        // Glass Capsule for Selected Date
                        Capsule()
                            .fill(.ultraThinMaterial)
                            .overlay(
                                Capsule()
                                    .strokeBorder(
                                        LinearGradient(
                                            colors: [.white.opacity(0.4), .white.opacity(0.2)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ),
                                        lineWidth: 1.5
                                    )
                            )
                            .shadow(color: .black.opacity(0.3), radius: 10, x: 0, y: 5)
                    } else {
                        // Subtle background for unselected
                        Capsule()
                            .fill(.white.opacity(0.03))
                            .overlay(
                                Capsule()
                                    .strokeBorder(.white.opacity(0.06), lineWidth: 1)
                            )
                    }
                }
            )
        }
    }
    
    // MARK: - Habits List
    
    private var habitsList: some View {
        VStack(spacing: 14) {
            if viewModel.isSortMode {
                // Sort mode - simple list
                ForEach(viewModel.visibleHabits) { habit in
                    HabitCardView(
                        habit: habit,
                        log: viewModel.getLog(for: habit.id),
                        streak: viewModel.calculateStreak(for: habit),
                        isSortMode: true,
                        onToggle: { _, _ in },
                        onDelete: {}
                    )
                }
            } else {
                // Normal mode - core + bonus sections
                ForEach(viewModel.coreHabits) { habit in
                    HabitCardView(
                        habit: habit,
                        log: viewModel.getLog(for: habit.id),
                        streak: viewModel.calculateStreak(for: habit),
                        isSortMode: false,
                        onToggle: { value, status in
                            viewModel.toggleHabit(id: habit.id, value: value, status: status)
                        },
                        onDelete: {
                            viewModel.deleteLog(habitId: habit.id)
                        }
                    )
                    .transition(.scale.combined(with: .opacity))
                }
                
                // Bonus Habits Divider
                if !viewModel.bonusHabits.isEmpty {
                    bonusDivider
                    
                    ForEach(viewModel.bonusHabits) { habit in
                        HabitCardView(
                            habit: habit,
                            log: viewModel.getLog(for: habit.id),
                            streak: viewModel.calculateStreak(for: habit),
                            isSortMode: false,
                            onToggle: { value, status in
                                viewModel.toggleHabit(id: habit.id, value: value, status: status)
                            },
                            onDelete: {
                                viewModel.deleteLog(habitId: habit.id)
                            }
                        )
                        .transition(.scale.combined(with: .opacity))
                    }
                }
            }
        }
    }
    
    private var bonusDivider: some View {
        HStack(spacing: 14) {
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [.clear, .white.opacity(0.15), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(height: 1)
            
            Text(viewModel.preferences.language == "ar" ? "عادات المكافأة" : "BONUS")
                .font(.system(size: 10, weight: .black, design: .rounded))
                .foregroundColor(.white.opacity(0.4))
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(
                    Capsule()
                        .fill(.ultraThinMaterial)
                        .overlay(
                            Capsule()
                                .strokeBorder(.white.opacity(0.15), lineWidth: 1)
                        )
                )
            
            Rectangle()
                .fill(
                    LinearGradient(
                        colors: [.clear, .white.opacity(0.15), .clear],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(height: 1)
        }
        .padding(.vertical, 18)
    }
    
    // MARK: - Floating Add Button
    
    private var addButton: some View {
        Button {
            showAddHabit = true
        } label: {
            ZStack {
                // Glow effect
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [.green.opacity(0.4), .clear],
                            center: .center,
                            startRadius: 0,
                            endRadius: 35
                        )
                    )
                    .frame(width: 70, height: 70)
                    .blur(radius: 8)
                
                // Main button
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.green, .blue],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 60, height: 60)
                    .overlay(
                        Circle()
                            .strokeBorder(.white.opacity(0.3), lineWidth: 2)
                    )
                    .shadow(color: .black.opacity(0.3), radius: 12, x: 0, y: 6)
                
                Image(systemName: "plus")
                    .font(.system(size: 26, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
            }
        }
        .padding(.trailing, 20)
        .padding(.bottom, 110)
    }
    
    // MARK: - Helpers
    
    private func dayAbbreviation(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }
}

// MARK: - Preview

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
    }
}

//
//  HomeView.swift
//  Haseeb
//
//  Premium Liquid Glass Home Screen
//

import SwiftUI

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @EnvironmentObject var languageManager: LanguageManager
    @Binding var selectedDate: Date
    @Binding var showAddHabit: Bool
    @Binding var isCollapsed: Bool
    
    // Reason Sheet State
    @State private var showingReasonSheet: Bool = false
    @State private var activeHabitForReason: Habit? = nil
    @State private var failReason: String = ""
    
    init(selectedDate: Binding<Date> = .constant(Date()), showAddHabit: Binding<Bool> = .constant(false), isCollapsed: Binding<Bool> = .constant(false)) {
        self._selectedDate = selectedDate
        self._showAddHabit = showAddHabit
        self._isCollapsed = isCollapsed
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                // MARK: - Spiritual Night Sky Background
                LinearGradient(
                    colors: [
                        Color(hex: "1e1b4b"),
                        Color(hex: "000000")
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // MARK: - Main Content (with scroll detection)
                ScrollableWithDetection(isCollapsed: $isCollapsed) {
                    VStack(spacing: 20) {
                        header
                        habitsList
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 12)
                    .padding(.bottom, 200)
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
        }
        .preferredColorScheme(.dark)
        .onChange(of: viewModel.selectedDate) { newDate in
            if selectedDate != newDate {
                selectedDate = newDate
            }
        }
        .onChange(of: selectedDate) { newDate in
            if viewModel.selectedDate != newDate {
                viewModel.selectedDate = newDate
            }
        }
        .onAppear {
            selectedDate = viewModel.selectedDate
        }
        // MARK: - Reason Sheet
        .sheet(isPresented: $showingReasonSheet) {
            reasonSheet
        }
    }
    
    // MARK: - Premium Header (Greeting + Full-Width Score Bar)
    
    private var header: some View {
        VStack(spacing: 12) {
            // 1. Greeting & Profile Row (Standard Padding)
            HStack(spacing: 12) {
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
                
                Text(languageManager.isArabic ? "مرحبًا، \(viewModel.userName)" : "Hi, \(viewModel.userName)")
                    .font(.system(size: 17, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            // 2. Full-Width Daily Score Bar
            dailyScoreBar
        }
    }
    
    // MARK: - Daily Score Bar (Full Width)
    
    private var dailyScoreBar: some View {
        let stats = viewModel.calculateStats(for: viewModel.selectedDate)
        let yesterday = Calendar.current.date(byAdding: .day, value: -1, to: viewModel.selectedDate) ?? Date()
        let yesterdayStats = viewModel.calculateStats(for: yesterday)
        
        return HStack(spacing: 0) {
            // Today's Stats
            HStack(spacing: 8) {
                Text(dayAbbreviation(viewModel.selectedDate))
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .foregroundColor(.green.opacity(0.9))
                
                HStack(spacing: 6) {
                    HStack(spacing: 2) {
                        Text("\(stats.done)")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                        Image(systemName: "checkmark")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundColor(.green)
                    
                    HStack(spacing: 2) {
                        Text("\(stats.failed)")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                        Image(systemName: "xmark")
                            .font(.system(size: 10, weight: .bold))
                    }
                    .foregroundColor(.red.opacity(0.8))
                    
                    HStack(spacing: 2) {
                        Text("\(stats.pending)")
                            .font(.system(size: 13, weight: .bold, design: .rounded))
                        Image(systemName: "hourglass")
                            .font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundColor(.yellow.opacity(0.9))
                }
            }
            
            Spacer()
            
            // Divider
            Rectangle()
                .fill(.white.opacity(0.2))
                .frame(width: 1, height: 20)
            
            Spacer()
            
            // Yesterday's Stats
            HStack(spacing: 8) {
                Text(dayAbbreviation(yesterday))
                    .font(.system(size: 11, weight: .medium, design: .rounded))
                    .foregroundColor(.gray.opacity(0.8))
                
                HStack(spacing: 6) {
                    HStack(spacing: 2) {
                        Text("\(yesterdayStats.done)")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                        Image(systemName: "checkmark")
                            .font(.system(size: 9, weight: .medium))
                    }
                    .foregroundColor(.green.opacity(0.5))
                    
                    HStack(spacing: 2) {
                        Text("\(yesterdayStats.failed)")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                        Image(systemName: "xmark")
                            .font(.system(size: 9, weight: .medium))
                    }
                    .foregroundColor(.red.opacity(0.4))
                    
                    HStack(spacing: 2) {
                        Text("\(yesterdayStats.pending)")
                            .font(.system(size: 12, weight: .medium, design: .rounded))
                        Image(systemName: "hourglass")
                            .font(.system(size: 9, weight: .medium))
                    }
                    .foregroundColor(.yellow.opacity(0.5))
                }
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(
                            LinearGradient(
                                colors: [.white.opacity(0.25), .white.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1.5
                        )
                )
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        )
    }
    
    // MARK: - Habits List
    
    private var habitsList: some View {
        VStack(spacing: 14) {
            ForEach(viewModel.visibleHabits) { habit in
                NavigationLink(destination: HabitDetailView(habit: habit)) {
                    HabitCardView(
                        habit: habit,
                        log: viewModel.getLog(for: habit.id),
                        streak: viewModel.calculateStreak(for: habit),
                        isSortMode: viewModel.isSortMode,
                        onToggle: { count, status in
                            handleHabitToggle(habit: habit, count: count, status: status)
                        },
                        onDelete: {
                            if let log = viewModel.getLog(for: habit.id) {
                                viewModel.deleteLog(log)
                            }
                        },
                        onFail: {
                            // For habits that require reason on fail
                            activeHabitForReason = habit
                            failReason = ""
                            showingReasonSheet = true
                        }
                    )
                }
                .buttonStyle(PlainButtonStyle())
                .transition(.scale.combined(with: .opacity))
            }
        }
    }
    
    // MARK: - Handle Habit Toggle (with Reason Check)
    
    private func handleHabitToggle(habit: Habit, count: Int, status: LogStatus) {
        // If FAIL status and habit requires reason, show the reason sheet
        if status == .fail && habit.requireReason == true {
            activeHabitForReason = habit
            failReason = ""
            showingReasonSheet = true
        } else {
            // Normal toggle
            viewModel.logHabit(habit, count: count, status: status)
        }
    }
    
    // MARK: - Reason Sheet
    
    private var reasonSheet: some View {
        NavigationView {
            ZStack {
                // Dark background
                Color(hex: "0a0a0a")
                    .ignoresSafeArea()
                
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 48))
                            .foregroundColor(.red.opacity(0.8))
                        
                        Text("Why did you miss this?")
                            .font(.title2.bold())
                            .foregroundColor(.white)
                        
                        if let habit = activeHabitForReason {
                            Text(habit.displayName(language: "en"))
                                .font(.subheadline)
                                .foregroundColor(.gray)
                        }
                    }
                    .padding(.top, 20)
                    
                    // Text Input
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Reason")
                            .font(.caption)
                            .foregroundColor(.gray)
                        
                        TextField("Enter your reason...", text: $failReason, axis: .vertical)
                            .textFieldStyle(.plain)
                            .padding(16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.white.opacity(0.05))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .strokeBorder(Color.white.opacity(0.1), lineWidth: 1)
                                    )
                            )
                            .foregroundColor(.white)
                            .lineLimit(3...6)
                    }
                    .padding(.horizontal, 20)
                    
                    Spacer()
                    
                    // Save Button
                    Button {
                        if let habit = activeHabitForReason {
                            viewModel.logHabitWithReason(habit, reason: failReason)
                        }
                        showingReasonSheet = false
                        activeHabitForReason = nil
                        failReason = ""
                    } label: {
                        Text("Save")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                Capsule()
                                    .fill(Color.red.opacity(0.8))
                            )
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        showingReasonSheet = false
                        activeHabitForReason = nil
                        failReason = ""
                    }
                    .foregroundColor(.gray)
                }
            }
        }
        .presentationDetents([.medium])
        .presentationDragIndicator(.visible)
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

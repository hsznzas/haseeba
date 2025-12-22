//
//  HabitCardView.swift
//  Haseeb
//
//  Premium Liquid Glass Habit Card (Fixed for Supabase)
//

import SwiftUI

// MARK: - 1. THE MISSING PIECES (Extensions)
// We add these here so the UI still works with the simple Database Model
extension Habit {
    var displayName: String {
        return nameAr ?? name
    }
    
    var uiColor: Color {
        // Safe fallback colors if hex string is missing or invalid
        // You can update this to use your hex logic if Color(hex:) is globally available
        switch type {
        case .prayer: return Color.blue
        case .regular: return Color.green
        case .counter: return Color.orange
        }
    }
}

// Re-adding this Enum because it was removed from Models.swift
enum PrayerQuality: Int, CaseIterable {
    case missed = 0
    case qada = 1
    case alone = 2
    case jamaa = 3
    case takbirah = 4
    case onTime = 5
    
    var color: Color {
        switch self {
        case .missed: return .red
        case .qada: return .orange
        case .alone: return .yellow
        case .jamaa: return .green
        case .takbirah: return .blue
        case .onTime: return .purple
        }
    }
    
    var icon: String {
        switch self {
        case .missed: return "xmark"
        case .qada: return "arrow.uturn.backward"
        case .alone: return "person.fill"
        case .jamaa: return "person.3.fill"
        case .takbirah: return "hands.clap.fill"
        case .onTime: return "clock.fill"
        }
    }
}

// MARK: - 2. YOUR PREMIUM CARD VIEW
struct HabitCardView: View {
    let habit: Habit
    let log: HabitLog?
    let streak: Int
    let isSortMode: Bool
    let onToggle: (Int, LogStatus) -> Void
    let onDelete: () -> Void
    
    @State private var scale: CGFloat = 1.0
    @State private var isPressed: Bool = false
    
    private var isLogged: Bool {
        log != nil
    }
    
    private var isDone: Bool {
        log?.status == .done
    }
    
    private var isFailed: Bool {
        log?.status == .fail
    }
    
    var body: some View {
        Group {
            switch habit.type {
            case .counter:
                counterCard
            case .prayer:
                prayerCard
            case .regular:
                regularCard
            }
        }
        .scaleEffect(scale)
        .animation(.spring(response: 0.35, dampingFraction: 0.6), value: scale)
    }
    
    // MARK: - Regular Habit Card (Premium Glass)
    
    private var regularCard: some View {
        Button {
            // Tap feedback for entire card
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                scale = 0.97
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    scale = 1.0
                }
            }
        } label: {
            HStack(spacing: 0) {
                // Icon Section - Glass Divider
                iconSection
                
                // Title & Streak Section
                titleSection
                
                Spacer()
                
                // Action Buttons
                if isSortMode {
                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 16, weight: .semibold, design: .rounded))
                        .foregroundColor(.white.opacity(0.4))
                        .padding(.trailing, 18)
                } else if isLogged {
                    deleteButton
                } else {
                    actionButtons
                }
            }
            .frame(height: 68)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    // MARK: - Counter Habit Card
    
    private var counterCard: some View {
        let count = log?.value ?? 0
        let target = habit.dailyTarget ?? 1
        let progress = min(Double(count) / Double(target), 1.0)
        let isTargetMet = count >= target
        
        return VStack(spacing: 0) {
            HStack(spacing: 18) {
                // Glass Circular Progress
                ZStack {
                    Circle()
                        .stroke(.white.opacity(0.1), lineWidth: 4)
                        .frame(width: 60, height: 60)
                    
                    Circle()
                        .trim(from: 0, to: progress)
                        .stroke(
                            LinearGradient(
                                colors: isTargetMet ? [.green, .blue] : [.blue, .cyan],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 4, lineCap: .round)
                        )
                        .frame(width: 60, height: 60)
                        .rotationEffect(.degrees(-90))
                        .animation(.spring(response: 0.6, dampingFraction: 0.7), value: progress)
                    
                    Text(habit.emoji ?? "📊")
                        .font(.system(size: 26))
                }
                
                // Title & Count
                VStack(alignment: .leading, spacing: 5) {
                    Text(habit.displayName) // ✅ Fixed
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                        .lineLimit(1)
                    
                    HStack(spacing: 10) {
                        Text("\(count) / \(target)")
                            .font(.system(size: 13, weight: .semibold, design: .monospaced))
                            .foregroundColor(.white.opacity(0.6))
                        
                        if streak > 0 {
                            streakView
                        }
                    }
                }
                
                Spacer()
                
                // Glass Counter Controls
                if !isSortMode {
                    VStack(spacing: 10) {
                        // +/- Controls
                        HStack(spacing: 0) {
                            Button {
                                if count > 0 {
                                    onToggle(count - 1, count - 1 >= target ? .done : .fail)
                                }
                            } label: {
                                Image(systemName: "minus")
                                    .font(.system(size: 14, weight: .bold, design: .rounded))
                                    .foregroundColor(.white.opacity(0.6))
                                    .frame(width: 36, height: 36)
                                    .background(.white.opacity(0.06))
                            }
                            
                            Rectangle()
                                .fill(.white.opacity(0.15))
                                .frame(width: 1, height: 18)
                            
                            Button {
                                onToggle(count + 1, count + 1 >= target ? .done : .fail)
                            } label: {
                                Image(systemName: "plus")
                                    .font(.system(size: 14, weight: .bold, design: .rounded))
                                    .foregroundColor(.blue.opacity(0.9))
                                    .frame(width: 36, height: 36)
                                    .background(.blue.opacity(0.12))
                            }
                        }
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .strokeBorder(.white.opacity(0.15), lineWidth: 1)
                                )
                        )
                        
                        // Check Button
                        Button {
                            onToggle(count, count >= target ? .done : .fail)
                        } label: {
                            HStack(spacing: 5) {
                                if isTargetMet {
                                    Image(systemName: "checkmark.circle.fill")
                                        .font(.system(size: 13, weight: .bold))
                                } else {
                                    Text("Done")
                                        .font(.system(size: 11, weight: .bold, design: .rounded))
                                }
                            }
                            .foregroundColor(isTargetMet ? .green : .white.opacity(0.5))
                            .frame(width: 72, height: 30)
                            .background(
                                RoundedRectangle(cornerRadius: 10)
                                    .fill(isTargetMet ? .green.opacity(0.2) : .white.opacity(0.04))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 10)
                                            .strokeBorder(
                                                isTargetMet ? .green.opacity(0.4) : .white.opacity(0.12),
                                                lineWidth: 1
                                            )
                                    )
                            )
                        }
                    }
                }
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        )
    }
    
    // MARK: - Prayer Card
    
    private var prayerCard: some View {
        HStack(spacing: 0) {
            // Icon with Glass Divider
            HStack {
                Text(habit.emoji ?? "🕌")
                    .font(.system(size: 24))
            }
            .frame(width: 48)
            .overlay(
                Rectangle()
                    .fill(.white.opacity(0.1))
                    .frame(width: 1),
                alignment: .trailing
            )
            
            // Title & Streak
            HStack(spacing: 10) {
                Text(habit.displayName) // ✅ Fixed
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .foregroundColor(isLogged ? .white.opacity(0.5) : .white)
                
                if streak > 0 {
                    streakView
                }
            }
            .padding(.leading, 14)
            
            Spacer()
            
            // Prayer Quality Buttons or Delete
            if !isSortMode && !isLogged {
                HStack(spacing: 0) {
                    prayerButton(quality: .takbirah, color: .blue, icon: "star.fill")
                    prayerButton(quality: .jamaa, color: .yellow, icon: "person.2.fill")
                    prayerButton(quality: .onTime, color: .orange, icon: "clock.fill")
                    prayerButton(quality: .missed, color: .red, icon: "xmark")
                }
            } else if isLogged {
                deleteButton
            }
        }
        .frame(height: 68)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 24)
                        .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        )
    }
    
    private func prayerButton(quality: PrayerQuality, color: Color, icon: String) -> some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                scale = 0.95
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    scale = 1.0
                }
            }
            onToggle(quality.rawValue, .done)
        } label: {
            Image(systemName: icon)
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(color.opacity(0.9))
                .frame(width: 38)
                .frame(maxHeight: .infinity)
                .background(color.opacity(0.15))
                .overlay(
                    Rectangle()
                        .fill(.white.opacity(0.08))
                        .frame(width: 1),
                    alignment: .leading
                )
        }
    }
    
    // MARK: - Subviews
    
    private var iconSection: some View {
        HStack {
            if let emoji = habit.emoji {
                Text(emoji)
                    .font(.system(size: 24))
            } else {
                // Fallback icon logic
                Image(systemName: "star.fill")
                    .font(.system(size: 20, weight: .semibold, design: .rounded))
                    .foregroundColor(habit.uiColor) // ✅ Fixed
            }
        }
        .frame(width: 48)
        .overlay(
            Rectangle()
                .fill(.white.opacity(0.1))
                .frame(width: 1),
            alignment: .trailing
        )
    }
    
    private var titleSection: some View {
        HStack(spacing: 10) {
            Text(habit.displayName) // ✅ Fixed
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundColor(isLogged ? .white.opacity(0.5) : .white)
                .lineLimit(1)
            
            if isDone {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundColor(.green)
            } else if isFailed {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 12, weight: .bold, design: .rounded))
                    .foregroundColor(.red)
            }
            
            if streak > 0 {
                streakView
            }
        }
        .padding(.leading, 14)
    }
    
    private var streakView: some View {
        HStack(spacing: 3) {
            Text("🔥")
                .font(.system(size: 12))
            Text("\(streak)")
                .font(.system(size: 11, weight: .black, design: .rounded))
                .foregroundColor(.orange)
        }
        .padding(.horizontal, 7)
        .padding(.vertical, 4)
        .background(
            Capsule()
                .fill(.orange.opacity(0.15))
                .overlay(
                    Capsule()
                        .strokeBorder(.orange.opacity(0.3), lineWidth: 1)
                )
        )
    }
    
    private var actionButtons: some View {
        HStack(spacing: 0) {
            // Done Button - Glass Green
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    scale = 1.03
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        scale = 1.0
                    }
                }
                onToggle(1, .done)
            } label: {
                Image(systemName: "checkmark")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.green.opacity(0.95))
                    .frame(width: 60)
                    .frame(maxHeight: .infinity)
                    .background(.green.opacity(0.15))
                    .overlay(
                        Rectangle()
                            .fill(.white.opacity(0.08))
                            .frame(width: 1),
                        alignment: .leading
                    )
            }
            
            // Fail Button - Glass Red
            Button {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    scale = 0.97
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                        scale = 1.0
                    }
                }
                onToggle(0, .fail)
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.red.opacity(0.95))
                    .frame(width: 60)
                    .frame(maxHeight: .infinity)
                    .background(.red.opacity(0.15))
            }
        }
        .clipShape(
            UnevenRoundedRectangle(
                topLeadingRadius: 0,
                bottomLeadingRadius: 0,
                bottomTrailingRadius: 24,
                topTrailingRadius: 24
            )
        )
    }
    
    private var deleteButton: some View {
        Button {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                scale = 0.95
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
                withAnimation(.spring(response: 0.3, dampingFraction: 0.6)) {
                    scale = 1.0
                }
            }
            onDelete()
        } label: {
            Image(systemName: "arrow.counterclockwise")
                .font(.system(size: 17, weight: .semibold, design: .rounded))
                .foregroundColor(.white.opacity(0.5))
                .frame(width: 70)
                .frame(maxHeight: .infinity)
                .background(.white.opacity(0.04))
        }
        .clipShape(
            UnevenRoundedRectangle(
                topLeadingRadius: 0,
                bottomLeadingRadius: 0,
                bottomTrailingRadius: 24,
                topTrailingRadius: 24
            )
        )
    }
}

// MARK: - Preview (Fixed Init)

struct HabitCardView_Previews: PreviewProvider {
    static var previews: some View {
        ZStack {
            // Premium background
            LinearGradient(
                colors: [
                    Color(hex: "1e1b4b"),
                    Color(hex: "000000")
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 18) {
                // Regular Habit
                HabitCardView(
                    habit: Habit(
                        id: "quran",
                        name: "Quran Reading",
                        nameAr: "قراءة القرآن",
                        type: .regular,
                        emoji: "📖",
                        dailyTarget: nil,
                        presetId: nil,
                        isActive: true,
                        orderIndex: 0, // ✅ Fixed param name
                        startDate: nil,
                        requireReason: true,
                        affectsScore: true
                    ),
                    log: nil,
                    streak: 7,
                    isSortMode: false,
                    onToggle: { _, _ in },
                    onDelete: {}
                )
            }
            .padding(20)
        }
        .preferredColorScheme(.dark)
    }
}

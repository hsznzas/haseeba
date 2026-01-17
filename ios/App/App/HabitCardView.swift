//
//  HabitCardView.swift
//  Haseeb
//
//  Premium Liquid Glass Habit Card
//  Updated: Fail/Done buttons, text scaling, streak style, icon mapping
//

import SwiftUI

struct HabitCardView: View {
    let habit: Habit
    let log: HabitLog?
    let streak: Int
    let isSortMode: Bool
    let onToggle: (Int, LogStatus) -> Void
    let onDelete: () -> Void
    var onFail: (() -> Void)? = nil  // Optional: for "require reason" habits
    
    @EnvironmentObject var languageManager: LanguageManager
    @State private var scale: CGFloat = 1.0
    
    // MARK: - Computed Properties
    
    /// A habit is logged ONLY if there's a valid log object
    private var isLogged: Bool {
        guard let log = log else { return false }
        // For prayer: consider logged if count >= 0 (even missed is a log)
        // For regular/counter: any log means logged
        return true
    }
    
    private var isDone: Bool { log?.status == .done }
    private var isFailed: Bool { log?.status == .fail }
    
    var body: some View {
        Group {
            if let type = habit.type {
                switch type {
                case .counter: counterCard
                case .prayer: prayerCard
                case .regular: regularCard
                }
            } else {
                regularCard
            }
        }
        .scaleEffect(scale)
        .animation(.spring(response: 0.35, dampingFraction: 0.6), value: scale)
    }
    
    // MARK: - Icon Mapping Helper
    
    /// Maps emoji, web icon names, or prayer names to SF Symbols
    private func mapToSFSymbol(_ name: String?) -> String {
        guard let name = name, !name.isEmpty else {
            return "star.fill"
        }
        
        let lowercased = name.lowercased()
        
        // === PRAYER NAMES (Text-based) ===
        let prayerMappings: [String: String] = [
            "fajr": "moon.stars.fill",
            "dhuhr": "sun.max.fill",
            "asr": "sun.min.fill",
            "maghrib": "sunset.fill",
            "isha": "moon.fill",
            "sunrise": "sunrise.fill",
            "sunset": "sunset.fill",
            "moon": "moon.stars.fill",
            "sun": "sun.max.fill",
            "night": "moon.fill",
            "cloud": "sun.min.fill",
            "quran": "book.fill",
            "book": "book.fill",
            "prayer": "hands.sparkles.fill",
        ]
        
        // === GENERAL WEB ICONS (Text-based) ===
        let webIconMappings: [String: String] = [
            "water": "drop.fill",
            "drop": "drop.fill",
            "gym": "dumbbell.fill",
            "dumbbell": "dumbbell.fill",
            "fitness": "figure.run",
            "run": "figure.run",
            "money": "banknote.fill",
            "dollar": "banknote.fill",
            "cash": "banknote.fill",
            "heart": "heart.fill",
            "health": "heart.fill",
            "sleep": "bed.double.fill",
            "bed": "bed.double.fill",
            "meditation": "figure.mind.and.body",
            "yoga": "figure.mind.and.body",
            "food": "leaf.fill",
            "diet": "leaf.fill",
            "pill": "pill.fill",
            "medicine": "pill.fill",
            "study": "book.fill",
            "read": "book.open.fill",
            "write": "pencil",
            "note": "note.text",
            "work": "laptopcomputer",
            "computer": "laptopcomputer",
            "target": "target",
            "goal": "target",
            "check": "checkmark.circle.fill",
            "done": "checkmark.circle.fill",
            "brain": "brain.head.profile",
            "think": "brain.head.profile",
            "time": "alarm.fill",
            "alarm": "alarm.fill",
            "clock": "clock.fill",
            "fire": "flame.fill",
            "streak": "flame.fill",
            "star": "star.fill",
            "music": "music.note",
            "phone": "iphone",
            "home": "house.fill",
            "car": "car.fill",
            "travel": "airplane",
            "walk": "figure.walk",
            "steps": "figure.walk",
        ]
        
        // === EMOJI MAPPINGS ===
        let emojiMappings: [String: String] = [
            // Prayer/Religious
            "🕌": "moon.stars.fill",
            "🌅": "sunrise.fill",
            "☀️": "sun.max.fill",
            "🌙": "moon.fill",
            "🌃": "moon.stars.fill",
            "🤲": "hands.sparkles.fill",
            "📿": "sparkles",
            "🌤️": "sun.min.fill",
            "🌌": "moon.fill",
            
            // Health/Fitness
            "💧": "drop.fill",
            "🏃": "figure.run",
            "🏋️": "dumbbell.fill",
            "🧘": "figure.mind.and.body",
            "😴": "bed.double.fill",
            "💤": "moon.zzz.fill",
            "🍎": "apple.logo",
            "🥗": "leaf.fill",
            "💊": "pill.fill",
            "🚶": "figure.walk",
            
            // Productivity
            "📚": "book.fill",
            "📖": "book.open.fill",
            "✍️": "pencil",
            "📝": "note.text",
            "💻": "laptopcomputer",
            "🎯": "target",
            "✅": "checkmark.circle.fill",
            
            // Mindfulness
            "🧠": "brain.head.profile",
            "❤️": "heart.fill",
            "🙏": "hands.sparkles.fill",
            "😊": "face.smiling.fill",
            
            // Time
            "⏰": "alarm.fill",
            "🌞": "sun.max.fill",
            "🌜": "moon.fill",
            
            // Money
            "💰": "banknote.fill",
            "💵": "banknote.fill",
            "💳": "creditcard.fill",
            
            // Misc
            "🔥": "flame.fill",
            "⭐": "star.fill",
            "🎵": "music.note",
            "🎧": "headphones",
            "📱": "iphone",
            "🏠": "house.fill",
            "🚗": "car.fill",
            "✈️": "airplane",
            "🌍": "globe.americas.fill"
        ]
        
        // 1. Check emoji mappings first (exact match)
        if let sfSymbol = emojiMappings[name] {
            return sfSymbol
        }
        
        // 2. Check prayer name mappings (lowercased partial match)
        for (key, symbol) in prayerMappings {
            if lowercased.contains(key) {
                return symbol
            }
        }
        
        // 3. Check web icon mappings (lowercased partial match)
        for (key, symbol) in webIconMappings {
            if lowercased.contains(key) {
                return symbol
            }
        }
        
        // 4. If it's already a valid SF Symbol name
        if name.contains(".") || UIImage(systemName: name) != nil {
            return name
        }
        
        // 5. Default fallback
        return "star.fill"
    }
    
    // MARK: - Smart Icon View
    
    private func smartIcon(name: String?, size: CGFloat) -> some View {
        let symbolName = mapToSFSymbol(name)
        
        return Group {
            if UIImage(systemName: symbolName) != nil {
                Image(systemName: symbolName)
                    .font(.system(size: size, weight: .semibold))
            } else if let name = name {
                // Fallback to text for unmapped emojis
                Text(name)
                    .font(.system(size: size))
            } else {
                Image(systemName: "star.fill")
                    .font(.system(size: size, weight: .semibold))
            }
        }
    }
    
    // MARK: - Regular Card
    private var regularCard: some View {
        HStack(spacing: 12) {
            iconSection
            titleSection
            Spacer()
            if isSortMode {
                Image(systemName: "line.3.horizontal").foregroundColor(.gray)
            } else if isLogged {
                deleteButton
            } else {
                // Two buttons: Fail [X] and Done [✓]
                dualActionButtons
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 72)
        .background(glassBackground)
    }
    
    // MARK: - Counter Card
    private var counterCard: some View {
        let count = log?.count ?? 0
        let target = habit.targetCount ?? 1
        let progress = min(Double(count) / Double(target), 1.0)
        let isTargetMet = count >= target
        
        return VStack(spacing: 0) {
            HStack(spacing: 16) {
                // Progress Circle with Icon
                ZStack {
                    Circle().stroke(.white.opacity(0.1), lineWidth: 4).frame(width: 50, height: 50)
                    Circle().trim(from: 0, to: progress)
                        .stroke(isTargetMet ? Color.green : Color.blue, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .frame(width: 50, height: 50).rotationEffect(.degrees(-90))
                    
                    smartIcon(name: habit.emoji, size: 20)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(habit.displayName(language: "en"))
                        .font(.headline)
                        .foregroundColor(.white)
                        .minimumScaleFactor(0.7)
                        .lineLimit(1)
                    
                    Text("\(count) / \(target)")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.6))
                        .monospacedDigit()
                }
                
                Spacer()
                
                if !isSortMode {
                    HStack(spacing: 0) {
                        Button { if count > 0 { onToggle(count - 1, .done) } } label: {
                            Image(systemName: "minus").frame(width: 40, height: 40).background(Color.white.opacity(0.05))
                        }
                        Divider().frame(height: 20).background(Color.white.opacity(0.2))
                        Button { onToggle(count + 1, .done) } label: {
                            Image(systemName: "plus").frame(width: 40, height: 40).background(Color.blue.opacity(0.2))
                        }
                    }
                    .cornerRadius(12)
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.2), lineWidth: 1))
                }
            }
            .padding(16)
        }
        .background(glassBackground)
    }
    
    // MARK: - Prayer Card (Flexible Layout)
    private var prayerCard: some View {
        VStack(spacing: 0) {
            // Top Row: Icon + Name + Streak
            HStack(spacing: 12) {
                smartIcon(name: habit.emoji, size: 22)
                    .foregroundColor(Color(hex: habit.color ?? "#3b82f6"))
                    .frame(width: 40, height: 40)
                    .background(Color(hex: habit.color ?? "#3b82f6").opacity(0.15))
                    .cornerRadius(12)
                
                Text(habit.displayName(language: "en"))
                    .font(.headline)
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.7)
                    .lineLimit(1)
                
                Spacer()
                
                if streak > 0 {
                    streakBadge
                }
                
                if isLogged {
                    deleteButton
                }
            }
            .padding(16)
            
            // Bottom Row: 4 Buttons (Only if NOT logged)
            if !isSortMode && !isLogged {
                Divider().background(Color.white.opacity(0.1))
                
                HStack(spacing: 1) {
                    prayerButton(icon: "star.fill", color: .blue, quality: .takbirah)
                    prayerButton(icon: "person.2.fill", color: .yellow, quality: .jamaa)
                    prayerButton(icon: "clock.fill", color: .orange, quality: .onTime)
                    prayerButton(icon: "xmark", color: .red, quality: .missed)
                }
                .frame(height: 44)
            }
        }
        .background(glassBackground)
    }
    
    // MARK: - Helper Views
    
    private func prayerButton(icon: String, color: Color, quality: PrayerQuality) -> some View {
        Button {
            animatePress()
            onToggle(quality.rawValue, .done)
        } label: {
            ZStack {
                Color.white.opacity(0.03)
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(color)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 44)
        }
    }
    
    private var iconSection: some View {
        smartIcon(name: habit.emoji, size: 24)
            .foregroundColor(Color(hex: habit.color ?? "#ffffff"))
            .frame(width: 40)
    }
    
    private var titleSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(habit.displayName(language: languageManager.language.rawValue))
                .font(.headline)
                .foregroundColor(isLogged ? .gray : .white)
                .strikethrough(isLogged)
                .minimumScaleFactor(0.7)
                .lineLimit(1)
            
            if streak > 0 {
                streakBadge
            }
        }
    }
    
    // MARK: - Streak Badge (🔥 + number only)
    private var streakBadge: some View {
        HStack(spacing: 3) {
            Text("🔥")
                .font(.system(size: 12))
            Text("\(streak)")
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundColor(.orange)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.orange.opacity(0.15))
        .cornerRadius(8)
    }
    
    // MARK: - Dual Action Buttons (Fail/Done)
    private var dualActionButtons: some View {
        HStack(spacing: 8) {
            // Fail Button [X] - Red Glass
            Button {
                animatePress()
                // If habit requires reason, use onFail callback
                if habit.requireReason == true, let failAction = onFail {
                    failAction()
                } else {
                    onToggle(0, .fail)
                }
            } label: {
                Image(systemName: "xmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.red)
                    .frame(width: 36, height: 36)
                    .background(
                        Circle()
                            .fill(Color.red.opacity(0.15))
                            .overlay(
                                Circle()
                                    .strokeBorder(Color.red.opacity(0.3), lineWidth: 1)
                            )
                    )
            }
            .buttonStyle(PlainButtonStyle())
            
            // Done Button [✓] - Green Glass
            Button {
                animatePress()
                onToggle(1, .done)
            } label: {
                Image(systemName: "checkmark")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.green)
                    .frame(width: 36, height: 36)
                    .background(
                        Circle()
                            .fill(Color.green.opacity(0.15))
                            .overlay(
                                Circle()
                                    .strokeBorder(Color.green.opacity(0.3), lineWidth: 1)
                            )
                    )
            }
            .buttonStyle(PlainButtonStyle())
        }
    }
    
    private var deleteButton: some View {
        Button { animatePress(); onDelete() } label: {
            Image(systemName: "arrow.counterclockwise")
                .foregroundColor(.white.opacity(0.5))
                .padding(10)
        }
    }
    
    private var glassBackground: some View {
        RoundedRectangle(cornerRadius: 16)
            .fill(Material.ultraThin)
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.white.opacity(0.1), lineWidth: 1))
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
    
    private func animatePress() {
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
        withAnimation(.spring()) { scale = 0.95 }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { withAnimation { scale = 1.0 } }
    }
}

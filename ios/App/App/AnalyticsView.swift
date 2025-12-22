//
//  AnalyticsView.swift
//  Haseeb
//
//  Analytics page with charts and insights
//

import SwiftUI

struct AnalyticsView: View {
    var body: some View {
        NavigationView {
            ZStack {
                // MARK: - Spiritual Night Sky Background
                LinearGradient(
                    colors: [
                        Color(hex: "1e1b4b"), // Deep indigo
                        Color(hex: "000000")  // Pure black
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // MARK: - Content
                VStack(spacing: 32) {
                    Spacer()
                    
                    // Icon
                    ZStack {
                        Circle()
                            .fill(.ultraThinMaterial)
                            .frame(width: 100, height: 100)
                            .overlay(
                                Circle()
                                    .strokeBorder(
                                        LinearGradient(
                                            colors: [.white.opacity(0.3), .white.opacity(0.1)],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        ),
                                        lineWidth: 2
                                    )
                            )
                            .shadow(color: .black.opacity(0.3), radius: 15, x: 0, y: 8)
                        
                        Image(systemName: "chart.bar.fill")
                            .font(.system(size: 44, weight: .semibold, design: .rounded))
                            .foregroundColor(.blue.opacity(0.9))
                    }
                    
                    // Title
                    Text("Analytics")
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                    
                    // Subtitle
                    Text("Charts coming soon")
                        .font(.system(size: 16, weight: .medium, design: .rounded))
                        .foregroundColor(.white.opacity(0.6))
                        .padding(.horizontal, 16)
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
                    
                    Spacer()
                    
                    // Coming Soon Features
                    VStack(spacing: 12) {
                        featureRow(icon: "chart.line.uptrend.xyaxis", text: "Prayer quality trends")
                        featureRow(icon: "flame.fill", text: "Streak analytics")
                        featureRow(icon: "calendar", text: "Monthly heatmaps")
                        featureRow(icon: "trophy.fill", text: "Achievement insights")
                    }
                    .padding(.horizontal, 24)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationBarTitleDisplayMode(.inline)
        }
        .preferredColorScheme(.dark)
    }
    
    // MARK: - Feature Row
    
    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .foregroundColor(.blue.opacity(0.8))
                .frame(width: 24)
            
            Text(text)
                .font(.system(size: 14, weight: .medium, design: .rounded))
                .foregroundColor(.white.opacity(0.7))
            
            Spacer()
            
            Image(systemName: "clock.fill")
                .font(.system(size: 12, weight: .semibold, design: .rounded))
                .foregroundColor(.white.opacity(0.3))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(.white.opacity(0.15), lineWidth: 1)
                )
        )
    }
}

// MARK: - Preview

struct AnalyticsView_Previews: PreviewProvider {
    static var previews: some View {
        AnalyticsView()
    }
}

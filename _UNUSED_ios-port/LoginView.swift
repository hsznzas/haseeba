//
//  LoginView.swift
//  Haseeb
//
//  Native login screen with premium glass design
//

import SwiftUI

struct LoginView: View {
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var isLoading: Bool = false
    @State private var showError: Bool = false
    @State private var errorMessage: String = ""
    @Binding var isLoggedIn: Bool
    
    var body: some View {
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
            ScrollView(showsIndicators: false) {
                VStack(spacing: 32) {
                    Spacer()
                        .frame(height: 60)
                    
                    // MARK: - Logo
                    logoSection
                    
                    // MARK: - Welcome Text
                    VStack(spacing: 8) {
                        Text("Welcome Back")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        
                        Text("Sign in to continue your journey")
                            .font(.system(size: 15, weight: .medium, design: .rounded))
                            .foregroundColor(.white.opacity(0.6))
                    }
                    .padding(.bottom, 16)
                    
                    // MARK: - Login Form
                    VStack(spacing: 16) {
                        // Email Field
                        glassTextField(
                            icon: "envelope.fill",
                            placeholder: "Email",
                            text: $email,
                            keyboardType: .emailAddress
                        )
                        
                        // Password Field
                        glassSecureField(
                            icon: "lock.fill",
                            placeholder: "Password",
                            text: $password
                        )
                        
                        // Forgot Password
                        HStack {
                            Spacer()
                            Button {
                                print("🔑 Forgot password tapped")
                            } label: {
                                Text("Forgot Password?")
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                    .foregroundColor(.blue.opacity(0.9))
                            }
                        }
                        .padding(.horizontal, 4)
                    }
                    .padding(.horizontal, 24)
                    
                    // MARK: - Sign In Button
                    signInButton
                        .padding(.horizontal, 24)
                        .padding(.top, 8)
                    
                    // MARK: - Error Message
                    if showError {
                        errorBanner
                            .padding(.horizontal, 24)
                    }
                    
                    // MARK: - Divider
                    HStack(spacing: 16) {
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [.clear, .white.opacity(0.2), .clear],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(height: 1)
                        
                        Text("OR")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundColor(.white.opacity(0.4))
                        
                        Rectangle()
                            .fill(
                                LinearGradient(
                                    colors: [.clear, .white.opacity(0.2), .clear],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(height: 1)
                    }
                    .padding(.horizontal, 24)
                    .padding(.top, 8)
                    
                    // MARK: - Demo Mode Button
                    demoModeButton
                        .padding(.horizontal, 24)
                    
                    Spacer()
                        .frame(height: 40)
                }
            }
            
            // MARK: - Loading Overlay
            if isLoading {
                loadingOverlay
            }
        }
        .preferredColorScheme(.dark)
    }
    
    // MARK: - Logo Section
    
    private var logoSection: some View {
        ZStack {
            // Glow effect
            Circle()
                .fill(
                    RadialGradient(
                        colors: [.blue.opacity(0.4), .clear],
                        center: .center,
                        startRadius: 0,
                        endRadius: 80
                    )
                )
                .frame(width: 160, height: 160)
                .blur(radius: 20)
            
            // Main logo circle
            Circle()
                .fill(.ultraThinMaterial)
                .frame(width: 120, height: 120)
                .overlay(
                    Circle()
                        .strokeBorder(
                            LinearGradient(
                                colors: [.white.opacity(0.4), .white.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2
                        )
                )
                .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
            
            // Icon
            Image(systemName: "flame.fill")
                .font(.system(size: 56, weight: .semibold))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.orange, .red],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
        }
    }
    
    // MARK: - Glass TextField
    
    private func glassTextField(icon: String, placeholder: String, text: Binding<String>, keyboardType: UIKeyboardType = .default) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .foregroundColor(.white.opacity(0.6))
                .frame(width: 24)
            
            TextField("", text: text, prompt: Text(placeholder).foregroundColor(.white.opacity(0.4)))
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundColor(.white)
                .keyboardType(keyboardType)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        )
    }
    
    // MARK: - Glass Secure Field
    
    private func glassSecureField(icon: String, placeholder: String, text: Binding<String>) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .foregroundColor(.white.opacity(0.6))
                .frame(width: 24)
            
            SecureField("", text: text, prompt: Text(placeholder).foregroundColor(.white.opacity(0.4)))
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundColor(.white)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 18)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(.ultraThinMaterial)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                )
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        )
    }
    
    // MARK: - Sign In Button
    
    private var signInButton: some View {
        Button {
            handleSignIn()
        } label: {
            HStack(spacing: 12) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text("Sign In")
                        .font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 18)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(
                        LinearGradient(
                            colors: [.blue, .cyan],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .strokeBorder(.white.opacity(0.3), lineWidth: 1)
                    )
                    .shadow(color: .blue.opacity(0.4), radius: 15, x: 0, y: 8)
            )
        }
        .disabled(isLoading || email.isEmpty || password.isEmpty)
        .opacity((isLoading || email.isEmpty || password.isEmpty) ? 0.6 : 1.0)
    }
    
    // MARK: - Demo Mode Button
    
    private var demoModeButton: some View {
        Button {
            handleDemoMode()
        } label: {
            HStack(spacing: 10) {
                Image(systemName: "eye.fill")
                    .font(.system(size: 14, weight: .semibold, design: .rounded))
                
                Text("Try Demo Mode")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
            }
            .foregroundColor(.white.opacity(0.8))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 18)
                            .strokeBorder(.white.opacity(0.15), lineWidth: 1)
                    )
            )
        }
    }
    
    // MARK: - Error Banner
    
    private var errorBanner: some View {
        HStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle.fill")
                .font(.system(size: 14, weight: .semibold, design: .rounded))
                .foregroundColor(.red.opacity(0.9))
            
            Text(errorMessage)
                .font(.system(size: 13, weight: .medium, design: .rounded))
                .foregroundColor(.white)
                .lineLimit(2)
            
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(.red.opacity(0.15))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(.red.opacity(0.3), lineWidth: 1)
                )
        )
    }
    
    // MARK: - Loading Overlay
    
    private var loadingOverlay: some View {
        ZStack {
            Color.black.opacity(0.4)
                .ignoresSafeArea()
            
            VStack(spacing: 16) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    .scaleEffect(1.5)
                
                Text("Signing in...")
                    .font(.system(size: 15, weight: .semibold, design: .rounded))
                    .foregroundColor(.white)
            }
            .padding(32)
            .background(
                RoundedRectangle(cornerRadius: 24)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 24)
                            .strokeBorder(.white.opacity(0.2), lineWidth: 1)
                    )
                    .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
            )
        }
    }
    
    // MARK: - Actions
    
    private func handleSignIn() {
        // Hide keyboard
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
        
        // Basic validation
        guard !email.isEmpty else {
            showErrorMessage("Please enter your email")
            return
        }
        
        guard !password.isEmpty else {
            showErrorMessage("Please enter your password")
            return
        }
        
        guard email.contains("@") else {
            showErrorMessage("Please enter a valid email")
            return
        }
        
        // Show loading
        isLoading = true
        showError = false
        
        print("🔐 Sign in tapped with email: \(email)")
        
        // Simulate network delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            // Generate and save dummy token via AuthManager
            let dummyToken = "dummy_token_\(UUID().uuidString)"
            AuthManager.shared.login(token: dummyToken)
            
            // Update logged in state
            isLoading = false
            
            withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
                isLoggedIn = true
            }
            
            print("✅ User logged in successfully")
        }
    }
    
    private func handleDemoMode() {
        print("🎨 Demo mode activated")
        
        // Save demo token via AuthManager
        AuthManager.shared.login(token: "demo_token")
        
        withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
            isLoggedIn = true
        }
        
        print("✅ Demo mode active")
    }
    
    private func showErrorMessage(_ message: String) {
        errorMessage = message
        withAnimation {
            showError = true
        }
        
        // Auto-hide after 3 seconds
        DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
            withAnimation {
                showError = false
            }
        }
    }
}

// MARK: - Preview

struct LoginView_Previews: PreviewProvider {
    static var previews: some View {
        LoginView(isLoggedIn: .constant(false))
    }
}

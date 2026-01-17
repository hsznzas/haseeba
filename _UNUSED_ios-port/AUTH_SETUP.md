# 🔐 Native Authentication Setup Guide

## ✅ Files Created

1. **`LoginView.swift`** - Premium login screen with glass design
2. **`AppRootView.swift`** - Auth state manager (shows Login or MainTabView)

---

## 🏗️ Architecture

```
AppRootView (Entry Point)
├── Splash Screen (checking auth...)
├── LoginView (if not authenticated)
│   ├── Email + Password fields
│   ├── Sign In button → Saves dummy token → isLoggedIn = true
│   └── Demo Mode button → Quick access
└── MainTabView (if authenticated)
    ├── HomeView
    ├── AnalyticsView
    └── ProfileView
```

---

## 🎨 LoginView Features

### Design
- ✅ Spiritual night sky gradient (#1e1b4b → #000000)
- ✅ Glass logo with flame icon and glow effect
- ✅ "Welcome Back" title with subtitle
- ✅ Premium glass text fields (email + password)
- ✅ Blue/Cyan gradient sign-in button
- ✅ Demo mode button for quick testing
- ✅ Error banner with auto-dismiss
- ✅ Loading overlay during sign-in
- ✅ Rounded typography throughout

### Functionality
```swift
@State private var email: String = ""
@State private var password: String = ""
@State private var isLoading: Bool = false
@Binding var isLoggedIn: Bool // Controls navigation
```

**Sign In Flow:**
1. User enters email and password
2. Basic validation (checks for @ in email, non-empty fields)
3. Shows loading overlay
4. Simulates 1.5s network delay
5. Saves dummy token to UserDefaults
6. Sets `isLoggedIn = true` → Navigates to MainTabView

**Demo Mode Flow:**
1. User taps "Try Demo Mode"
2. Saves demo token to UserDefaults
3. Sets `isLoggedIn = true` immediately

---

## 🚀 AppRootView Features

### States
```swift
@State private var isLoggedIn: Bool = false
@State private var isCheckingAuth: Bool = true
```

### Flow
1. **App Launch** → Shows splash screen
2. **Check Auth** (1s delay):
   - If token exists in UserDefaults → `isLoggedIn = true` → Show MainTabView
   - If no token → `isLoggedIn = false` → Show LoginView
3. **After Login** → `isLoggedIn = true` → Show MainTabView with animation

### Console Logs
```
🔍 Checking authentication status...
✅ Auth token found: dummy_token_550e8400...
```

Or:
```
🔍 Checking authentication status...
⚠️ No auth token found. Showing login screen.
```

---

## 🔧 Integration

### Step 1: Update Entry Point

**In SceneDelegate.swift (or wherever you set the root view):**

```swift
// Change from:
let rootView = MainTabView()

// To:
let rootView = AppRootView()
```

### Step 2: Test the Flow

1. **First Launch (No Token)**
   - Shows splash screen (1s)
   - Shows LoginView
   - Enter email/password → Tap "Sign In"
   - Navigates to MainTabView

2. **Subsequent Launches (Token Exists)**
   - Shows splash screen (1s)
   - Automatically navigates to MainTabView

3. **Test Logout**
   - Go to Profile tab → Tap "Log Out"
   - Clear token: `UserDefaults.standard.removeItem(forKey: "user_session_token")`
   - Force back to LoginView

---

## 🧪 Testing

### Test Sign In
```swift
// Enter in LoginView:
Email: test@example.com
Password: password123

// Console output:
🔐 Sign in tapped with email: test@example.com
✅ Dummy token saved: dummy_token_550e8400-e29b-41d4-a716-446655440000
✅ User logged in successfully
```

### Test Demo Mode
```swift
// Tap "Try Demo Mode"

// Console output:
🎨 Demo mode activated
✅ Demo mode active
```

### Test Validation
```swift
// Empty email:
"Please enter your email"

// Invalid email format:
"Please enter a valid email"

// Empty password:
"Please enter your password"
```

---

## 🔄 Integration with ProfileView

Update the **Log Out** button in `ProfileView.swift`:

```swift
Button("Log Out", role: .destructive) {
    print("🚪 Log out tapped")
    
    // Clear token
    UserDefaults.standard.removeItem(forKey: "user_session_token")
    
    // Reset to login screen
    // Option 1: Restart app
    exit(0)
    
    // Option 2: Use @EnvironmentObject to manage auth state globally
    // authManager.logout()
}
```

---

## 🎯 Advanced: Real Authentication

To connect to your Supabase backend, update `handleSignIn()` in `LoginView.swift`:

```swift
private func handleSignIn() {
    isLoading = true
    showError = false
    
    Task {
        do {
            // Call your auth service
            let token = try await AuthService.shared.signIn(
                email: email,
                password: password
            )
            
            // Save real token
            UserDefaults.standard.set(token, forKey: "user_session_token")
            
            await MainActor.run {
                isLoading = false
                isLoggedIn = true
            }
            
            print("✅ User authenticated successfully")
            
        } catch {
            await MainActor.run {
                isLoading = false
                showErrorMessage("Invalid email or password")
            }
            
            print("❌ Authentication failed: \(error.localizedDescription)")
        }
    }
}
```

---

## 🔐 Create AuthService.swift (Optional)

For real authentication, create this service:

```swift
import Foundation

class AuthService {
    static let shared = AuthService()
    
    private let baseURL = "https://YOUR_SUPABASE_URL.supabase.co"
    private let apiKey = "YOUR_SUPABASE_ANON_KEY"
    
    func signIn(email: String, password: String) async throws -> String {
        let url = URL(string: "\(baseURL)/auth/v1/token?grant_type=password")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: String] = [
            "email": email,
            "password": password
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "AuthService", code: -1, 
                         userInfo: [NSLocalizedDescriptionKey: "Authentication failed"])
        }
        
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let token = json?["access_token"] as? String else {
            throw NSError(domain: "AuthService", code: -1,
                         userInfo: [NSLocalizedDescriptionKey: "No token received"])
        }
        
        return token
    }
    
    func signOut() {
        UserDefaults.standard.removeItem(forKey: "user_session_token")
    }
}
```

---

## 🎨 UI Features

### LoginView Components

**1. Logo Section**
- Glass circle with flame icon
- Blue glow effect
- Gradient border (white 0.4 → 0.1 opacity)
- Large shadow for depth

**2. Text Fields**
- Email: `.keyboardType(.emailAddress)`
- Password: `SecureField` with lock icon
- Glass background (`.ultraThinMaterial`)
- White border (0.2 opacity)
- Icons with 60% opacity

**3. Sign In Button**
- Blue → Cyan gradient
- Disabled when fields empty
- Shows loading spinner
- White border (0.3 opacity)
- Blue glow shadow

**4. Error Banner**
- Red background (15% opacity)
- Red border (30% opacity)
- Auto-dismisses after 3 seconds
- Slide-in animation

**5. Loading Overlay**
- Full-screen dark overlay (40% opacity)
- Glass card with spinner
- "Signing in..." text

---

## 📱 Complete Flow Diagram

```
┌─────────────────────────────────────────┐
│  App Launch                             │
│  ├─ AppRootView                         │
│  ├─ Check UserDefaults for token        │
│  └─ Splash screen (1s)                  │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
    No Token            Token Exists
        │                    │
        ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│  LoginView      │  │  MainTabView    │
│  - Email field  │  │  - Home         │
│  - Password     │  │  - Analytics    │
│  - Sign In      │  │  - Profile      │
│  - Demo Mode    │  │                 │
└────────┬────────┘  └────────┬────────┘
         │                    │
    Sign In Success      Logout Tapped
         │                    │
         └────────────────────┘
              Clear Token
         Navigate to LoginView
```

---

## 🎉 Summary

You now have:
- ✅ **Premium native login screen** with glass design
- ✅ **Authentication state management** (AppRootView)
- ✅ **Splash screen** with brand logo
- ✅ **Dummy token authentication** for testing
- ✅ **Demo mode** for quick access
- ✅ **Error handling** with validation
- ✅ **Loading states** with overlays
- ✅ **Smooth animations** between states
- ✅ **Console logging** for debugging
- ✅ **Ready for real auth integration**

**Next Steps:**
1. Update entry point to use `AppRootView()`
2. Test login flow in simulator
3. Test logout from ProfileView
4. Connect to real Supabase auth (optional)

**Your iOS app now has complete authentication!** 🚀🔐

import SwiftUI

struct ProfileView: View {
    // 1. Watch AppStorage (for AppRootView)
    @AppStorage("user_session_token") private var userToken: String = ""
    @AppStorage("user_email") private var userEmail: String = ""
    
    // 2. Watch AuthManager (for RootView)
    @ObservedObject var authManager = AuthManager.shared
    
    var displayName: String {
        guard !userToken.isEmpty else { return "Guest" }
        return userEmail.components(separatedBy: "@").first?.capitalized ?? "User"
    }
    
    var emailDisplay: String {
        return userToken.isEmpty ? "Not logged in" : userEmail
    }
    
    var body: some View {
        NavigationView {
            ZStack {
                LinearGradient(colors: [Color(hex: "1e1b4b"), .black], startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
                
                VStack(spacing: 24) {
                    // Avatar
                    ZStack {
                        Circle().fill(.ultraThinMaterial).frame(width: 100, height: 100)
                        Image(systemName: "person.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.white)
                    }
                    .padding(.top, 40)
                    
                    // User Info
                    VStack(spacing: 8) {
                        Text(displayName)
                            .font(.title2.bold())
                            .foregroundColor(.white)
                        
                        Text(emailDisplay)
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    
                    Spacer()
                    
                    // Logout Button
                    Button(action: logout) {
                        Text("Log Out")
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red.opacity(0.8))
                            .cornerRadius(12)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
            }
            .navigationBarHidden(true)
        }
    }
    
    func logout() {
        print("🔴 Logout tapped.")
        
        // 1. Clear AppStorage (Immediate UI trigger)
        userToken = ""
        userEmail = ""
        
        // 2. Clear AuthManager (Logic trigger)
        authManager.logout()
        
        // 3. Clear Disk (Persistence)
        UserDefaults.standard.removeObject(forKey: "user_session_token")
        UserDefaults.standard.removeObject(forKey: "user_email")
        
        // 4. Force synchronization
        UserDefaults.standard.synchronize()
        
        print("🔴 All auth states cleared. Redirecting...")
    }
}

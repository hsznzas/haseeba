import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.haseeb.app",
  appName: "Haseeb",
  webDir: "dist",
  
  // Server configuration for development
  server: {
    // Uncomment for live reload during development
    // url: "http://YOUR_IP:3000",
    // cleartext: true,
    androidScheme: "https",
  },
  
  // iOS specific configuration
  ios: {
    contentInset: "automatic",
    backgroundColor: "#0a0d14",
    preferredContentMode: "mobile",
  },
  
  // Android specific configuration
  android: {
    backgroundColor: "#0a0d14",
    allowMixedContent: false,
  },
  
  // Plugins configuration
  plugins: {
    // Haptics plugin config
    Haptics: {
      // No additional config needed
    },
    
    // Status bar (add @capacitor/status-bar if needed)
    StatusBar: {
      style: "dark",
      backgroundColor: "#0a0d14",
    },
    
    // Keyboard (add @capacitor/keyboard if needed)
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
    
    // Splash screen (add @capacitor/splash-screen if needed)
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0d14",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;


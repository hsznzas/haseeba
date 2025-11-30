# Haseeb - حَسِيب

> Premium Islamic Habit Tracker - Build better habits with prayer tracking, Quran reading goals, and custom Islamic habit management.

![Haseeb Logo](./public/logo.png)

## ✨ Features

- 🕌 **Prayer Tracking** - Log all 5 daily prayers with on-time and congregation status
- 📖 **Quran Progress** - Track your reading with surah, ayah, and page logging
- ✨ **Custom Habits** - Create Islamic and personal habits with flexible tracking
- 📊 **Statistics & Streaks** - Visualize your progress with beautiful charts
- 🌙 **Beautiful Dark Mode** - Premium glassmorphism UI designed for the night owl
- 📱 **Mobile First** - Hybrid app that works on Web, iOS, and Android
- 🔒 **Privacy First** - Demo mode keeps all data local on your device

## 🛠 Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **Mobile:** Capacitor (iOS/Android builds)
- **UI:** shadcn/ui (Radix Primitives)
- **Styling:** Tailwind CSS + tailwindcss-animate
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **State:** React Context (DataContext pattern)
- **Backend:** Supabase (optional, for cloud sync)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) Xcode for iOS builds
- (Optional) Android Studio for Android builds

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/haseeb.git
cd haseeb

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup (Optional)

For cloud sync functionality, create a `.env` file:

```bash
cp .env.example .env
```

Then add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Mobile Development

### iOS

```bash
# Build and sync
npm run cap:build:ios

# Open in Xcode
npm run cap:open:ios
```

### Android

```bash
# Build and sync
npm run cap:build:android

# Open in Android Studio
npm run cap:open:android
```

## 🏗 Project Structure

```
haseeb/
├── src/
│   ├── components/
│   │   └── ui/          # shadcn/ui components
│   ├── context/
│   │   └── DataContext.tsx  # The "Traffic Controller"
│   ├── hooks/
│   │   └── useGestures.ts   # Gesture handling hooks
│   ├── lib/
│   │   └── utils.ts     # Utility functions
│   ├── pages/           # Page components
│   ├── services/
│   │   ├── api.ts       # Supabase operations
│   │   ├── storage.ts   # Local storage operations
│   │   ├── supabaseClient.ts
│   │   └── haptics.ts   # Native haptic feedback
│   ├── types/
│   │   └── index.ts     # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── capacitor.config.ts
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## 🎨 Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#0EA5E9` | Electric Sky Blue - CTAs, active states |
| Secondary | `#10B981` | Emerald - Success, completions |
| Gold | `#F59E0B` | Islamic accent, achievements |
| Background | `#0a0d14` | Deep slate dark mode |

### Typography

- **English:** Inter (300-800 weights)
- **Arabic:** Noto Naskh Arabic (400-700 weights)

### Glass Effect

```css
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

## 🔄 Data Flow (Traffic Controller Pattern)

```
┌─────────────────────────────────────────────────────────┐
│                     DataContext                         │
│                 (Traffic Controller)                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   user.isDemo === true?                                │
│          │                                              │
│          ├── YES ──→ storage.ts (localStorage)         │
│          │                                              │
│          └── NO ───→ api.ts (Supabase)                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Components never call `storage.ts` or `api.ts` directly. All data operations go through `DataContext`.

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run cap:sync` | Sync web assets to native projects |
| `npm run cap:open:ios` | Open iOS project in Xcode |
| `npm run cap:open:android` | Open Android project in Android Studio |

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🤲 Acknowledgments

- "Haseeb" (حَسِيب) is one of the names of Allah, meaning "The Reckoner" - He who takes account of all matters.
- Built with love for the Muslim community worldwide.

---

**بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ**

*In the name of Allah, the Most Gracious, the Most Merciful*


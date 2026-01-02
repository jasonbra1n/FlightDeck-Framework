# Scratchpad

This file is for temporary notes, plans, and brainstorming for the Denon DN-1000F Web Emulator.

---

## 📘 Blueprint
*   [Refactoring Architecture Analysis](../docs/index.md) - The plan for separating Core Audio from UI.

## � Current Focus
*   [x] **Initial Setup**: Verify local environment and Web Audio API functionality.
*   [x] **Gemini Workflow**: Establish the `.gemini` context (Done).
*   [x] **Project Docs**: Created `.github/` folder and `CHANGELOG.md`.
*   [ ] **Mobile Responsiveness**: Optimize touch targets for mobile DJing.
*   [x] **Restructure**: Move DN-1000F to `consoles/` and create shared `core/` directory.
*   [ ] **DJ Console Integration**: Added `consoles/dj-console/` (Dual Deck Prototype).
*   [x] **Cleanup**: Verify and remove `consoles/dj-console_early_version/` (Legacy).
*   [ ] **MixKitPro Reference**: Added `consoles/MixKitPro/` (Semi-working 2-deck console) for future reference.
*   [ ] **MixKit Reference**: Added `consoles/mixkit/` for evaluation.

## 📋 Backlog / Ideas
*   **Mobile Responsiveness**: Improve touch targets for mobile DJing.
*   **MIDI Support**: Investigate Web MIDI API to allow hardware controllers to drive the UI.
*   **Playlist Management**: Allow loading a folder of tracks rather than single files.
*   **Offline Capability**: Remove CDN dependencies (e.g., jsmediatags) and serve all assets locally.
*   **DJ Console Refactor**: Once `core/` is stable with DN-1000F, refactor `dj-console` to use the shared engine.
*   **Modular Audio Architecture**: Standardize the audio engine to support future emulators and custom consoles within a unified "DJ System".
*   **Branding**: FlightDeck Framework | Brain AV | AVDJ.ca | JasonBrain.com.

## 📦 CDN Dependencies (To Localize)
*   [ ] **jsmediatags**: `https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js`
*   [ ] **Material Icons**: `https://fonts.googleapis.com/icon?family=Material+Icons`
*   [ ] **Orbitron Font**: `https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap`
*   [ ] **Google Fonts**: `https://fonts.googleapis.com/css2?family=Google+Sans+Code:ital,wght@0,300..800;1,300..800&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap`


## 🏗️ Architecture Plan
```text
/
├── core/                  # SHARED LOGIC (The "DJ System")
│   ├── audio/             # AudioEngine.js (Standardized player)
│   ├── midi/              # MidiController.js (Mapping logic)
│   └── utils/             # Helpers (Time formatting, file loaders)
│
├── consoles/              # DIFFERENT PLAYERS
│   ├── dn-1000f/          # The current emulator (moved here)
│   │   ├── index.html
│   │   └── style.css
│   ├── dj-console/        # Dual Deck Prototype (Future integration target)
│   ├── MixKitPro/         # Semi-working 2-deck console (Reference)
│   ├── mixkit/            # MixKit Web (Reference)
│   └── minimal-player/    # A simple test player
│
├── assets/                # SHARED ASSETS
│   ├── fonts/             # LCD fonts, etc.
│   └── icons/             # Material icons (local)
│
└── index.html             # MAIN LAUNCHER (Select which console to load)
```

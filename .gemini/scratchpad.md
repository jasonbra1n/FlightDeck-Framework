# Scratchpad

This file is for temporary notes, plans, and brainstorming for the Denon DN-1000F Web Emulator.

---

## 🚀 Current Focus
*   [x] **Initial Setup**: Verify local environment and Web Audio API functionality.
*   [x] **Gemini Workflow**: Establish the `.gemini` context (Done).
*   [x] **Project Docs**: Created `.github/` folder and `CHANGELOG.md`.
*   [ ] **Mobile Responsiveness**: Optimize touch targets for mobile DJing.
*   [x] **Restructure**: Move DN-1000F to `consoles/` and create shared `core/` directory.

## 📋 Backlog / Ideas
*   **Mobile Responsiveness**: Improve touch targets for mobile DJing.
*   **MIDI Support**: Investigate Web MIDI API to allow hardware controllers to drive the UI.
*   **Playlist Management**: Allow loading a folder of tracks rather than single files.
*   **Offline Capability**: Remove CDN dependencies (e.g., jsmediatags) and serve all assets locally.
*   **Modular Audio Architecture**: Standardize the audio engine to support future emulators and custom consoles within a unified "DJ System".
*   **Branding**: "FlightDeck Framework" - AVDJ ACADEMY (Instrument panel concept).


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
│   ├── custom-deck-01/    # Your non-working layouts
│   └── minimal-player/    # A simple test player
│
├── assets/                # SHARED ASSETS
│   ├── fonts/             # LCD fonts, etc.
│   └── icons/             # Material icons (local)
│
└── index.html             # MAIN LAUNCHER (Select which console to load)
```

# Project Roadmap

This document outlines the development roadmap for the Denon DN-1000F Web Emulator.

## Short-Term (Core Functionality)
- [x] **Audio Engine**: Verify Web Audio API context and basic playback (Play/Pause).
- [x] **Pitch Control**: Implement real-time playback rate adjustment (-10% to +10%) using the pitch slider.
- [x] **Cue Logic**: Implement setting and recalling cue points.
- [x] **Display**: Implement the 7-segment display logic for Time Elapsed/Remaining.
- [ ] **Offline Capability**: Remove CDN dependencies (e.g., jsmediatags) and serve all assets locally.
- [x] **Project Restructuring**: Reorganize folder structure to support multiple consoles/emulators.
- [ ] **Core Extraction**: Refactor `AudioEngine` into a shared module usable by different consoles.
- [x] **DJ Console Prototype**: Integrate the dual-deck `dj-console` prototype into the repository structure.
- [ ] **MixKitPro Evaluation**: Analyze `consoles/MixKitPro` for reusable patterns (spectrum analyzer, mixer logic) to merge into `core/`.

## Medium-Term (UX & Features)
- [ ] **Mobile Responsiveness**: Optimize touch targets for buttons and sliders for mobile DJing.
- [ ] **Playlist Management**: Allow loading a folder of tracks or multiple files at once.
- [ ] **Visual Feedback**: accurate LED states for Play/Pause/Cue buttons.
- [ ] **Jog Wheel**: Implement pitch bend functionality via the jog wheel (if UI permits).

## Long-Term (Advanced)
- [ ] **MIDI Support**: Investigate Web MIDI API to allow hardware controllers to drive the UI.
- [ ] **Looping**: Add loop in/out functionality (modern feature addition to the classic hardware).
- [ ] **Console Standardization**: Refactor `dj-console` to use the shared `core/` AudioEngine and UI components.
- [ ] **Modular Audio Architecture**: Standardize the audio engine to support future emulators and custom consoles within a unified "DJ System" (supporting keyboard/MIDI mapping).

## Completed
- [x] **Project Setup**: Repository initialization and structure.
- [x] **AI Context**: Gemini persona and scratchpad setup.
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Infrastructure**: Added `.github` folder with `ROADMAP.md` and `CONTRIBUTING.md`.
- **AI Workflow**: Initialized `.gemini` directory with persona and prompt context.
- **Rebranding**: Project renamed to "FlightDeck Framework" (AVDJ ACADEMY).
- **Organization**: Integrated with Brain AV, AVDJ.ca, and JasonBrain.com ecosystem.
- **Architecture**: Restructured project into a modular framework (`core/`, `consoles/`, `assets/`).
- **Launcher**: Added main `index.html` launcher to select between different consoles.
- **Migration**: Moved DN-1000F emulator to `consoles/dn-1000f/`.
- **Prototypes**: Added `consoles/dj-console/` (Dual Deck Prototype).
- **References**: Added `consoles/MixKitPro/` for future feature extraction.
- **References**: Added `consoles/mixkit/` (MixKit Web) as an additional reference implementation.
- **Documentation**: Created `docs/index.md` detailing the architecture plan for Core Audio vs UI Controller.

### Changed
- **Refactor**: Extracted `dn-1000f` inline code into `style.css` and `app.js` for better maintainability.

### Removed
- **Cleanup**: Removed legacy `consoles/dj-console_early_version/`.

## [1.0.0] - 2025-11-11

### Added
- **Core**: Initial public release of the Denon DN-1000F Web Emulator.
- **Features**: Supports multiple audio formats (MP3, WAV, FLAC), cue point functionality, and pitch adjustment.
- **UI**: Album art display from ID3 tags.
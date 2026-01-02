# Contributing to Denon DN-1000F Web Emulator

## Tech Stack
- **Frontend**: HTML5, CSS3 (Custom UI mimicking hardware)
- **Logic**: Vanilla JavaScript (ES6+)
- **Audio Engine**: Web Audio API
- **Libraries**: `jsmediatags` (for parsing MP3 metadata)

## Development Workflow
1.  **Audio Graph**: Keep the Web Audio API logic modular. Avoid tight coupling with the UI where possible.
2.  **CSS Naming**: Use descriptive class names that reflect the physical hardware components (e.g., `.pitch-slider`, `.cue-button`, `.lcd-display`).
3.  **Commits**: Follow Conventional Commits (feat, fix, docs, style, refactor).

## Key Features to Preserve
This emulator aims for **authenticity**.
- **Pitch Behavior**: The pitch slider should react smoothly without audio artifacts.
- **Cue Behavior**: The "Cue" button behavior on Denon players is specific (press to hold/preview, release to stop/return).

## Directory Structure
- `index.html`: Main entry point.
- `css/`: Stylesheets.
- `js/`: Application logic.
- `.gemini/`: AI context files.
- `.github/`: Project documentation.
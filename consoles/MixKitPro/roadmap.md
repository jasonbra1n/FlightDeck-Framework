# Development Roadmap

This document outlines the planned features, improvements, and bug fixes for the MixKitPro Web DJ Player.

## Immediate Priorities (Q4 2025)

### 1. Core Functionality Improvements
-   **[x] Fine-Grained Tempo Control:**
    -   The tempo slider now allows for floating-point values (e.g., `0.01` increments).
    -   Options for three tempo ranges (+/- 8, 16, and 50%) have been implemented, with the default set to +/- 8%.

-   **[ ] Fix BPM Detection: (CURRENT FOCUS)**
    -   Investigate why `web-audio-beat-detector` is failing or providing inaccurate results.
    -   Check for console errors and debug the `detectBPM` function in `js/main.js`.
    -   If the library is unreliable, research and integrate a more robust alternative.

-   **[ ] Implement Audio Effects:**
    -   Correctly wire the Reverb, Delay, and Filter nodes into the Web Audio API graph for each deck.
    -   Ensure the effect control knobs properly modulate the corresponding audio parameters (e.g., wet/dry mix, delay time, filter cutoff frequency).
    -   Provide visual feedback when an effect is active.

### 2. UI/UX Enhancements
-   **[ ] Per-Deck Stereo VU Meters:**
    -   Replace the current single-value visualizer with a true 2-channel (stereo) vertical VU meter for each deck.
    -   This will require splitting the stereo signal using a `ChannelSplitterNode` and analyzing each channel independently.

-   **[ ] Enhanced Playlist:**
    -   Implement drag-and-drop functionality to reorder tracks in the playlist.
    -   Move the playlist into a collapsible and scrollable container to save screen space and avoid page scrolling.
    -   Add the ability to import an entire folder of songs into the playlist.

-   **[ ] Single-Page Layout:**
    -   Adjust the CSS to ensure the main application interface fits on a single screen without requiring vertical scrolling, especially on common desktop resolutions.

### 3. Quality of Life Features
-   **[ ] Persistent Settings:**
    -   Use `localStorage` to save user settings (e.g., master volume, crossfader curve, theme, effect settings).
    -   Load these settings automatically when the application starts, so the user's preferences are retained across sessions.

-   **[ ] Session Management Improvements:**
    -   Explore ways to re-link local audio files when importing a session file to provide a more seamless experience.

## Future Goals (2025 and beyond)

-   **[ ] Advanced Playlist Features:**
    -   "Automix" mode with configurable crossfade durations and strategies.
    -   Ability to save and load multiple playlists.

-   **[ ] Cue Points:**
    -   Add support for setting and triggering multiple cue points for each track.
    -   Visualize cue points on the waveform display.

-   **[ ] Recording:**
    -   Implement a feature to record the master output of the mix and save it as an audio file (e.g., `.wav` or `.mp3`).

-   **[ ] More Audio Effects:**
    -   Add a wider variety of effects, such as Flanger, Phaser, and a more advanced EQ.

-   **[ ] MIDI Controller Support:**
    -   Integrate the Web MIDI API to allow users to control the application with physical DJ controllers.

-   **[ ] Mobile Responsiveness:**
    -   Further refine the mobile layout to ensure a great user experience on tablets and smartphones.

## Ongoing Tasks
-   **[ ] Continuous Testing:**
    -   Rigorously test all features across different browsers (Chrome, Firefox, Safari) to ensure compatibility and performance.
    -   Gather user feedback to identify bugs and areas for improvement.

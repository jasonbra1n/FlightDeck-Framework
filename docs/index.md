# FlightDeck Framework Documentation

## 🏗️ Architecture Analysis: Core Audio vs. UI Controller

To support the modular "FlightDeck" vision, we are separating the codebase into two distinct layers: a shared **Core Audio Engine** and specific **UI Controllers** for each console (like the DN-1000F).

### 1. Core Audio (`core/audio/AudioEngine.js`)
This module handles pure audio signal processing and timekeeping. It has **no knowledge of the DOM** or specific UI elements.

*   **Responsibility**: Managing the Web Audio API graph, loading buffers, and precise playback scheduling.
*   **Properties to Extract**:
    *   `audioContext`, `gainNode` (The audio graph)
    *   `source` (BufferSourceNode)
    *   `buffer` (AudioBuffer)
    *   `startTime`, `pauseTime`, `startOffset` (Internal clock logic)
    *   `playbackRate` / `pitchValue`
*   **Methods to Extract**:
    *   `loadAudio(arrayBuffer)`: Decodes audio data.
    *   `play(offset, pitch)`: Starts the source node.
    *   `pause()`: Suspends context/stops source and saves time.
    *   `stop()`: Stops source and resets time.
    *   `setPitch(percent)`: Calculates and applies `playbackRate`.
    *   `getCurrentTime()`: Calculates precise audio time for the display.
    *   `getWaveformData()`: Returns channel data for the UI to visualize.

### 2. UI Controller (`consoles/dn-1000f/app.js`)
This module acts as the "skin" or interface. It handles user input, updates the visual display, and orchestrates the Audio Engine.

*   **Responsibility**: Handling DOM events, playlist management, and model-specific logic (like Cue button behavior).
*   **Properties to Keep**:
    *   `tracks` / `currentTrack` (Playlist management)
    *   `cuePoint` (Logic for Cue storage is often specific to the player model)
    *   `timeMode` (Elapsed vs. Remaining is a display preference)
    *   `animationId` (The visual render loop)
*   **Methods to Keep**:
    *   `setupEventListeners()`: Binding buttons and keys.
    *   `updateDisplay()`: Writing time/track info to the DOM.
    *   `drawWaveform()`: Using Canvas API to draw the data from the Engine.
    *   `handleCuePress/Release`: Determining *what* the engine should do based on button state (e.g., stutter vs. play).
    *   `startPitchBend/Search`: Timers that repeatedly call Engine methods.
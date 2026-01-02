# MixKitPro - Web DJ Player

MixKitPro is a feature-rich, lightweight, browser-only DJ toolkit. The application is self-contained, requiring no server or installation. It's built from scratch using pure HTML, CSS, and JavaScript, without any frameworks or build steps. All necessary assets are bundled to ensure full offline functionality.

## Features

*   **Dual Decks:** Two independent decks for mixing audio tracks.
*   **File Handling:** Load local audio files (`.mp3`, `.wav`, `.flac`, etc.) via a "Browse" button or drag-and-drop.
*   **Playback Controls:** Play/Pause, Stop, and Loop controls for each deck.
*   **Metadata Display:** Reads and displays ID3 tags (artist, title, album art) using `jsmediatags`.
*   **Mixing Controls:** Per-deck volume, master volume, and a crossfader.
*   **Tempo Control:** Manual tempo adjustment with a slider.
*   **BPM Detection:** Automatically detects the BPM of a track upon loading.
*   **Beat-Match Sync:** A "Sync" button to match the BPM of one deck to the other.
*   **Key Lock:** Pitch correction to allow tempo changes without affecting the musical key, powered by a Phase Vocoder.
*   **Interactive UI:**
    *   Track seeking with a progress bar and time tooltip.
    *   Waveform display for each deck.
    *   Stereo VU meter for each deck.
    *   Master spectrum analyzer.
*   **Audio Effects:** Reverb, Delay, and Filter effects for each deck.
*   **Playlist Management:** A dedicated playlist panel to queue tracks.
*   **Session Management:** Export and import session state (loaded tracks, cue points, mixer settings, playlist) to a JSON file. Settings are also saved in the browser.
*   **Themes:** Multiple themes to customize the look and feel of the application.

## How to Use

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jasonbra1n/MixKitPro.git
    ```
2.  **Open `index.html` in your browser:**
    -   Navigate to the project directory and open the `index.html` file in a modern web browser that supports the Web Audio API (like Chrome, Firefox, or Safari).

3.  **Load Tracks:**
    -   Click the "Browse Files" button on either deck to select an audio file from your computer.
    -   Alternatively, you can drag and drop an audio file onto the track info area of a deck.

4.  **Start Mixing:**
    -   Use the playback controls to play, pause, and loop your tracks.
    -   Adjust the volume of each deck and use the crossfader to mix between them.
    -   Use the tempo slider to adjust the speed of your tracks, and the "Sync" button to match their BPMs.
    -   Experiment with the audio effects to add creativity to your mix.

## Development Roadmap

For a detailed list of planned features and bug fixes, please see the `ROADMAP.md` file.

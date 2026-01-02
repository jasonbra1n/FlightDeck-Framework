# ✈️ FlightDeck Framework


[![MIT License](https://img.shields.io/github/license/jasonbra1n/Denon-DN-1000F-Web-Emulator)](LICENSE)
![GitHub repo size](https://img.shields.io/github/repo-size/jasonbra1n/Denon-DN-1000F-Web-Emulator)
![GitHub last commit](https://img.shields.io/github/last-commit/jasonbra1n/Denon-DN-1000F-Web-Emulator)


**FlightDeck Framework** (formerly DN-1000F Web Emulator) is a modular platform for building web-based DJ consoles and audio instrument panels. Developed by **AVDJ ACADEMY**.


## 📌 Overview

This project serves as the foundation for the **FlightDeck** ecosystem, treating DJ consoles like pilot instrument panels.

Currently featuring the **Denon DN-1000F** emulator:
- Load and play multiple audio files
- Navigate tracks (previous/next)
- Set cues and control playback precisely
- Adjust pitch using a real-time slider
- Display elapsed or remaining time
- Show album art from embedded ID3 tags

Perfect for **musicians, DJs, and audiophiles** who want to use the features of this legendary player in a modern web environment.

---

## 🚀 Features

- ✅ Realistic Denon DN-1000F UI with custom CSS
- 🎵 Web Audio API-based audio playback (supports MP3/WAV/FLAC)
- 📌 Cue point setting and jump functionality
- 🔁 Pitch adjustment from -10% to +10%
- 🔄 Time mode toggle: elapsed vs. remaining time
- 🖼️ Album art display using ID3 tags
- 🎧 Full keyboard support (Spacebar for play/pause, Arrow keys, etc.)

---

## 💻 How To Use

### 🔧 Requirements
- A modern browser that supports **Web Audio API** and **JavaScript Media Tags**

### ✅ Usage Instructions
1. Open `index.html` in your browser to view the **FlightDeck Launcher**.
2. Select a console (e.g., **Denon DN-1000F**).
3. Click "LOAD" to upload audio files (supports multiple formats).
4. Select a file, then click "PLAY/PAUSE" or press `Space` to start playing.
5. Use buttons or keyboard shortcuts to navigate through tracks and adjust settings.

---

## 📁 Folder Structure

```text
/
├── core/                  # SHARED LOGIC (The "DJ System")
│   ├── audio/             # AudioEngine.js (Standardized player)
│   ├── midi/              # MidiController.js (Mapping logic)
│   └── utils/             # Helpers (Time formatting, file loaders)
│
├── consoles/              # DIFFERENT PLAYERS
│   ├── dn-1000f/          # The current emulator
│   │   ├── index.html
│   │   └── style.css
│   └── ...                # Future consoles
│
├── assets/                # SHARED ASSETS
│   ├── fonts/             # LCD fonts, etc.
│   └── icons/             # Material icons (local)
│
└── index.html             # MAIN LAUNCHER (Select which console to load)
```

---

## ✅ Technologies Used

- **HTML5** / **CSS3**
- **JavaScript + Web Audio API**
- **Media Tags Library (jsmediatags)**
- **Responsive Design**


## 🗺️ Roadmap

Check out our [Project Roadmap](.github/ROADMAP.md) to see what's planned for future releases, including mobile responsiveness and MIDI support.

---

## 📌 Contributing

If you'd like to improve this project or add features, please read our [Contributing Guidelines](.github/CONTRIBUTING.md). We welcome all contributions!


## ❤️ License

This project is licensed under the [MIT License](LICENSE). Feel free to use it for personal or commercial purposes — just give credit where it's due!

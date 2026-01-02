# Professional DJ Console Web Application

A fully-featured, professional-grade DJ console web application built with vanilla JavaScript, HTML, and CSS. Features two independent CDJ-style media players with a professional DJ mixer, designed for both desktop and mobile devices.

## Features

### 🎵 Dual Deck System
- **Two Independent CDJ-Style Players** - Left and right decks with full DJ functionality
- **Professional Transport Controls** - Play/Pause, Cue, Track navigation
- **Hot Cue System** - 4 programmable cue points per deck (8 total)
- **Loop Controls** - Loop In/Out with automatic loop detection
- **Jog Wheel Interface** - Large touch-sensitive jog wheels for scratching and cueing
- **Real-time Waveform Display** - Scrolling waveforms with playhead and cue markers

### 🎛️ Professional Mixer
- **3-Band EQ per Channel** - High, Mid, Low with ±24dB adjustment
- **Channel Gain Controls** - Input level adjustment per deck
- **Channel Faders** - Independent volume control (0-100%)
- **Crossfader** - Smooth blending between decks with curve adjustment
- **Master Volume** - Overall output level control
- **PFL (Pre-Fader Listen)** - Individual channel monitoring
- **Real-time VU Meters** - LED-style level meters for all channels

### 🎚️ Advanced Audio Features
- **Web Audio API Implementation** - Professional-grade audio processing
- **Real-time EQ Processing** - BiquadFilterNode implementation
- **Pitch Control** - ±100% pitch adjustment with master tempo option
- **Sync Functionality** - Automatic BPM matching between decks
- **Vinyl Simulation** - Realistic jog wheel behavior and brake effects
- **Audio Format Support** - MP3, WAV, OGG, AAC

### 🎮 User Interface
- **Professional Design** - Dark theme with audio equipment aesthetic
- **Mobile Optimized** - Touch-friendly controls for tablets and phones
- **Responsive Layout** - Adaptive design for all screen sizes
- **Visual Feedback** - LED indicators, glowing buttons, smooth animations
- **Keyboard Shortcuts** - Full keyboard control for professional use

### ⌨️ Keyboard Controls

#### Deck 1 Controls
- `Spacebar` - Play/Pause
- `Q` - Cue
- `W/E` - Pitch bend up/down
- `A/S` - Previous/Next track
- `1-4` - Hot cues 1-4

#### Deck 2 Controls
- `Enter` - Play/Pause
- `P` - Cue
- `O/[` - Pitch bend up/down
- `K/L` - Previous/Next track
- `5-8` - Hot cues 5-8

#### Mixer Controls
- `←/→` - Crossfader left/right
- `↑/↓` - Master volume up/down

## Getting Started

### Prerequisites
- Modern web browser with Web Audio API support
- For mobile: iOS 12+ or Android 7+
- Audio files in supported formats (MP3, WAV, OGG, AAC)

### Installation
1. Download or clone the project files
2. Open `index.html` in a web browser
3. For mobile devices, tap "Initialize Audio" to enable audio playback

### Basic Usage

#### Loading Tracks
1. Click the **LOAD** button on either deck
2. Select an audio file from your device
3. Or drag and drop an audio file onto the waveform area

#### Basic Mixing
1. Load different tracks on each deck
2. Use the **Play** buttons to start playback
3. Adjust **Channel Faders** to set relative volumes
4. Use the **Crossfader** to blend between decks
5. Adjust **EQ controls** to balance frequencies

#### Advanced Techniques
- **Cue Points**: Set with CUE button, jump back with hot cues
- **Pitch Control**: Use pitch fader or bend buttons for tempo adjustment
- **Sync**: Enable SYNC to match BPM between decks
- **Jog Wheel**: Drag for scratching, touch to stop/start vinyl mode

## Technical Architecture

### Core Components
- **AudioEngine** - Web Audio API wrapper and audio processing
- **Deck** - Individual deck controller with playback and effects
- **DJConsole** - Main application controller and UI manager

### Audio Processing Chain
```
Deck Source → EQ (High/Mid/Low) → Channel Gain → Crossfader → Master → Output
```

### Key Technologies
- **Web Audio API** - Real-time audio processing and effects
- **Canvas API** - Waveform visualization and VU meters
- **File API** - Audio file loading and metadata extraction
- **CSS3** - Professional styling with animations
- **Vanilla JavaScript** - No frameworks, pure performance

### Browser Compatibility
- Chrome 66+ ✅
- Firefox 60+ ✅
- Safari 12+ ✅
- Edge 79+ ✅
- Mobile Safari 12+ ✅
- Chrome Mobile 66+ ✅

## Performance Optimization

### Audio Performance
- **Efficient Audio Graph** - Minimal processing latency
- **Real-time Analysis** - Optimized VU meter updates (60fps)
- **Memory Management** - Proper buffer cleanup and disposal
- **Mobile Optimization** - Touch event handling and gesture support

### Visual Performance
- **Hardware Acceleration** - CSS transforms and animations
- **RequestAnimationFrame** - Smooth 60fps updates
- **Optimized Rendering** - Efficient canvas operations
- **Responsive Images** - Adaptive quality based on device

## Customization

### Styling
The application uses CSS custom properties for easy theming:
```css
:root {
  --active-cyan: #00E0FF;
  --warning-cue: #FFA500;
  --panel-surface: #141414;
  /* Modify these to change the color scheme */
}
```

### Audio Settings
Key audio parameters can be adjusted in the AudioEngine:
- Sample rate and buffer size
- EQ frequency points and Q values
- VU meter sensitivity and smoothing
- Crossfader curves and response

### UI Layout
The responsive grid system allows for easy layout modification:
```css
.dj-console {
  grid-template-columns: 1fr auto 1fr; /* Modify column sizes */
}
```

## Troubleshooting

### Audio Issues
- **No Sound**: Ensure browser audio permissions are granted
- **Latency**: Use a device with low audio output latency
- **Mobile Audio**: Tap "Initialize Audio" button to enable playback

### Performance Issues
- **Slow Waveform**: Reduce audio file size or quality
- **Frame Drops**: Close other browser tabs or applications
- **Mobile Lag**: Ensure device has sufficient processing power

### File Loading
- **Unsupported Format**: Convert audio to MP3, WAV, or OGG
- **Large Files**: Be patient with waveform generation
- **Permission Errors**: Ensure file access permissions

## Development

### Project Structure
```
dj-console/
├── index.html          # Main application structure
├── styles.css          # Professional styling and responsive design
├── audio-engine.js     # Web Audio API implementation
├── dj-console.js       # Main application controller
└── README.md           # This documentation
```

### Key Classes
- **AudioEngine** - Manages audio context and processing
- **Deck** - Controls individual deck functionality
- **DJConsole** - Handles UI interactions and state management

### Extending Features
The modular architecture makes it easy to add:
- Additional audio effects
- New visualization modes
- Extended file format support
- MIDI controller integration
- Recording functionality

## License

This project is open source and available under the MIT License.

## Credits

Developed with modern web technologies to bring professional DJ software capabilities to the web browser. Designed for both professional use and educational purposes.

---

**Note**: This application is designed for demonstration and educational purposes. For professional DJ use, consider dedicated DJ software with hardware integration and advanced features.
/**
 * Professional DJ Console Application
 * Main application logic and UI controller
 */

class DJConsole {
    constructor() {
        this.audioEngine = null;
        this.isInitialized = false;
        this.animationFrame = null;
        this.isDragging = {
            jogWheel: { 1: false, 2: false },
            sliders: new Set()
        };
        
        // Deck instances
        this.deck1 = null;
        this.deck2 = null;
        
        // UI references
        this.ui = {};
        
        // Animation and timing
        this.lastUpdate = 0;
        this.updateInterval = 16; // ~60fps
        
        this.init();
    }

    async init() {
        try {
            // Initialize audio engine
            this.audioEngine = new AudioEngine();
            await this.audioEngine.init();
            
            // Set up UI references
            this.setupUIRefs();
            
            // Check if audio context needs user interaction to start (mobile)
            if (this.audioEngine.audioContext.state === 'suspended') {
                this.ui.system.audioInit.classList.remove('hidden');
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up deck instances
            this.deck1 = this.audioEngine.deck1;
            this.deck2 = this.audioEngine.deck2;
            
            // Start animation loop
            this.startAnimationLoop();
            
            this.isInitialized = true;
            
            // Hide loading overlay
            setTimeout(() => {
                this.hideLoadingOverlay();
            }, 1000);
            
        } catch (error) {
            console.error('Failed to initialize DJ Console:', error);
            this.showError('Failed to initialize audio engine. Please check your browser compatibility.');
        }
    }

    setupUIRefs() {
        // Deck 1 elements
        this.ui.deck1 = {
            fileInput: document.getElementById('file-input-1'),
            loadBtn: document.getElementById('load-btn-1'),
            ejectBtn: document.getElementById('eject-btn-1'),
            trackTitle: document.getElementById('track-title-1'),
            trackArtist: document.getElementById('track-artist-1'),
            bpm: document.getElementById('bpm-1'),
            pitch: document.getElementById('pitch-1'),
            time: document.getElementById('time-1'),
            pitchReadout: document.getElementById('pitch-readout-1'),
            waveform: document.getElementById('waveform-1'),
            playhead: document.getElementById('playhead-1'),
            cueMarkers: document.getElementById('cue-markers-1'),
            jogWheel: document.getElementById('jog-wheel-1'),
            jogCenter: document.getElementById('jog-center-1'),
            albumArt: document.getElementById('album-art-1'),
            playBtn: document.getElementById('play-btn-1'),
            cueBtn: document.getElementById('cue-btn-1'),
            prevBtn: document.getElementById('prev-btn-1'),
            nextBtn: document.getElementById('next-btn-1'),
            pitchFader: document.getElementById('pitch-fader-1'),
            pitchDown: document.getElementById('pitch-down-1'),
            pitchUp: document.getElementById('pitch-up-1'),
            syncBtn: document.getElementById('sync-btn-1'),
            masterTempo: document.getElementById('master-tempo-1'),
            pitchReset: document.getElementById('pitch-reset-1'),
            hotCues: [
                document.getElementById('cue-1-1'),
                document.getElementById('cue-2-1'),
                document.getElementById('cue-3-1'),
                document.getElementById('cue-4-1')
            ]
        };
        
        // Deck 2 elements
        this.ui.deck2 = {
            fileInput: document.getElementById('file-input-2'),
            loadBtn: document.getElementById('load-btn-2'),
            ejectBtn: document.getElementById('eject-btn-2'),
            trackTitle: document.getElementById('track-title-2'),
            trackArtist: document.getElementById('track-artist-2'),
            bpm: document.getElementById('bpm-2'),
            pitch: document.getElementById('pitch-2'),
            time: document.getElementById('time-2'),
            pitchReadout: document.getElementById('pitch-readout-2'),
            waveform: document.getElementById('waveform-2'),
            playhead: document.getElementById('playhead-2'),
            cueMarkers: document.getElementById('cue-markers-2'),
            jogWheel: document.getElementById('jog-wheel-2'),
            jogCenter: document.getElementById('jog-center-2'),
            albumArt: document.getElementById('album-art-2'),
            playBtn: document.getElementById('play-btn-2'),
            cueBtn: document.getElementById('cue-btn-2'),
            prevBtn: document.getElementById('prev-btn-2'),
            nextBtn: document.getElementById('next-btn-2'),
            pitchFader: document.getElementById('pitch-fader-2'),
            pitchDown: document.getElementById('pitch-down-2'),
            pitchUp: document.getElementById('pitch-up-2'),
            syncBtn: document.getElementById('sync-btn-2'),
            masterTempo: document.getElementById('master-tempo-2'),
            pitchReset: document.getElementById('pitch-reset-2'),
            hotCues: [
                document.getElementById('cue-1-2'),
                document.getElementById('cue-2-2'),
                document.getElementById('cue-3-2'),
                document.getElementById('cue-4-2')
            ]
        };
        
        // Mixer elements
        this.ui.mixer = {
            gain1: document.getElementById('gain-1'),
            gain2: document.getElementById('gain-2'),
            eqHigh1: document.getElementById('eq-high-1'),
            eqHigh2: document.getElementById('eq-high-2'),
            eqMid1: document.getElementById('eq-mid-1'),
            eqMid2: document.getElementById('eq-mid-2'),
            eqLow1: document.getElementById('eq-low-1'),
            eqLow2: document.getElementById('eq-low-2'),
            channelFader1: document.getElementById('channel-fader-1'),
            channelFader2: document.getElementById('channel-fader-2'),
            faderHandle1: document.getElementById('fader-handle-1'),
            faderHandle2: document.getElementById('fader-handle-2'),
            pflBtn1: document.getElementById('pfl-btn-1'),
            pflBtn2: document.getElementById('pfl-btn-2'),
            vuMeter1: document.getElementById('vu-meter-1'),
            vuMeter2: document.getElementById('vu-meter-2'),
            crossfader: document.getElementById('crossfader'),
            crossfaderHandle: document.getElementById('crossfader-handle'),
            masterFader: document.getElementById('master-fader'),
            masterHandle: document.getElementById('master-handle'),
            masterVu: document.getElementById('master-vu')
        };
        
        // System elements
        this.ui.system = {
            loadingOverlay: document.getElementById('loading-overlay'),
            audioInit: document.getElementById('audio-init'),
            initAudioBtn: document.getElementById('init-audio-btn')
        };
    }

    setupEventListeners() {
        // Audio initialization for mobile
        this.ui.system.initAudioBtn.addEventListener('click', async () => {
            try {
                await this.audioEngine.resumeContext();
                this.ui.system.audioInit.classList.add('hidden');
                
                // Re-initialize if needed
                if (!this.audioEngine.isReady()) {
                    await this.audioEngine.init();
                }
            } catch (error) {
                console.error('Failed to initialize audio:', error);
                this.showError('Failed to enable audio. Please try refreshing the page.');
            }
        });
        
        // File loading
        this.setupFileLoading();
        
        // Transport controls
        this.setupTransportControls();
        
        // Pitch controls
        this.setupPitchControls();
        
        // Hot cues
        this.setupHotCues();
        
        // Mixer controls
        this.setupMixerControls();
        
        // Jog wheels
        this.setupJogWheels();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    setupFileLoading() {
        // Load buttons
        this.ui.deck1.loadBtn.addEventListener('click', () => this.ui.deck1.fileInput.click());
        this.ui.deck2.loadBtn.addEventListener('click', () => this.ui.deck2.fileInput.click());
        
        // File inputs
        this.ui.deck1.fileInput.addEventListener('change', (e) => this.loadFile(1, e.target.files[0]));
        this.ui.deck2.fileInput.addEventListener('change', (e) => this.loadFile(2, e.target.files[0]));
        
        // Drag and drop
        this.ui.deck1.waveform.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.ui.deck1.waveform.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                this.loadFile(1, file);
            }
        });
        
        this.ui.deck2.waveform.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.ui.deck2.waveform.addEventListener('drop', (e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('audio/')) {
                this.loadFile(2, file);
            }
        });
    }

    async loadFile(deckId, file) {
        if (!file || !file.type.startsWith('audio/')) {
            this.showError('Please select a valid audio file');
            return;
        }
        
        try {
            this.showLoading(`Loading ${file.name}...`);
            
            // Load audio through audio engine
            const result = await this.audioEngine.loadAudioFile(deckId, file);
            
            // Update UI
            this.updateDeckUI(deckId, result);
            
            // Load buffer into deck
            const deck = deckId === 1 ? this.deck1 : this.deck2;
            await deck.loadBuffer(result.buffer);
            
            this.hideLoading();
            
        } catch (error) {
            console.error(`Failed to load file for deck ${deckId}:`, error);
            this.showError('Failed to load audio file');
            this.hideLoading();
        }
    }

    updateDeckUI(deckId, result) {
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        const analysis = result.analysis;
        const metadata = result.metadata;
        
        // Update track info
        ui.trackTitle.textContent = metadata.name.replace(/\.[^/.]+$/, '');
        ui.trackArtist.textContent = 'Audio Track';
        
        // Update BPM
        ui.bpm.textContent = analysis.bpm > 0 ? analysis.bpm : '--';
        
        // Update time display
        ui.time.textContent = this.formatTime(analysis.duration);
        
        // Draw waveform
        this.drawWaveform(deckId, result.waveform);
        
        // Set up album art placeholder
        ui.albumArt.textContent = '♪';
        ui.albumArt.style.backgroundImage = 'none';
    }

    drawWaveform(deckId, waveformData) {
        const canvas = deckId === 1 ? this.ui.deck1.waveform : this.ui.deck2.waveform;
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        const width = rect.width;
        const height = rect.height;
        
        // Clear canvas
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        
        // Draw waveform
        if (waveformData && waveformData.length > 0) {
            const barWidth = width / waveformData.length;
            
            for (let i = 0; i < waveformData.length; i++) {
                const data = waveformData[i];
                const x = i * barWidth;
                const barHeight = data.max * height * 0.8;
                const y = (height - barHeight) / 2;
                
                // Draw bar
                ctx.fillStyle = data.max > 0.5 ? '#3a3a3c' : '#2a2a2a';
                ctx.fillRect(x, y, barWidth - 1, barHeight);
            }
        }
    }

    setupTransportControls() {
        // Play buttons
        this.ui.deck1.playBtn.addEventListener('click', () => this.togglePlay(1));
        this.ui.deck2.playBtn.addEventListener('click', () => this.togglePlay(2));
        
        // Cue buttons
        this.ui.deck1.cueBtn.addEventListener('click', () => this.handleCue(1));
        this.ui.deck2.cueBtn.addEventListener('click', () => this.handleCue(2));
        
        // Eject buttons
        this.ui.deck1.ejectBtn.addEventListener('click', () => this.ejectTrack(1));
        this.ui.deck2.ejectBtn.addEventListener('click', () => this.ejectTrack(2));
        
        // Track navigation
        this.ui.deck1.prevBtn.addEventListener('click', () => this.previousTrack(1));
        this.ui.deck1.nextBtn.addEventListener('click', () => this.nextTrack(1));
        this.ui.deck2.prevBtn.addEventListener('click', () => this.previousTrack(2));
        this.ui.deck2.nextBtn.addEventListener('click', () => this.nextTrack(2));
    }

    togglePlay(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        
        if (!deck.source || !deck.source.buffer) {
            return;
        }
        
        if (deck.isPlaying) {
            deck.pause();
            ui.playBtn.classList.remove('active');
            ui.playBtn.innerHTML = '<span>▶</span>';
        } else {
            const success = deck.play();
            if (success) {
                ui.playBtn.classList.add('active');
                ui.playBtn.innerHTML = '<span>⏸</span>';
            }
        }
    }

    handleCue(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        const currentTime = deck.getCurrentTime();
        
        if (!deck.cuePoint) {
            // Set cue point
            deck.setCuePoint(currentTime);
        } else {
            // Go to cue point
            deck.goToCue();
        }
    }

    ejectTrack(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        
        deck.reset();
        
        // Reset UI
        ui.playBtn.classList.remove('active');
        ui.playBtn.innerHTML = '<span>▶</span>';
        ui.trackTitle.textContent = 'No Track Loaded';
        ui.trackArtist.textContent = 'Load audio file to begin';
        ui.bpm.textContent = '--';
        ui.time.textContent = '00:00';
        ui.pitchReadout.textContent = '0.0%';
        
        // Clear waveform
        this.clearWaveform(deckId);
    }

    previousTrack(deckId) {
        // Placeholder for playlist navigation
        console.log(`Previous track for deck ${deckId}`);
    }

    nextTrack(deckId) {
        // Placeholder for playlist navigation
        console.log(`Next track for deck ${deckId}`);
    }

    clearWaveform(deckId) {
        const canvas = deckId === 1 ? this.ui.deck1.waveform : this.ui.deck2.waveform;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, rect.width, rect.height);
    }

    setupPitchControls() {
        // Pitch faders
        this.ui.deck1.pitchFader.addEventListener('input', (e) => this.setPitch(1, parseFloat(e.target.value)));
        this.ui.deck2.pitchFader.addEventListener('input', (e) => this.setPitch(2, parseFloat(e.target.value)));
        
        // Pitch bend buttons
        this.ui.deck1.pitchDown.addEventListener('mousedown', () => this.startPitchBend(1, 'down'));
        this.ui.deck1.pitchUp.addEventListener('mousedown', () => this.startPitchBend(1, 'up'));
        this.ui.deck2.pitchDown.addEventListener('mousedown', () => this.startPitchBend(2, 'down'));
        this.ui.deck2.pitchUp.addEventListener('mousedown', () => this.startPitchBend(2, 'up'));
        
        // Pitch reset buttons
        this.ui.deck1.pitchReset.addEventListener('click', () => this.resetPitch(1));
        this.ui.deck2.pitchReset.addEventListener('click', () => this.resetPitch(2));
        
        // Sync buttons
        this.ui.deck1.syncBtn.addEventListener('click', () => this.toggleSync(1));
        this.ui.deck2.syncBtn.addEventListener('click', () => this.toggleSync(2));
        
        // Master tempo buttons
        this.ui.deck1.masterTempo.addEventListener('click', () => this.toggleMasterTempo(1));
        this.ui.deck2.masterTempo.addEventListener('click', () => this.toggleMasterTempo(2));
    }

    setPitch(deckId, pitch) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        deck.setPitch(pitch);
        
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        ui.pitchReadout.textContent = `${(pitch * 100).toFixed(1)}%`;
        ui.pitch.textContent = `${(pitch * 100).toFixed(1)}%`;
    }

    startPitchBend(deckId, direction) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        
        const bend = () => {
            deck.pitchBend(direction);
            this.updatePitchDisplay(deckId);
        };
        
        bend(); // Immediate response
        
        const interval = setInterval(bend, 100);
        
        const stop = () => {
            clearInterval(interval);
            document.removeEventListener('mouseup', stop);
            document.removeEventListener('touchend', stop);
        };
        
        document.addEventListener('mouseup', stop);
        document.addEventListener('touchend', stop);
    }

    resetPitch(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        deck.resetPitch();
        
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        ui.pitchFader.value = 0;
        this.updatePitchDisplay(deckId);
    }

    toggleSync(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        deck.setSync(!deck.syncEnabled);
        
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        ui.syncBtn.classList.toggle('active', deck.syncEnabled);
    }

    toggleMasterTempo(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        deck.setMasterTempo(!deck.masterTempo);
        
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        ui.masterTempo.classList.toggle('active', deck.masterTempo);
    }

    updatePitchDisplay(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        
        const pitch = deck.pitch * 100;
        ui.pitchReadout.textContent = `${pitch.toFixed(1)}%`;
        ui.pitch.textContent = `${pitch.toFixed(1)}%`;
    }

    setupHotCues() {
        // Deck 1 hot cues
        for (let i = 0; i < 4; i++) {
            this.ui.deck1.hotCues[i].addEventListener('click', () => this.handleHotCue(1, i));
        }
        
        // Deck 2 hot cues
        for (let i = 0; i < 4; i++) {
            this.ui.deck2.hotCues[i].addEventListener('click', () => this.handleHotCue(2, i));
        }
    }

    handleHotCue(deckId, index) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        const currentTime = deck.getCurrentTime();
        
        if (deck.hotCues[index] === null) {
            // Set hot cue
            deck.setHotCue(index, currentTime);
            ui.hotCues[index].classList.add('active');
        } else {
            // Trigger hot cue
            deck.triggerHotCue(index);
            ui.hotCues[index].classList.add('active');
            
            // Flash effect
            setTimeout(() => {
                ui.hotCues[index].classList.remove('active');
            }, 200);
        }
    }

    setupMixerControls() {
        // Channel gain controls
        this.ui.mixer.gain1.addEventListener('input', (e) => this.setChannelGain(1, parseFloat(e.target.value)));
        this.ui.mixer.gain2.addEventListener('input', (e) => this.setChannelGain(2, parseFloat(e.target.value)));
        
        // EQ controls
        this.setupEQControls();
        
        // Channel faders
        this.ui.mixer.channelFader1.addEventListener('input', (e) => this.setChannelFader(1, parseFloat(e.target.value)));
        this.ui.mixer.channelFader2.addEventListener('input', (e) => this.setChannelFader(2, parseFloat(e.target.value)));
        
        // PFL buttons
        this.ui.mixer.pflBtn1.addEventListener('click', () => this.togglePFL(1));
        this.ui.mixer.pflBtn2.addEventListener('click', () => this.togglePFL(2));
        
        // Crossfader
        this.ui.mixer.crossfader.addEventListener('input', (e) => this.setCrossfader(parseFloat(e.target.value)));
        
        // Master fader
        this.ui.mixer.masterFader.addEventListener('input', (e) => this.setMasterVolume(parseFloat(e.target.value)));
    }

    setupEQControls() {
        // High EQ
        this.ui.mixer.eqHigh1.addEventListener('input', (e) => this.setEQ(1, 'high', parseFloat(e.target.value)));
        this.ui.mixer.eqHigh2.addEventListener('input', (e) => this.setEQ(2, 'high', parseFloat(e.target.value)));
        
        // Mid EQ
        this.ui.mixer.eqMid1.addEventListener('input', (e) => this.setEQ(1, 'mid', parseFloat(e.target.value)));
        this.ui.mixer.eqMid2.addEventListener('input', (e) => this.setEQ(2, 'mid', parseFloat(e.target.value)));
        
        // Low EQ
        this.ui.mixer.eqLow1.addEventListener('input', (e) => this.setEQ(1, 'low', parseFloat(e.target.value)));
        this.ui.mixer.eqLow2.addEventListener('input', (e) => this.setEQ(2, 'low', parseFloat(e.target.value)));
    }

    setChannelGain(deckId, gain) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        deck.setGain(gain);
    }

    setEQ(deckId, frequency, gain) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        deck.setEQ(frequency, gain);
    }

    setChannelFader(deckId, value) {
        // This would typically control a channel fader in the audio graph
        // For now, we'll just update the visual fader handle
        const handle = deckId === 1 ? this.ui.mixer.faderHandle1 : this.ui.mixer.faderHandle2;
        const track = deckId === 1 ? this.ui.mixer.channelFader1 : this.ui.mixer.channelFader2;
        
        const rect = track.getBoundingClientRect();
        const percentage = (1 - value); // Invert because fader goes from bottom to top
        const y = percentage * (rect.height - 24); // 24px is handle height
        
        handle.style.top = `${rect.height - y - 12}px`; // Center the handle
    }

    togglePFL(deckId) {
        const button = deckId === 1 ? this.ui.mixer.pflBtn1 : this.ui.mixer.pflBtn2;
        button.classList.toggle('active');
        
        // In a real implementation, this would route audio to headphone output
        console.log(`PFL ${button.classList.contains('active') ? 'enabled' : 'disabled'} for deck ${deckId}`);
    }

    setCrossfader(value) {
        this.audioEngine.setCrossfaderPosition(value);
        
        // Update crossfader handle position
        const track = this.ui.mixer.crossfader.getBoundingClientRect();
        const x = value * (track.width - 24); // 24px is handle width
        this.ui.mixer.crossfaderHandle.style.left = `${x}px`;
    }

    setMasterVolume(value) {
        this.audioEngine.setMasterVolume(value);
        
        // Update master fader handle position
        const track = this.ui.mixer.masterFader.getBoundingClientRect();
        const percentage = (1 - value); // Invert because fader goes from bottom to top
        const y = percentage * (track.height - 24); // 24px is handle height
        
        this.ui.mixer.masterHandle.style.top = `${track.height - y - 12}px`;
    }

    setupJogWheels() {
        this.setupJogWheel(1);
        this.setupJogWheel(2);
    }

    setupJogWheel(deckId) {
        const jogWheel = deckId === 1 ? this.ui.deck1.jogWheel : this.ui.deck2.jogWheel;
        
        let isDragging = false;
        let lastAngle = 0;
        
        const getAngle = (e) => {
            const rect = jogWheel.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            return Math.atan2(clientY - centerY, clientX - centerX);
        };
        
        const onStart = (e) => {
            e.preventDefault();
            isDragging = true;
            lastAngle = getAngle(e);
            this.isDragging.jogWheel[deckId] = true;
        };
        
        const onMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const currentAngle = getAngle(e);
            const deltaAngle = currentAngle - lastAngle;
            
            // Rotate jog wheel visually
            const center = deckId === 1 ? this.ui.deck1.jogCenter : this.ui.deck2.jogCenter;
            const currentRotation = center.dataset.rotation ? parseFloat(center.dataset.rotation) : 0;
            const newRotation = currentRotation + (deltaAngle * 180 / Math.PI);
            
            center.style.transform = `translate(-50%, -50%) rotate(${newRotation}deg)`;
            center.dataset.rotation = newRotation;
            
            lastAngle = currentAngle;
        };
        
        const onEnd = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            isDragging = false;
            this.isDragging.jogWheel[deckId] = false;
        };
        
        // Mouse events
        jogWheel.addEventListener('mousedown', onStart);
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onEnd);
        
        // Touch events
        jogWheel.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;
            
            switch (e.code) {
                // Deck 1 controls
                case 'Space':
                    e.preventDefault();
                    this.togglePlay(1);
                    break;
                case 'KeyQ':
                    this.handleCue(1);
                    break;
                case 'KeyW':
                    this.startPitchBend(1, 'up');
                    break;
                case 'KeyE':
                    this.startPitchBend(1, 'down');
                    break;
                case 'KeyA':
                    this.previousTrack(1);
                    break;
                case 'KeyS':
                    this.nextTrack(1);
                    break;
                case 'Digit1':
                    this.handleHotCue(1, 0);
                    break;
                case 'Digit2':
                    this.handleHotCue(1, 1);
                    break;
                case 'Digit3':
                    this.handleHotCue(1, 2);
                    break;
                case 'Digit4':
                    this.handleHotCue(1, 3);
                    break;
                
                // Deck 2 controls
                case 'Enter':
                    e.preventDefault();
                    this.togglePlay(2);
                    break;
                case 'KeyP':
                    this.handleCue(2);
                    break;
                case 'BracketLeft':
                    this.startPitchBend(2, 'up');
                    break;
                case 'KeyO':
                    this.startPitchBend(2, 'down');
                    break;
                case 'KeyK':
                    this.previousTrack(2);
                    break;
                case 'KeyL':
                    this.nextTrack(2);
                    break;
                case 'Digit5':
                    this.handleHotCue(2, 0);
                    break;
                case 'Digit6':
                    this.handleHotCue(2, 1);
                    break;
                case 'Digit7':
                    this.handleHotCue(2, 2);
                    break;
                case 'Digit8':
                    this.handleHotCue(2, 3);
                    break;
                
                // Mixer controls
                case 'ArrowLeft':
                    e.preventDefault();
                    const currentCrossfader = parseFloat(this.ui.mixer.crossfader.value);
                    this.setCrossfader(Math.max(0, currentCrossfader - 0.05));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    const currentCrossfaderRight = parseFloat(this.ui.mixer.crossfader.value);
                    this.setCrossfader(Math.min(1, currentCrossfaderRight + 0.05));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const currentMaster = parseFloat(this.ui.mixer.masterFader.value);
                    this.setMasterVolume(Math.min(1, currentMaster + 0.05));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    const currentMasterDown = parseFloat(this.ui.mixer.masterFader.value);
                    this.setMasterVolume(Math.max(0, currentMasterDown - 0.05));
                    break;
            }
        });
    }

    startAnimationLoop() {
        const update = (timestamp) => {
            if (timestamp - this.lastUpdate >= this.updateInterval) {
                this.updateUI();
                this.lastUpdate = timestamp;
            }
            
            this.animationFrame = requestAnimationFrame(update);
        };
        
        this.animationFrame = requestAnimationFrame(update);
    }

    updateUI() {
        // Update deck displays
        this.updateDeckDisplays(1);
        this.updateDeckDisplays(2);
        
        // Update VU meters
        this.updateVUMeters();
        
        // Update playheads
        this.updatePlayheads();
    }

    updateDeckDisplays(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        const ui = deckId === 1 ? this.ui.deck1 : this.ui.deck2;
        
        if (!deck.source || !deck.source.buffer) return;
        
        // Update time display
        const currentTime = deck.getCurrentTime();
        const duration = deck.getDuration();
        ui.time.textContent = this.formatTime(currentTime) + ' / ' + this.formatTime(duration);
        
        // Update pitch display if not already updated by controls
        if (document.activeElement !== ui.pitchFader) {
            const pitch = deck.pitch * 100;
            ui.pitchReadout.textContent = `${pitch.toFixed(1)}%`;
            ui.pitch.textContent = `${pitch.toFixed(1)}%`;
        }
    }

    updateVUMeters() {
        // Update channel VU meters
        const level1 = this.audioEngine.getChannelLevel(1);
        const level2 = this.audioEngine.getChannelLevel(2);
        
        this.updateVUMeter(this.ui.mixer.vuMeter1, level1);
        this.updateVUMeter(this.ui.mixer.vuMeter2, level2);
        
        // Update master VU meter
        const masterLevel = this.audioEngine.getMasterLevel();
        this.updateStereoVUMeter(this.ui.mixer.masterVu, masterLevel, masterLevel);
    }

    updateVUMeter(container, level) {
        const bars = container.querySelectorAll('.vu-bar');
        const activeBars = Math.floor(level * bars.length);
        
        bars.forEach((bar, index) => {
            bar.classList.remove('active', 'high', 'critical');
            if (index < activeBars) {
                bar.classList.add('active');
                if (index > bars.length * 0.8) {
                    bar.classList.add('critical');
                } else if (index > bars.length * 0.6) {
                    bar.classList.add('high');
                }
            }
        });
    }

    updateStereoVUMeter(container, leftLevel, rightLevel) {
        const leftBars = container.querySelector('.left').querySelectorAll('.vu-bar');
        const rightBars = container.querySelector('.right').querySelectorAll('.vu-bar');
        
        const leftActive = Math.floor(leftLevel * leftBars.length);
        const rightActive = Math.floor(rightLevel * rightBars.length);
        
        leftBars.forEach((bar, index) => {
            bar.classList.remove('active', 'high', 'critical');
            if (index < leftActive) {
                bar.classList.add('active');
                if (index > leftBars.length * 0.8) {
                    bar.classList.add('critical');
                } else if (index > leftBars.length * 0.6) {
                    bar.classList.add('high');
                }
            }
        });
        
        rightBars.forEach((bar, index) => {
            bar.classList.remove('active', 'high', 'critical');
            if (index < rightActive) {
                bar.classList.add('active');
                if (index > rightBars.length * 0.8) {
                    bar.classList.add('critical');
                } else if (index > rightBars.length * 0.6) {
                    bar.classList.add('high');
                }
            }
        });
    }

    updatePlayheads() {
        // Update playhead positions on waveforms
        this.updatePlayhead(1);
        this.updatePlayhead(2);
    }

    updatePlayhead(deckId) {
        const deck = deckId === 1 ? this.deck1 : this.deck2;
        const playhead = deckId === 1 ? this.ui.deck1.playhead : this.ui.deck2.playhead;
        const waveform = deckId === 1 ? this.ui.deck1.waveform : this.ui.deck2.waveform;
        
        if (!deck.source || !deck.source.buffer) {
            playhead.style.left = '0px';
            return;
        }
        
        const progress = deck.getProgress();
        const width = waveform.getBoundingClientRect().width;
        const position = progress * width;
        
        playhead.style.left = `${position}px`;
    }

    formatTime(seconds) {
        if (!isFinite(seconds)) return '00:00';
        
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    handleResize() {
        // Redraw waveforms on resize
        setTimeout(() => {
            this.redrawWaveforms();
        }, 100);
    }

    redrawWaveforms() {
        // Redraw waveforms for both decks
        const waveform1 = this.audioEngine.getWaveformData(1);
        const waveform2 = this.audioEngine.getWaveformData(2);
        
        if (waveform1) this.drawWaveform(1, waveform1);
        if (waveform2) this.drawWaveform(2, waveform2);
    }

    hideLoadingOverlay() {
        this.ui.system.loadingOverlay.classList.add('hidden');
    }

    showLoading(message) {
        const text = this.ui.system.loadingOverlay.querySelector('.loading-text');
        text.textContent = message;
        this.ui.system.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.ui.system.loadingOverlay.classList.add('hidden');
    }

    showError(message) {
        console.error(message);
        // In a real implementation, you'd show a proper error dialog
        alert(message);
    }

    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        if (this.audioEngine) {
            // Clean up audio context
            if (this.audioEngine.audioContext) {
                this.audioEngine.audioContext.close();
            }
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DJConsole();
});
/**
 * Professional DJ Console Audio Engine
 * Web Audio API implementation for real-time audio processing
 */

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
        
        // Deck instances will be created after initialization
        this.deck1 = null;
        this.deck2 = null;
        
        // Master audio graph
        this.masterGain = null;
        this.masterAnalyser = null;
        this.channel1Gain = null;
        this.channel2Gain = null;
        this.crossfader = null;
        this.crossfaderAnalyser1 = null;
        this.crossfaderAnalyser2 = null;
        
        // State
        this.buffers = new Map();
        this.waveformData = new Map();
        this.analysis = new Map();
    }

    async init() {
        try {
            // Check Web Audio API support
            if (!window.AudioContext && !window.webkitAudioContext) {
                throw new Error('Web Audio API not supported in this browser');
            }
            
            // Initialize Audio Context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Handle suspended state (common on mobile)
            if (this.audioContext.state === 'suspended') {
                console.log('Audio context suspended, will resume on user interaction');
            }
            
            // Create deck instances after audio context is ready
            this.deck1 = new Deck(1, this);
            this.deck2 = new Deck(2, this);
            
            // Setup deck audio chains
            this.deck1.setupAudioChain();
            this.deck2.setupAudioChain();
            
            // Create master audio graph
            this.setupMasterGraph();
            
            // Setup audio routing
            this.setupDeckRouting();
            
            this.initialized = true;
            console.log('Audio Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Audio Engine:', error);
            this.initialized = false;
            throw error;
        }
    }

    setupMasterGraph() {
        // Check if audio context is available
        if (!this.audioContext) {
            throw new Error('Audio context not available');
        }
        
        // Master gain control
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.8;
        
        // Master analyser for VU meters
        this.masterAnalyser = this.audioContext.createAnalyser();
        this.masterAnalyser.fftSize = 256;
        this.masterAnalyser.smoothingTimeConstant = 0.8;
        
        // Channel gains (for crossfader)
        this.channel1Gain = this.audioContext.createGain();
        this.channel2Gain = this.audioContext.createGain();
        
        // Crossfader (acts as a control, not an audio node)
        this.crossfader = {
            position: 0.5, // 0 = CH1, 1 = CH2
            curve: 'sharp' // or 'smooth'
        };
        
        // Crossfader analysers for individual channel monitoring
        this.crossfaderAnalyser1 = this.audioContext.createAnalyser();
        this.crossfaderAnalyser1.fftSize = 128;
        this.crossfaderAnalyser1.smoothingTimeConstant = 0.7;
        
        this.crossfaderAnalyser2 = this.audioContext.createAnalyser();
        this.crossfaderAnalyser2.fftSize = 128;
        this.crossfaderAnalyser2.smoothingTimeConstant = 0.7;
        
        // Connect master graph
        this.channel1Gain.connect(this.masterAnalyser);
        this.channel2Gain.connect(this.masterAnalyser);
        this.masterAnalyser.connect(this.masterGain);
        this.masterGain.connect(this.audioContext.destination);
        
        // Connect crossfader monitors
        this.channel1Gain.connect(this.crossfaderAnalyser1);
        this.channel2Gain.connect(this.crossfaderAnalyser2);
    }

    setupDeckRouting() {
        // Set up routing for each deck
        this.deck1.setChannelGain(this.channel1Gain);
        this.deck2.setChannelGain(this.channel2Gain);
    }

    async loadAudioFile(deckId, file) {
        try {
            console.log(`Loading audio file for deck ${deckId}:`, file.name);
            
            // Check if audio context is ready
            if (!this.audioEngine.isReady()) {
                throw new Error('Audio engine not ready. Please initialize audio first.');
            }
            
            const arrayBuffer = await file.arrayBuffer();
            console.log('Array buffer created, size:', arrayBuffer.byteLength);
            
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            console.log('Audio buffer decoded, duration:', audioBuffer.duration, 'seconds');
            
            // Store buffer
            this.buffers.set(deckId, audioBuffer);
            
            // Generate waveform data
            console.log('Generating waveform data...');
            const waveformData = this.generateWaveformData(audioBuffer);
            this.waveformData.set(deckId, waveformData);
            console.log('Waveform data generated, samples:', waveformData.length);
            
            // Analyze audio (BPM, etc.)
            console.log('Analyzing audio...');
            const analysis = await this.analyzeAudio(audioBuffer);
            this.analysis.set(deckId, analysis);
            console.log('Audio analysis complete:', analysis);
            
            return {
                buffer: audioBuffer,
                waveform: waveformData,
                analysis: analysis,
                metadata: this.extractMetadata(file, arrayBuffer)
            };
        } catch (error) {
            console.error(`Failed to load audio file for deck ${deckId}:`, error);
            throw error;
        }
    }

    generateWaveformData(audioBuffer, samples = 1000) {
        const channelData = audioBuffer.getChannelData(0); // Use first channel
        const blockSize = Math.floor(channelData.length / samples);
        const waveformData = [];
        
        for (let i = 0; i < samples; i++) {
            const start = i * blockSize;
            const end = Math.min(start + blockSize, channelData.length);
            
            let min = 0;
            let max = 0;
            let sum = 0;
            
            for (let j = start; j < end; j++) {
                const sample = Math.abs(channelData[j]);
                min = Math.min(min, sample);
                max = Math.max(max, sample);
                sum += sample;
            }
            
            const avg = sum / (end - start);
            waveformData.push({ min, max, avg });
        }
        
        return waveformData;
    }

    async analyzeAudio(audioBuffer) {
        // Simple BPM detection using autocorrelation
        const analysis = {
            bpm: this.detectBPM(audioBuffer),
            duration: audioBuffer.duration,
            sampleRate: audioBuffer.sampleRate,
            channels: audioBuffer.numberOfChannels
        };
        
        return analysis;
    }

    detectBPM(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Downsample for BPM detection
        const downsampleRate = 8000;
        const step = Math.floor(sampleRate / downsampleRate);
        const downsampled = [];
        
        for (let i = 0; i < channelData.length; i += step) {
            downsampled.push(Math.abs(channelData[i]));
        }
        
        // Simple autocorrelation for beat detection
        const minBPM = 60;
        const maxBPM = 180;
        const minPeriod = Math.floor(downsampleRate * 60 / maxBPM);
        const maxPeriod = Math.floor(downsampleRate * 60 / minBPM);
        
        let bestPeriod = 0;
        let bestScore = 0;
        
        for (let period = minPeriod; period <= maxPeriod; period++) {
            let score = 0;
            for (let i = 0; i < downsampled.length - period; i++) {
                score += downsampled[i] * downsampled[i + period];
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestPeriod = period;
            }
        }
        
        if (bestPeriod > 0) {
            return Math.round(downsampleRate * 60 / bestPeriod);
        }
        
        return 0; // Could not detect BPM
    }

    extractMetadata(file, arrayBuffer) {
        const metadata = {
            name: file.name,
            size: file.size,
            type: file.type
        };
        
        // Try to extract ID3 tags (simplified)
        // In a real implementation, you'd use a proper ID3 parser
        try {
            // Look for ID3v2 header
            const view = new DataView(arrayBuffer);
            if (view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
                // ID3v2 tag detected (simplified parsing)
                metadata.hasID3 = true;
            }
        } catch (e) {
            // Ignore metadata parsing errors
        }
        
        return metadata;
    }

    getBuffer(deckId) {
        return this.buffers.get(deckId);
    }

    getWaveformData(deckId) {
        return this.waveformData.get(deckId);
    }

    getAnalysis(deckId) {
        return this.analysis.get(deckId);
    }

    getMasterLevel() {
        if (!this.masterAnalyser) return 0;
        
        const dataArray = new Uint8Array(this.masterAnalyser.frequencyBinCount);
        this.masterAnalyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        
        return Math.sqrt(sum / dataArray.length) / 255;
    }

    getChannelLevel(deckId) {
        const analyser = deckId === 1 ? this.crossfaderAnalyser1 : this.crossfaderAnalyser2;
        if (!analyser) return 0;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        
        return Math.sqrt(sum / dataArray.length) / 255;
    }

    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }

    setCrossfaderPosition(position) {
        this.crossfader.position = Math.max(0, Math.min(1, position));
        
        if (this.channel1Gain && this.channel2Gain) {
            // Apply crossfader curve
            if (this.crossfader.curve === 'sharp') {
                // Sharp curve - traditional crossfader
                this.channel1Gain.gain.setValueAtTime(
                    1 - this.crossfader.position, 
                    this.audioContext.currentTime
                );
                this.channel2Gain.gain.setValueAtTime(
                    this.crossfader.position, 
                    this.audioContext.currentTime
                );
            } else {
                // Smooth curve - equal power
                this.channel1Gain.gain.setValueAtTime(
                    Math.cos(this.crossfader.position * Math.PI / 2), 
                    this.audioContext.currentTime
                );
                this.channel2Gain.gain.setValueAtTime(
                    Math.cos((1 - this.crossfader.position) * Math.PI / 2), 
                    this.audioContext.currentTime
                );
            }
        }
    }

    setCrossfaderCurve(curve) {
        this.crossfader.curve = curve;
        // Re-apply with new curve
        this.setCrossfaderPosition(this.crossfader.position);
    }

    isReady() {
        return this.initialized && this.audioContext && this.audioContext.state === 'running';
    }

    async resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    getCurrentTime() {
        return this.audioContext ? this.audioContext.currentTime : 0;
    }
}

class Deck {
    constructor(deckId, audioEngine) {
        this.deckId = deckId;
        this.audioEngine = audioEngine;
        
        // Audio nodes
        this.source = null;
        this.channelGain = null;
        this.eqHigh = null;
        this.eqMid = null;
        this.eqLow = null;
        this.analyser = null;
        this.pitchNode = null;
        
        // State
        this.isPlaying = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.pitch = 0; // -1 to 1 (pitch bend)
        this.masterTempo = false;
        this.syncEnabled = false;
        this.loopIn = null;
        this.loopOut = null;
        this.loopActive = false;
        this.cuePoint = null;
        this.hotCues = new Array(4).fill(null);
        
        // EQ settings
        this.eqSettings = {
            high: 0,
            mid: 0,
            low: 0,
            gain: 1
        };
        
        // Audio chain will be setup when audio context is available
    }

    setupAudioChain() {
        if (!this.audioEngine.audioContext) {
            console.warn('Audio context not available for deck setup');
            return;
        }
        
        const ctx = this.audioEngine.audioContext;
        
        // Create EQ filters
        this.eqHigh = ctx.createBiquadFilter();
        this.eqHigh.type = 'highshelf';
        this.eqHigh.frequency.value = 12000;
        this.eqHigh.gain.value = 0;
        
        this.eqMid = ctx.createBiquadFilter();
        this.eqMid.type = 'peaking';
        this.eqMid.frequency.value = 1000;
        this.eqMid.Q.value = 1;
        this.eqMid.gain.value = 0;
        
        this.eqLow = ctx.createBiquadFilter();
        this.eqLow.type = 'lowshelf';
        this.eqLow.frequency.value = 100;
        this.eqLow.gain.value = 0;
        
        // Channel gain (for level control)
        this.channelGain = ctx.createGain();
        this.channelGain.gain.value = 0.8;
        
        // Analyser for VU meters
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 128;
        this.analyser.smoothingTimeConstant = 0.8;
        
        // Connect chain: source -> EQ -> gain -> analyser -> channel output
        this.eqHigh.connect(this.eqMid);
        this.eqMid.connect(this.eqLow);
        this.eqLow.connect(this.channelGain);
        this.channelGain.connect(this.analyser);
    }

    setChannelGain(gainNode) {
        // Connect the analyser output to the channel gain (mixer input)
        this.analyser.disconnect();
        this.analyser.connect(gainNode);
    }

    async loadBuffer(audioBuffer) {
        // Create new source
        this.source = this.audioEngine.audioContext.createBufferSource();
        this.source.buffer = audioBuffer;
        
        // Connect source to EQ chain
        this.source.connect(this.eqHigh);
        
        // Set up playback end handler
        this.source.onended = () => {
            if (this.isPlaying) {
                this.stop();
            }
        };
        
        this.reset();
    }

    play() {
        if (!this.source || !this.source.buffer) return false;
        
        if (this.isPaused) {
            // Resume from pause
            this.startPlayback(this.pauseTime);
        } else {
            // Start from beginning or cue point
            const startTime = this.cuePoint || 0;
            this.startPlayback(startTime);
        }
        
        this.isPlaying = true;
        this.isPaused = false;
        return true;
    }

    pause() {
        if (!this.isPlaying) return;
        
        this.pauseTime = this.getCurrentTime();
        this.source.stop();
        this.isPlaying = false;
        this.isPaused = true;
    }

    stop() {
        if (this.source) {
            this.source.stop();
        }
        this.isPlaying = false;
        this.isPaused = false;
        this.startTime = 0;
        this.pauseTime = 0;
    }

    startPlayback(startTime) {
        // Recreate source for each play
        this.source = this.audioEngine.audioContext.createBufferSource();
        this.source.buffer = this.source.buffer; // Keep the same buffer
        
        // Apply pitch/speed
        const playbackRate = this.masterTempo ? 1 + this.pitch : 1 + this.pitch;
        this.source.playbackRate.setValueAtTime(playbackRate, this.audioEngine.audioContext.currentTime);
        
        // Connect and start
        this.source.connect(this.eqHigh);
        this.startTime = this.audioEngine.audioContext.currentTime - startTime;
        this.source.start(0, startTime);
        
        this.source.onended = () => {
            if (this.isPlaying) {
                this.stop();
            }
        };
    }

    getCurrentTime() {
        if (!this.isPlaying) {
            return this.pauseTime;
        }
        return this.audioEngine.audioContext.currentTime - this.startTime;
    }

    getDuration() {
        return this.source ? this.source.buffer.duration : 0;
    }

    getProgress() {
        const duration = this.getDuration();
        const current = this.getCurrentTime();
        return duration > 0 ? current / duration : 0;
    }

    reset() {
        this.stop();
        this.cuePoint = null;
        this.loopActive = false;
        this.loopIn = null;
        this.loopOut = null;
    }

    setCuePoint(time) {
        this.cuePoint = time;
    }

    goToCue() {
        if (this.cuePoint !== null) {
            this.pauseTime = this.cuePoint;
            if (this.isPlaying) {
                this.startPlayback(this.cuePoint);
            }
        }
    }

    setHotCue(index, time) {
        if (index >= 0 && index < this.hotCues.length) {
            this.hotCues[index] = time;
        }
    }

    triggerHotCue(index) {
        const time = this.hotCues[index];
        if (time !== null) {
            this.pauseTime = time;
            if (this.isPlaying) {
                this.startPlayback(time);
            }
        }
    }

    setLoopIn() {
        this.loopIn = this.getCurrentTime();
    }

    setLoopOut() {
        this.loopOut = this.getCurrentTime();
        if (this.loopIn !== null && this.loopOut > this.loopIn) {
            this.loopActive = true;
        }
    }

    reloop() {
        if (this.loopIn !== null && this.loopOut !== null) {
            this.pauseTime = this.loopIn;
            if (this.isPlaying) {
                this.startPlayback(this.loopIn);
            }
        }
    }

    setPitch(pitch) {
        this.pitch = Math.max(-1, Math.min(1, pitch));
        if (this.isPlaying && this.source) {
            const playbackRate = this.masterTempo ? 1 : 1 + this.pitch;
            this.source.playbackRate.setValueAtTime(playbackRate, this.audioEngine.audioContext.currentTime);
        }
    }

    pitchBend(direction) {
        const bendAmount = 0.02; // 2% pitch bend
        if (direction === 'up') {
            this.setPitch(this.pitch + bendAmount);
        } else {
            this.setPitch(this.pitch - bendAmount);
        }
    }

    resetPitch() {
        this.setPitch(0);
    }

    setEQ(frequency, gain) {
        switch (frequency) {
            case 'high':
                this.eqHigh.gain.setValueAtTime(gain, this.audioEngine.audioContext.currentTime);
                this.eqSettings.high = gain;
                break;
            case 'mid':
                this.eqMid.gain.setValueAtTime(gain, this.audioEngine.audioContext.currentTime);
                this.eqSettings.mid = gain;
                break;
            case 'low':
                this.eqLow.gain.setValueAtTime(gain, this.audioEngine.audioContext.currentTime);
                this.eqSettings.low = gain;
                break;
        }
    }

    setGain(gain) {
        this.channelGain.gain.setValueAtTime(gain, this.audioEngine.audioContext.currentTime);
        this.eqSettings.gain = gain;
    }

    setMasterTempo(enabled) {
        this.masterTempo = enabled;
        if (this.isPlaying && this.source) {
            const playbackRate = enabled ? 1 : 1 + this.pitch;
            this.source.playbackRate.setValueAtTime(playbackRate, this.audioEngine.audioContext.currentTime);
        }
    }

    setSync(enabled) {
        this.syncEnabled = enabled;
        if (enabled) {
            // Sync to other deck
            this.syncToOtherDeck();
        }
    }

    syncToOtherDeck() {
        const otherDeck = this.deckId === 1 ? this.audioEngine.deck2 : this.audioEngine.deck1;
        if (otherDeck.source && otherDeck.source.buffer) {
            const otherBPM = this.audioEngine.getAnalysis(this.deckId === 1 ? 2 : 1)?.bpm || 120;
            const thisBPM = this.audioEngine.getAnalysis(this.deckId)?.bpm || 120;
            
            if (otherBPM > 0 && thisBPM > 0) {
                const pitchRatio = otherBPM / thisBPM;
                this.pitch = pitchRatio - 1;
                
                if (this.isPlaying && this.source) {
                    this.source.playbackRate.setValueAtTime(pitchRatio, this.audioEngine.audioContext.currentTime);
                }
            }
        }
    }

    getLevel() {
        if (!this.analyser) return 0;
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS level
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i];
        }
        
        return Math.sqrt(sum / dataArray.length) / 255;
    }

    // Jog wheel / scratching simulation
    scratch(intensity) {
        if (this.isPlaying) {
            // Simulate vinyl brake effect
            const brakeIntensity = Math.abs(intensity);
            if (brakeIntensity > 0.1) {
                this.pause();
            }
        }
    }
}

// Export for use in main application
window.AudioEngine = AudioEngine;
window.Deck = Deck;
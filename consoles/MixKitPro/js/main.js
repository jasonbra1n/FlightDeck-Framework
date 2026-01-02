class Deck {
            constructor(id, audioContext) {
                this.id = id;
                this.audioContext = audioContext;
                this.audioBuffer = null;
                this.audioSource = null;
                this.gainNode = null;
                this.vocoderNode = new AudioWorkletNode(this.audioContext, 'phase-vocoder-processor');
                this.isPlaying = false;
                this.isPaused = false;
                this.isLooping = false;
                this.startTime = 0;
                this.pauseTime = 0;
                this.duration = 0;
                this.currentTime = 0;
                this.bpm = 0;
                this.originalBpm = 0;
                this.tempo = 0;
                this.keylock = false;
                this.effects = {
                    reverb: { active: false, value: 0.5 },
                    delay: { active: false, value: 0.5 },
                    filter: { active: false, value: 0.5 }
                };
                this.trackInfo = {
                    title: '',
                    artist: '',
                    albumArt: null
                };

                this.setupAudio();
            }

            setupAudio() {
                this.gainNode = this.audioContext.createGain();
                this.effectsInput = this.audioContext.createGain();

                // --- Filter Node ---
                this.filterNode = this.audioContext.createBiquadFilter();

                // --- Delay Node ---
                this.delayNode = this.audioContext.createDelay(5.0);
                this.delayFeedbackGain = this.audioContext.createGain();
                this.delayNode.connect(this.delayFeedbackGain);
                this.delayFeedbackGain.connect(this.delayNode);

                // --- Reverb Node (as a send effect) ---
                this.reverbNode = this.audioContext.createConvolver();
                this.reverbWetGain = this.audioContext.createGain();
                this.reverbDryGain = this.audioContext.createGain();
                this.createReverbImpulse();

                // --- Build static graph ---
                this.effectsInput.connect(this.filterNode);
                this.filterNode.connect(this.delayNode);
                
                // Reverb is parallel
                this.delayNode.connect(this.reverbNode);
                this.reverbNode.connect(this.reverbWetGain);
                this.reverbWetGain.connect(this.gainNode);

                // Dry path for reverb mix
                this.delayNode.connect(this.reverbDryGain);
                this.reverbDryGain.connect(this.gainNode);
                
                this.gainNode.gain.value = 0.75;
                
                // --- Stereo VU Meter Analysers ---
                this.splitter = this.audioContext.createChannelSplitter(2);
                this.analyserL = this.audioContext.createAnalyser();
                this.analyserR = this.audioContext.createAnalyser();
                this.analyserL.smoothingTimeConstant = 0.8;
                this.analyserR.smoothingTimeConstant = 0.8;
                this.analyserL.fftSize = 256;
                this.analyserR.fftSize = 256;
                this.vuBufferLength = this.analyserL.fftSize;
                this.vuDataArrayL = new Float32Array(this.vuBufferLength);
                this.vuDataArrayR = new Float32Array(this.vuBufferLength);
            }

            setupAnalyser() {
                // This function is now handled by setupAudio
            }

            createReverbImpulse() {
                const length = this.audioContext.sampleRate * 2;
                const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

                for (let channel = 0; channel < 2; channel++) {
                    const channelData = impulse.getChannelData(channel);
                    for (let i = 0; i < length; i++) {
                        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
                    }
                }

                this.reverbNode.buffer = impulse;
            }

            async loadAudio(file) {
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    this.duration = this.audioBuffer.duration;

                    // Extract metadata
                    this.extractMetadata(file);

                    // Detect BPM
                    await this.detectBPM();

                    // Defer waveform generation to ensure canvas is rendered
                    requestAnimationFrame(() => this.generateWaveform());

                    this.updateUI();
                } catch (error) {
                    console.error('Error loading audio:', error);
                    alert('Error loading audio file. Please try a different file.');
                }
            }

            extractMetadata(file) {
                jsmediatags.read(file, {
                    onSuccess: (tag) => {
                        this.trackInfo.title = tag.tags.title || file.name;
                        this.trackInfo.artist = tag.tags.artist || 'Unknown Artist';

                        if (tag.tags.picture) {
                            const { data, format } = tag.tags.picture;
                            const base64String = data.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
                            this.trackInfo.albumArt = `data:${format};base64,${btoa(base64String)}`;
                        }

                        this.updateTrackInfo();
                    },
                    onError: (error) => {
                        console.log('Metadata extraction failed:', error);
                        this.trackInfo.title = file.name;
                        this.trackInfo.artist = 'Unknown Artist';
                        this.updateTrackInfo();
                    }
                });
            }

            async detectBPM() {
                if (!this.audioBuffer) return;

                document.getElementById(`bpm${this.id}`).textContent = 'BPM: Analyzing...';

                try {
                    const tempoSettings = {
                        minTempo: 70,
                        maxTempo: 210,
                    };
                    const result = await webAudioBeatDetector.guess(this.audioBuffer, tempoSettings);
                    console.log('BPM detection result:', result);

                    if (result && result.bpm) {
                        this.bpm = Math.round(result.bpm);
                        this.originalBpm = this.bpm;
                        document.getElementById(`bpm${this.id}`).textContent = `BPM: ${this.bpm}`;
                    } else {
                        throw new Error("BPM detection did not return a valid result.");
                    }
                } catch (err) {
                    console.error('BPM detection failed:', err);
                    document.getElementById(`bpm${this.id}`).textContent = 'BPM: --';
                    this.bpm = 0;
                    this.originalBpm = 0;
                }
            }

            generateWaveform() {
                const canvas = document.getElementById(`waveform${this.id}`);
                if (!canvas) return;
                const ctx = canvas.getContext('2d');

                const width = canvas.offsetWidth;
                const height = canvas.offsetHeight;
                canvas.width = width;
                canvas.height = height;

                if (!this.audioBuffer) {
                    ctx.clearRect(0, 0, width, height);
                    return;
                }

                const channelData = this.audioBuffer.getChannelData(0);
                const numSamples = channelData.length;
                const numPixels = width;

                const style = getComputedStyle(document.body);
                const primaryColor = style.getPropertyValue('--highlight-color').trim() || '#4ecdc4';
                ctx.clearRect(0, 0, width, height);
                ctx.fillStyle = primaryColor;

                const samplesPerPixel = Math.floor(numSamples / numPixels);

                if (samplesPerPixel < 1) {
                    // "Stretch" the waveform if there are more pixels than samples
                    const pixelsPerSample = numPixels / numSamples;
                    for (let i = 0; i < numSamples; i++) {
                        const amplitude = Math.abs(channelData[i]);
                        const barHeight = Math.min(amplitude * height * 2.5, height);
                        const x = i * pixelsPerSample;
                        ctx.fillRect(x, (height - barHeight) / 2, pixelsPerSample, barHeight);
                    }
                } else {
                    // "Compress" the waveform if there are more samples than pixels
                    const blockSize = samplesPerPixel;
                    for (let i = 0; i < numPixels; i++) {
                        let sum = 0;
                        for (let j = 0; j < blockSize; j++) {
                            const sampleIndex = i * blockSize + j;
                            if (sampleIndex < numSamples) {
                                sum += Math.abs(channelData[sampleIndex]);
                            }
                        }
                        const amplitude = sum / blockSize;
                        const barHeight = Math.min(amplitude * height * 2.5, height);
                        ctx.fillRect(i, (height - barHeight) / 2, 1, barHeight);
                    }
                }
            }


            pause() {
                if (this.audioSource && this.isPlaying) {
                    this.audioSource.stop();
                    this.pauseTime = this.audioContext.currentTime - this.startTime;
                    this.isPlaying = false;
                    this.isPaused = true;

                    document.getElementById(`play${this.id}`).textContent = '▶️ Play';
                }
            }

            stop() {
                if (this.audioSource) {
                    this.audioSource.stop();
                    this.audioSource = null;
                }

                this.isPlaying = false;
                this.isPaused = false;
                this.pauseTime = 0;
                this.currentTime = 0;

                document.getElementById(`play${this.id}`).textContent = '▶️ Play';
                this.updateProgress();
            }

            toggleLoop() {
                this.isLooping = !this.isLooping;
                const btn = document.getElementById(`loop${this.id}`);
                btn.classList.toggle('active', this.isLooping);

                if (this.audioSource) {
                    this.audioSource.loop = this.isLooping;
                }
                saveSettings();
            }

            toggleKeylock() {
                this.keylock = !this.keylock;
                const btn = document.getElementById(`keylock${this.id}`);
                btn.classList.toggle('active', this.keylock);

                // If playing, restart the track to apply the new audio graph
                if (this.isPlaying) {
                    this.pause();
                    this.play();
                }
                saveSettings();
            }

            setVolume(value) {
                this.gainNode.gain.value = value / 100;
                saveSettings();
            }

            setTempo(value) {
                this.tempo = parseFloat(value);
                document.getElementById(`tempoValue${this.id}`).textContent = `${this.tempo.toFixed(2)}%`;

                if (this.audioSource && this.isPlaying) {
                    const playbackRate = 1 + (this.tempo / 100);
                    this.audioSource.playbackRate.value = playbackRate;

                    if (this.keylock) {
                        const pitchFactor = 1 / playbackRate;
                        this.vocoderNode.parameters.get('pitchFactor').setValueAtTime(pitchFactor, this.audioContext.currentTime);
                    } else {
                        this.bpm = Math.round(this.originalBpm * playbackRate);
                        document.getElementById(`bpm${this.id}`).textContent = `BPM: ${this.bpm}`;
                    }
                }
                saveSettings();
            }

            seek(percentage) {
                if (!this.audioBuffer) return;

                const seekTime = this.duration * percentage;

                if (this.isPlaying) {
                    this.audioSource.stop();
                    this.play(seekTime);
                } else {
                    this.pauseTime = seekTime;
                    this.updateProgress();
                }
            }

            getCurrentTime() {
                if (this.isPlaying) {
                    return this.audioContext.currentTime - this.startTime;
                }
                return this.pauseTime;
            }

            updateProgress() {
                this.currentTime = this.getCurrentTime();
                const percentage = (this.currentTime / this.duration) * 100;

                document.getElementById(`progressBar${this.id}`).style.width = `${Math.min(percentage, 100)}%`;

                const currentMin = Math.floor(this.currentTime / 60);
                const currentSec = Math.floor(this.currentTime % 60).toString().padStart(2, '0');
                const totalMin = Math.floor(this.duration / 60);
                const totalSec = Math.floor(this.duration % 60).toString().padStart(2, '0');

                document.getElementById(`time${this.id}`).textContent = `${currentMin}:${currentSec} / ${totalMin}:${totalSec}`;
            }

            updateTrackInfo() {
                document.getElementById(`title${this.id}`).textContent = this.trackInfo.title;
                document.getElementById(`artist${this.id}`).textContent = this.trackInfo.artist;

                if (this.trackInfo.albumArt) {
                    document.getElementById(`albumArt${this.id}`).src = this.trackInfo.albumArt;
                }
            }

            updateUI() {
                this.updateTrackInfo();
                this.updateProgress();
            }

            updateVUMeter() {
                if (!this.analyserL || !this.analyserR) return;

                this.analyserL.getFloatTimeDomainData(this.vuDataArrayL);
                this.analyserR.getFloatTimeDomainData(this.vuDataArrayR);

                let peakL = 0;
                for (let i = 0; i < this.vuBufferLength; i++) {
                    const value = Math.abs(this.vuDataArrayL[i]);
                    if (value > peakL) peakL = value;
                }

                let peakR = 0;
                for (let i = 0; i < this.vuBufferLength; i++) {
                    const value = Math.abs(this.vuDataArrayR[i]);
                    if (value > peakR) peakR = value;
                }

                const barL = document.getElementById(`vuBar${this.id}L`);
                const barR = document.getElementById(`vuBar${this.id}R`);

                updateBar(barL, peakL);
                updateBar(barR, peakR);
            }

            play(startTimeOverride) {
                if (!this.audioBuffer) return;

                if (this.audioSource) {
                    this.audioSource.disconnect();
                }

                this.audioSource = this.audioContext.createBufferSource();
                this.audioSource.buffer = this.audioBuffer;

                // Apply tempo change
                const playbackRate = 1 + (this.tempo / 100);
                this.audioSource.playbackRate.value = playbackRate;

                this._buildAudioGraph();
                this.updateEffectValues(); // Set initial effect values

                this.audioSource.loop = this.isLooping;

                const startTime = (startTimeOverride !== undefined) ? startTimeOverride : (this.isPaused ? this.pauseTime : 0);
                this.audioSource.start(0, startTime);
                this.startTime = this.audioContext.currentTime - startTime;

                this.isPlaying = true;
                this.isPaused = false;
                this.pauseTime = startTime;

                document.getElementById(`play${this.id}`).textContent = '⏸️ Pause';
            }
            
            toggleEffect(effect, value) {
                if (value === undefined) {
                    this.effects[effect].active = !this.effects[effect].active;
                } else {
                    this.effects[effect].value = value;
                }
                
                this.updateEffectValues();
                this.updateEffectUI(effect);
                saveSettings();
            }

            updateEffectValues() {
                const now = this.audioContext.currentTime;
                const rampTime = now + 0.02; // Short ramp to avoid clicks

                // --- Filter ---
                if (this.effects.filter.active) {
                    const filterValue = this.effects.filter.value;
                    const minFreq = 40;
                    const maxFreq = this.audioContext.sampleRate / 2;
                    const freq = minFreq * Math.pow(maxFreq / minFreq, filterValue);
                    this.filterNode.frequency.linearRampToValueAtTime(freq, rampTime);
                    this.filterNode.Q.linearRampToValueAtTime(filterValue * 5, rampTime);
                    this.filterNode.gain.linearRampToValueAtTime(1, rampTime); // Ensure filter is 'on'
                } else {
                    // Bypass filter by setting it to a neutral state
                    this.filterNode.frequency.linearRampToValueAtTime(this.audioContext.sampleRate / 2, rampTime);
                    this.filterNode.Q.linearRampToValueAtTime(1, rampTime);
                }

                // --- Delay ---
                if (this.effects.delay.active) {
                    const delayValue = this.effects.delay.value;
                    this.delayNode.delayTime.linearRampToValueAtTime(delayValue * 2.0, rampTime);
                    this.delayFeedbackGain.gain.linearRampToValueAtTime(delayValue * 0.8, rampTime);
                } else {
                    this.delayNode.delayTime.linearRampToValueAtTime(0, rampTime);
                    this.delayFeedbackGain.gain.linearRampToValueAtTime(0, rampTime);
                }

                // --- Reverb ---
                const reverbValue = this.effects.reverb.value;
                if (this.effects.reverb.active) {
                    this.reverbWetGain.gain.linearRampToValueAtTime(reverbValue * 0.8, rampTime); // Mix reverb a bit lower
                    this.reverbDryGain.gain.linearRampToValueAtTime(1 - reverbValue, rampTime);
                } else {
                    this.reverbWetGain.gain.linearRampToValueAtTime(0, rampTime);
                    this.reverbDryGain.gain.linearRampToValueAtTime(1, rampTime);
                }
            }

            updateEffectUI(effect) {
                const knob = document.getElementById(`${effect}Knob${this.id}`);
                const value = this.effects[effect].value;
                const rotation = -135 + (value * 270); // -135 to 135 degrees
                knob.style.transform = `rotate(${rotation}deg)`;
                knob.classList.toggle('active', this.effects[effect].active);
            }

            _buildAudioGraph() {
                this.audioSource.disconnect();
                this.vocoderNode.disconnect();

                let currentNode = this.audioSource;
                if (this.keylock) {
                    const playbackRate = 1 + (this.tempo / 100);
                    const pitchFactor = 1 / playbackRate;
                    this.vocoderNode.parameters.get('pitchFactor').setValueAtTime(pitchFactor, this.audioContext.currentTime);
                    currentNode.connect(this.vocoderNode);
                    currentNode = this.vocoderNode;
                }
                
                currentNode.connect(this.effectsInput);
            }

            syncTo(otherDeck) {
                if (otherDeck.bpm && otherDeck.bpm > 0) {
                    const targetTempo = ((otherDeck.bpm / this.originalBpm) - 1) * 100;
                    document.getElementById(`tempo${this.id}`).value = targetTempo;
                    this.setTempo(targetTempo);
                }
            }
        }

        // Global variables
        let deckA, deckB;
        let masterGain;
        let audioContext;
        let crossfaderValue = 50;
        let crossfaderCurve = 'logarithmic';
        let tempoRange = 8;
        let playlist = [];
        let automixEnabled = false;
        let automixLeadDeck = 'A';
        let playlistIndex = -1;
        let spectrumAnalyser;
        let masterAnalyserL, masterAnalyserR, masterVuBufferLength, masterVuDataArrayL, masterVuDataArrayR;

        // Initialize application
        window.addEventListener('load', async () => {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('Audio context created, state:', audioContext.state);

                try {
                    await audioContext.audioWorklet.addModule('js/phase-vocoder-processor.js');
                    console.log('Phase vocoder module loaded.');
                } catch (e) {
                    console.error('Error loading phase vocoder module', e);
                    alert('Could not load audio processing module. Key lock will not be available.');
                }

                deckA = new Deck('A', audioContext);
                deckB = new Deck('B', audioContext);

                masterGain = audioContext.createGain();
                masterGain.gain.value = 0.75;

                // Connect decks to master gain and their respective VU meters
                deckA.gainNode.connect(masterGain);
                deckA.gainNode.connect(deckA.splitter);
                deckA.splitter.connect(deckA.analyserL, 0);
                deckA.splitter.connect(deckA.analyserR, 1);

                deckB.gainNode.connect(masterGain);
                deckB.gainNode.connect(deckB.splitter);
                deckB.splitter.connect(deckB.analyserL, 0);
                deckB.splitter.connect(deckB.analyserR, 1);

                masterGain.connect(audioContext.destination);

                // --- Master VU Meter ---
                const masterSplitter = audioContext.createChannelSplitter(2);
                masterAnalyserL = audioContext.createAnalyser();
                masterAnalyserR = audioContext.createAnalyser();
                masterAnalyserL.smoothingTimeConstant = 0.8;
                masterAnalyserR.smoothingTimeConstant = 0.8;
                masterAnalyserL.fftSize = 256;
                masterAnalyserR.fftSize = 256;
                masterVuBufferLength = masterAnalyserL.fftSize;
                masterVuDataArrayL = new Float32Array(masterVuBufferLength);
                masterVuDataArrayR = new Float32Array(masterVuBufferLength);
                masterGain.connect(masterSplitter);
                masterSplitter.connect(masterAnalyserL, 0);
                masterSplitter.connect(masterAnalyserR, 1);

                setupSpectrum();
                startUpdateLoop();

                // Add tooltip listeners
                document.querySelectorAll('.progress-container').forEach(container => {
                    const deckId = container.id.includes('A') ? 'A' : 'B';
                    const tooltip = document.getElementById(`seekTooltip${deckId}`);

                    container.addEventListener('mousemove', (event) => {
                        const deck = deckId === 'A' ? deckA : deckB;
                        if (!deck.audioBuffer) return;

                        const rect = container.getBoundingClientRect();
                        const percentage = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
                        const seekTime = deck.duration * percentage;

                        const minutes = Math.floor(seekTime / 60);
                        const seconds = Math.floor(seekTime % 60).toString().padStart(2, '0');
                        tooltip.textContent = `${minutes}:${seconds}`;

                        tooltip.style.left = `${event.clientX - rect.left}px`;
                    });
                });

                document.getElementById('togglePlaylistBtn').addEventListener('click', togglePlaylist);
                setupDragAndDrop();

                console.log('DJ Toolkit initialized successfully');
                
                loadSettings();
            } catch (error) {
                console.error('Error initializing DJ Toolkit:', error);
            }
        });

        function updateBar(bar, level) {
            if (!bar) return;
            const heightPercent = Math.min(level * 100, 100);
            bar.style.height = `${heightPercent}%`;

            if (level > 0.9) {
                bar.className = 'vu-bar red';
            } else if (level > 0.4) {
                bar.className = 'vu-bar yellow';
            } else {
                bar.className = 'vu-bar';
            }
        }

        function setupSpectrum() {
            spectrumAnalyser = audioContext.createAnalyser();
            spectrumAnalyser.fftSize = 256;
            masterGain.connect(spectrumAnalyser);

            const canvas = document.getElementById('spectrumCanvas');
            const ctx = canvas.getContext('2d');

            function drawSpectrum() {
                const width = canvas.width = canvas.offsetWidth;
                const height = canvas.height = canvas.offsetHeight;

                const bufferLength = spectrumAnalyser.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                spectrumAnalyser.getByteFrequencyData(dataArray);

                ctx.clearRect(0, 0, width, height);

                const barWidth = width / bufferLength;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * height;

                    const r = Math.floor(78 + (dataArray[i] / 255) * 177);
                    const g = Math.floor(205 - (dataArray[i] / 255) * 50);
                    const b = Math.floor(196 - (dataArray[i] / 255) * 50);

                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fillRect(x, height - barHeight, barWidth, barHeight);

                    x += barWidth;
                }

                requestAnimationFrame(drawSpectrum);
            }

            drawSpectrum();
        }

        function updateMasterVUMeter() {
            if (!masterAnalyserL || !masterAnalyserR) return;

            masterAnalyserL.getFloatTimeDomainData(masterVuDataArrayL);
            masterAnalyserR.getFloatTimeDomainData(masterVuDataArrayR);

            let peakL = 0;
            for (let i = 0; i < masterVuBufferLength; i++) {
                const value = Math.abs(masterVuDataArrayL[i]);
                if (value > peakL) peakL = value;
            }

            let peakR = 0;
            for (let i = 0; i < masterVuBufferLength; i++) {
                const value = Math.abs(masterVuDataArrayR[i]);
                if (value > peakR) peakR = value;
            }

            const barL = document.getElementById('vuBarMasterL');
            const barR = document.getElementById('vuBarMasterR');

            updateBar(barL, peakL);
            updateBar(barR, peakR);
        }

        function startUpdateLoop() {
            function update() {
                deckA.updateProgress();
                deckB.updateProgress();
                deckA.updateVUMeter();
                deckB.updateVUMeter();
                updateMasterVUMeter();

                // Check for automix
                if (automixEnabled) {
                    checkAutomix();
                }

                requestAnimationFrame(update);
            }
            update();
        }

        // Event handlers
        function loadTrack(deckId, file) {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            if (file) {
                const deck = deckId === 'A' ? deckA : deckB;
                deck.loadAudio(file);
            }
        }

        function togglePlay(deckId) {
            const deck = deckId === 'A' ? deckA : deckB;

            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }

            if (deck.isPlaying) {
                deck.pause();
            } else {
                deck.play();
            }
        }

        function stop(deckId) {
            const deck = deckId === 'A' ? deckA : deckB;
            deck.stop();
        }

        function toggleLoop(deckId) {
            const deck = deckId === 'A' ? deckA : deckB;
            deck.toggleLoop();
        }

        function toggleKeylock(deckId) {
            const deck = deckId === 'A' ? deckA : deckB;
            deck.toggleKeylock();
        }

        function setVolume(deckId, value) {
            const deck = deckId === 'A' ? deckA : deckB;
            deck.setVolume(value);
        }

        function setTempo(deckId, value) {
            const deck = deckId === 'A' ? deckA : deckB;
            deck.setTempo(value);
        }

        function setMasterVolume(value) {
            masterGain.gain.value = value / 100;
            updateMasterVolumeKnobUI(value / 100);
        }

        function updateMasterVolumeKnobUI(value) {
            const knob = document.getElementById('masterVolumeKnob');
            if (knob) {
                const rotation = -135 + (value * 270); // -135 to 135 degrees
                knob.style.transform = `rotate(${rotation}deg)`;
            }
        }

        function setCrossfader(value) {
            crossfaderValue = parseFloat(value);
            const x = crossfaderValue / 100;
            let leftGain, rightGain;

            switch (crossfaderCurve) {
                case 'linear':
                    leftGain = 1 - x;
                    rightGain = x;
                    break;
                case 'exponential':
                     leftGain = (1 - x) * (1 - x);
                     rightGain = x * x;
                    break;
                case 'logarithmic':
                default:
                    // Constant power curve
                    leftGain = Math.cos(x * Math.PI / 2);
                    rightGain = Math.sin(x * Math.PI / 2);
                    break;
            }

            deckA.gainNode.gain.value = leftGain * (document.getElementById('volumeA').value / 100);
            deckB.gainNode.gain.value = rightGain * (document.getElementById('volumeB').value / 100);
            saveSettings();
        }

        function seek(deckId, event) {
            const rect = event.target.getBoundingClientRect();
            const percentage = (event.clientX - rect.left) / rect.width;
            const deck = deckId === 'A' ? deckA : deckB;
            deck.seek(percentage);
        }

        function syncTempo(deckId) {
            if (deckId === 'A') {
                deckA.syncTo(deckB);
            } else {
                deckB.syncTo(deckA);
            }
        }

        // Knob turning logic
        let activeKnob = {
            type: null, // 'effect' or 'master'
            deck: null,
            effect: null,
            element: null,
            initialY: 0,
            initialValue: 0,
        };

        function startKnobTurn(event, type, parameter) {
            event.preventDefault();
            activeKnob.element = event.target;
            activeKnob.initialY = event.clientY;

            if (type === 'master') {
                activeKnob.type = 'master';
                activeKnob.initialValue = masterGain.gain.value;
            } else {
                const deck = type === 'A' ? deckA : deckB;
                activeKnob.type = 'effect';
                activeKnob.deck = deck;
                activeKnob.effect = parameter;
                activeKnob.initialValue = deck.effects[parameter].value;

                // Toggle active state on simple click without drag
                if (event.detail === 1) {
                    const wasActive = deck.effects[parameter].active;
                    // A small timeout to differentiate from a drag
                    setTimeout(() => {
                        if (activeKnob.element && Math.abs(event.clientY - activeKnob.initialY) < 5) {
                           deck.effects[parameter].active = !wasActive;
                           deck.toggleEffect(parameter);
                        }
                    }, 200);
                }
            }

            window.addEventListener('mousemove', handleKnobTurn);
            window.addEventListener('mouseup', endKnobTurn);
        }

        function handleKnobTurn(event) {
            if (!activeKnob.element) return;

            const dy = activeKnob.initialY - event.clientY;
            const sensitivity = 0.005;
            let value = activeKnob.initialValue + dy * sensitivity;
            value = Math.max(0, Math.min(1, value)); // clamp between 0 and 1

            if (activeKnob.type === 'master') {
                setMasterVolume(value * 100);
                saveSettings();
            } else {
                activeKnob.deck.toggleEffect(activeKnob.effect, value);
            }
        }

        function endKnobTurn(event) {
            activeKnob.element = null;
            activeKnob.type = null;
            window.removeEventListener('mousemove', handleKnobTurn);
            window.removeEventListener('mouseup', endKnobTurn);
        }

        function toggleAutomix() {
            automixEnabled = !automixEnabled;
            const btn = document.querySelector('button[onclick="toggleAutomix()"]');
            btn.classList.toggle('active', automixEnabled);
            btn.textContent = automixEnabled ? '🤖 Automix ON' : '🤖 Automix';

            if (automixEnabled && playlist.length > 0) {
                // Start automix if not already playing
                const leadDeck = automixLeadDeck === 'A' ? deckA : deckB;
                if (!leadDeck.isPlaying && !leadDeck.audioBuffer) {
                    playlistIndex = 0;
                    loadPlaylistItem(playlistIndex, automixLeadDeck === 'A' ? 'A' : 'B');
                }
            }
        }

        function checkAutomix() {
            if (!automixEnabled || playlist.length < 2) return;

            const leadDeck = automixLeadDeck === 'A' ? deckA : deckB;
            const nextDeck = automixLeadDeck === 'A' ? deckB : deckA;
            const leadDeckId = automixLeadDeck;
            const nextDeckId = automixLeadDeck === 'A' ? 'B' : 'A';

            const remainingTime = leadDeck.duration - leadDeck.currentTime;

            // Load next track when 15 seconds are left
            if (leadDeck.isPlaying && remainingTime < 15 && !nextDeck.audioBuffer && playlist.length > 0) {
                const nextIndex = (playlistIndex + 1) % playlist.length;
                loadPlaylistItem(nextIndex, nextDeckId);
            }

            // Start crossfade when 10 seconds are left
            if (leadDeck.isPlaying && remainingTime < 10 && nextDeck.audioBuffer && !nextDeck.isPlaying) {
                nextDeck.play();
            }

            // Crossfade logic
            if (leadDeck.isPlaying && nextDeck.isPlaying && remainingTime < 10) {
                const fadeProgress = (10 - remainingTime) / 10; // 0 to 1
                let crossfaderPosition;
                if (automixLeadDeck === 'A') {
                    crossfaderPosition = 50 + (fadeProgress * 50); // From 50 to 100
                } else {
                    crossfaderPosition = 50 - (fadeProgress * 50); // From 50 to 0
                }
                document.getElementById('crossfader').value = crossfaderPosition;
                setCrossfader(crossfaderPosition);
            }

            // Switch lead deck when track has ended
            if (leadDeck.isPlaying && remainingTime < 1) {
                leadDeck.stop();
                automixLeadDeck = nextDeckId;
                playlistIndex = (playlistIndex + 1) % playlist.length;
            }
        }

        // Drag and drop handlers
        function dragOverHandler(event) {
            event.preventDefault();
            event.target.closest('.drop-zone').classList.add('drag-over');
        }

        function dragLeaveHandler(event) {
            event.target.closest('.drop-zone').classList.remove('drag-over');
        }

        function dropHandler(event, deckId) {
            event.preventDefault();
            event.target.closest('.drop-zone').classList.remove('drag-over');

            const files = event.dataTransfer.files;
            if (files.length > 0) {
                loadTrack(deckId, files[0]);
            }
        }

        // Playlist functions
        function addToPlaylist(files) {
            for (const file of files) {
                playlist.push({
                    file: file,
                    name: file.name,
                    loaded: false
                });
            }
            updatePlaylistUI();
        }

        function updatePlaylistUI() {
            const container = document.getElementById('playlistItems');
            container.innerHTML = '';

            playlist.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'playlist-item';
                div.textContent = item.name;
                div.draggable = true;
                div.dataset.index = index;
                
                // Add click listener separately to avoid conflicts with drag events
                div.addEventListener('click', () => loadPlaylistItem(index));

                container.appendChild(div);
            });
        }

        function loadPlaylistItem(index, deckId) {
            const item = playlist[index];
            if (item && item.file) {
                const targetDeckId = deckId || (automixLeadDeck === 'A' ? 'B' : 'A');
                loadTrack(targetDeckId, item.file);
                playlistIndex = index;
            }
        }

        // Settings functions
        function openSettings() {
            document.getElementById('settingsModal').style.display = 'block';
        }

        function closeSettings() {
            document.getElementById('settingsModal').style.display = 'none';
        }

        function setCrossfaderCurve(curve) {
            crossfaderCurve = curve;
            console.log('Crossfader curve set to:', curve);
            // Re-apply the current crossfader value with the new curve
            setCrossfader(document.getElementById('crossfader').value);
            saveSettings();
        }

        function setAudioLatency(latency) {
            // Implementation would adjust audio buffer sizes
            console.log('Audio latency set to:', latency, 'ms');
        }

        function setTempoRange(range) {
            tempoRange = parseInt(range, 10);
            
            const decks = ['A', 'B'];
            decks.forEach(deckId => {
                const tempoSlider = document.getElementById(`tempo${deckId}`);
                const tempoLabel = tempoSlider.previousElementSibling;
                
                tempoSlider.min = -tempoRange;
                tempoSlider.max = tempoRange;
                
                if (tempoRange > 20) {
                    tempoSlider.step = 0.1;
                } else {
                    tempoSlider.step = 0.01;
                }
                
                tempoLabel.textContent = `Tempo ±${tempoRange}%`;
            });

            saveSettings();
        }

        function setTheme(theme) {
            document.body.className = `theme-${theme}`;
            console.log('Theme set to:', theme);
            saveSettings();
        }

        // Session management
        function exportSession() {
            const session = {
                deckA: {
                    trackInfo: deckA.trackInfo,
                    volume: document.getElementById('volumeA').value,
                    tempo: document.getElementById('tempoA').value,
                    isLooping: deckA.isLooping,
                    keylock: deckA.keylock,
                    effects: deckA.effects
                },
                deckB: {
                    trackInfo: deckB.trackInfo,
                    volume: document.getElementById('volumeB').value,
                    tempo: document.getElementById('tempoB').value,
                    isLooping: deckB.isLooping,
                    keylock: deckB.keylock,
                    effects: deckB.effects
                },
                masterVolume: masterGain.gain.value * 100,
                crossfader: document.getElementById('crossfader').value,
                playlist: playlist.map(item => ({ name: item.name }))
            };

            const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dj_session.json';
            a.click();
            URL.revokeObjectURL(url);
        }

        function importSession(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const session = JSON.parse(e.target.result);

                        // Restore settings
                        document.getElementById('volumeA').value = session.deckA.volume;
                        document.getElementById('volumeB').value = session.deckB.volume;
                        document.getElementById('tempoA').value = session.deckA.tempo;
                        document.getElementById('tempoB').value = session.deckB.tempo;
                        document.getElementById('crossfader').value = session.crossfader;

                        setVolume('A', session.deckA.volume);
                        setVolume('B', session.deckB.volume);
                        setTempo('A', session.deckA.tempo);
                        setTempo('B', session.deckB.tempo);
                        setMasterVolume(session.masterVolume);
                        setCrossfader(session.crossfader);

                        // Restore keylock
                        deckA.keylock = session.deckA.keylock;
                        document.getElementById('keylockA').classList.toggle('active', deckA.keylock);
                        deckB.keylock = session.deckB.keylock;
                        document.getElementById('keylockB').classList.toggle('active', deckB.keylock);

                        // Restore effects
                        for (const effect in session.deckA.effects) {
                            deckA.effects[effect] = session.deckA.effects[effect];
                            deckA.updateEffectUI(effect);
                        }
                        for (const effect in session.deckB.effects) {
                            deckB.effects[effect] = session.deckB.effects[effect];
                            deckB.updateEffectUI(effect);
                        }

                        // Restore playlist
                        playlist = session.playlist.map(item => ({ name: item.name, file: null, loaded: false }));
                        updatePlaylistUI();

                        alert('Session loaded successfully! Please re-load audio files for the playlist.');
                    } catch (error) {
                        alert('Error loading session file.');
                    }
                };
                reader.readAsText(file);
            }
        }

        function saveSettings() {
            if (!deckA || !deckB) return; // Don't save if decks aren't initialized

            const settings = {
                deckA: {
                    volume: document.getElementById('volumeA').value,
                    tempo: document.getElementById('tempoA').value,
                    isLooping: deckA.isLooping,
                    keylock: deckA.keylock,
                    effects: deckA.effects
                },
                deckB: {
                    volume: document.getElementById('volumeB').value,
                    tempo: document.getElementById('tempoB').value,
                    isLooping: deckB.isLooping,
                    keylock: deckB.keylock,
                    effects: deckB.effects
                },
                masterVolume: masterGain.gain.value * 100,
                crossfader: document.getElementById('crossfader').value,
                crossfaderCurve: document.getElementById('crossfaderCurve').value,
                theme: document.getElementById('theme').value,
                tempoRange: tempoRange,
                playlistCollapsed: document.querySelector('.playlist-container').classList.contains('collapsed')
            };
            localStorage.setItem('djToolkitSettings', JSON.stringify(settings));
        }

        function loadSettings() {
            const settings = JSON.parse(localStorage.getItem('djToolkitSettings'));
            if (!settings) return;

            // Restore Mixer
            setMasterVolume(settings.masterVolume);
            setCrossfader(settings.crossfader);
            document.getElementById('crossfader').value = settings.crossfader;

            // Restore Global Settings
            setCrossfaderCurve(settings.crossfaderCurve);
            document.getElementById('crossfaderCurve').value = settings.crossfaderCurve;
            setTheme(settings.theme);
            document.getElementById('theme').value = settings.theme;
            if(settings.tempoRange) {
                setTempoRange(settings.tempoRange);
                document.getElementById('tempoRange').value = settings.tempoRange;
            }

            if (settings.playlistCollapsed === false) {
                document.querySelector('.playlist-container').classList.remove('collapsed');
            } else if (settings.playlistCollapsed) {
                document.querySelector('.playlist-container').classList.add('collapsed');
            }

            // Restore Deck A
            if (settings.deckA && deckA) {
                setVolume('A', settings.deckA.volume);
                document.getElementById('volumeA').value = settings.deckA.volume;
                setTempo('A', settings.deckA.tempo);
                document.getElementById('tempoA').value = settings.deckA.tempo;
                if (deckA.isLooping !== settings.deckA.isLooping) toggleLoop('A');
                if (deckA.keylock !== settings.deckA.keylock) toggleKeylock('A');
                deckA.effects = settings.deckA.effects;
                deckA.updateEffectValues();
                Object.keys(deckA.effects).forEach(effect => deckA.updateEffectUI(effect));
            }

            // Restore Deck B
            if (settings.deckB && deckB) {
                setVolume('B', settings.deckB.volume);
                document.getElementById('volumeB').value = settings.deckB.volume;
                setTempo('B', settings.deckB.tempo);
                document.getElementById('tempoB').value = settings.deckB.tempo;
                if (deckB.isLooping !== settings.deckB.isLooping) toggleLoop('B');
                if (deckB.keylock !== settings.deckB.keylock) toggleKeylock('B');
                deckB.effects = settings.deckB.effects;
                deckB.updateEffectValues();
                Object.keys(deckB.effects).forEach(effect => deckB.updateEffectUI(effect));
            }
        }

        function closePlaylist() {
            const container = document.querySelector('.playlist-container');
            container.classList.add('collapsed');
            saveSettings();
        }

        function togglePlaylist() {
            const container = document.querySelector('.playlist-container');
            container.classList.toggle('collapsed');
            saveSettings();
        }

        let draggedIndex = null;

        function setupDragAndDrop() {
            const container = document.getElementById('playlistItems');

            container.addEventListener('dragstart', (e) => {
                if (e.target.classList.contains('playlist-item')) {
                    draggedIndex = parseInt(e.target.dataset.index, 10);
                    e.target.classList.add('dragging');
                }
            });

            container.addEventListener('dragend', (e) => {
                if (e.target.classList.contains('playlist-item')) {
                    e.target.classList.remove('dragging');
                    draggedIndex = null;
                }
            });

            container.addEventListener('dragover', (e) => {
                e.preventDefault();
                const target = e.target.closest('.playlist-item');
                if (target) {
                    const rect = target.getBoundingClientRect();
                    const offset = e.clientY - rect.top - (rect.height / 2);
                    if (offset < 0) {
                        target.classList.add('drag-over-top');
                        target.classList.remove('drag-over-bottom');
                    } else {
                        target.classList.add('drag-over-bottom');
                        target.classList.remove('drag-over-top');
                    }
                }
            });

            container.addEventListener('dragleave', (e) => {
                const target = e.target.closest('.playlist-item');
                if (target) {
                    target.classList.remove('drag-over-top', 'drag-over-bottom');
                }
            });

            container.addEventListener('drop', (e) => {
                e.preventDefault();
                const target = e.target.closest('.playlist-item');
                if (target && draggedIndex !== null) {
                    target.classList.remove('drag-over-top', 'drag-over-bottom');
                    const targetIndex = parseInt(target.dataset.index, 10);
                    
                    const rect = target.getBoundingClientRect();
                    const offset = e.clientY - rect.top - (rect.height / 2);
                    const insertBefore = offset < 0;

                    // Reorder playlist array
                    const [draggedItem] = playlist.splice(draggedIndex, 1);
                    
                    if (insertBefore) {
                        playlist.splice(targetIndex, 0, draggedItem);
                    } else {
                        playlist.splice(targetIndex + 1, 0, draggedItem);
                    }

                    updatePlaylistUI();
                }
            });
        }

        // Click outside modal to close
        window.onclick = function(event) {
            const modal = document.getElementById('settingsModal');
            if (event.target === modal) {
                closeSettings();
            }
        };

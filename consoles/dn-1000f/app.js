// DN-1000F Professional Audio Player
class DN1000F {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.tracks = [];
    this.currentTrack = -1;
    this.isPlaying = false;
    this.isPitchEnabled = false;
    this.pitchValue = 0;
    this.cuePoint = 0;
    this.hasCuePoint = false;
    this.timeMode = 'elapsed';
    
    this.source = null;
    this.buffer = null;
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    
    this.startTime = 0;
    this.pauseTime = 0;
    this.startOffset = 0;
    
    this.animationId = null;
    this.searchInterval = null;
    this.pitchBendInterval = null;
    this.preBendPitchValue = null;
    this.pitchReturnInterval = null;

    this.isSeeking = false;
    this.wasPlayingBeforeSeek = false;
    
    this.setupEventListeners();
    this.updateDisplay();
  }
  
  setupEventListeners() {
    document.getElementById('loadBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });
    
    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.loadFiles(e.target.files);
    });
    
    document.getElementById('playPauseBtn').addEventListener('click', () => {
      this.togglePlayPause();
    });
    
    const cueButton = document.getElementById('cueBtn');
    cueButton.addEventListener('mousedown', (e) => {
      this.handleCuePress(e);
    });
    cueButton.addEventListener('mouseup', (e) => {
      this.handleCueRelease(e);
    });
    cueButton.addEventListener('mouseleave', (e) => {
      // If the mouse leaves while pressed, treat it as a release
      if (e.buttons === 1 || e.buttons === 2) {
        this.handleCueRelease(e);
      }
    });
    // Prevent context menu on right-click to use it for our custom action
    cueButton.addEventListener('contextmenu', (e) => e.preventDefault());

    document.getElementById('prevTrack').addEventListener('click', () => {
      this.previousTrack();
    });
    
    document.getElementById('nextTrack').addEventListener('click', () => {
      this.nextTrack();
    });
    
    document.getElementById('timeBtn').addEventListener('click', () => {
      this.toggleTimeMode();
    });
    
    document.getElementById('pitchBtn').addEventListener('click', () => {
      this.togglePitch();
    });
    
    document.getElementById('pitchSlider').addEventListener('input', (e) => {
      this.setPitch(parseFloat(e.target.value));
    });
    
    // Pitch bend buttons
    document.getElementById('pitchUp').addEventListener('mousedown', () => {
      this.startPitchBend(1);
    });
    document.getElementById('pitchUp').addEventListener('mouseup', () => {
      this.stopPitchBend(true);
    });
    document.getElementById('pitchUp').addEventListener('mouseleave', () => {
      this.stopPitchBend(false);
    });
    
    document.getElementById('pitchDown').addEventListener('mousedown', () => {
      this.startPitchBend(-1);
    });
    document.getElementById('pitchDown').addEventListener('mouseup', () => {
      this.stopPitchBend(true);
    });
    document.getElementById('pitchDown').addEventListener('mouseleave', () => {
      this.stopPitchBend(false);
    });
    
    // Search buttons
    document.getElementById('rewind').addEventListener('mousedown', () => {
      this.startSearch(-1);
    });
    document.getElementById('rewind').addEventListener('mouseup', () => {
      this.stopSearch();
    });
    document.getElementById('rewind').addEventListener('mouseleave', () => {
      this.stopSearch();
    });
    
    document.getElementById('forward').addEventListener('mousedown', () => {
      this.startSearch(1);
    });
    document.getElementById('forward').addEventListener('mouseup', () => {
      this.stopSearch();
    });
    document.getElementById('forward').addEventListener('mouseleave', () => {
      this.stopSearch();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        this.togglePlayPause();
      } else if (e.code === 'KeyC') {
        this.setCue();
      } else if (e.code === 'ArrowLeft') {
        this.previousTrack();
      } else if (e.code === 'ArrowRight') {
        this.nextTrack();
      }
    });

    // Waveform seeking
    const waveformContainer = document.getElementById('waveformContainer');
    waveformContainer.addEventListener('mousedown', (e) => {
      this.handleSeekStart(e);
    });

    document.addEventListener('mousemove', (e) => {
      this.handleSeekMove(e);
    });

    document.addEventListener('mouseup', () => {
      this.handleSeekEnd();
    });
  }
  
  async loadFiles(files) {
    this.tracks = [];
    const jsmediatags = window.jsmediatags;

    for (let file of files) {
      try {
        const [arrayBuffer, tags] = await Promise.all([
          file.arrayBuffer(),
          new Promise((resolve) => {
            jsmediatags.read(file, {
              onSuccess: (tag) => resolve(tag.tags),
              onError: () => resolve(null) // Resolve with null if no tags found
            });
          })
        ]);

        // We need to clone the arrayBuffer because decodeAudioData can detach it
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));

        this.tracks.push({
          name: file.name.replace(/\.[^/.]+$/, ""),
          buffer: audioBuffer,
          duration: audioBuffer.duration,
          tags: tags
        });
      } catch (error) {
        console.error('Error loading file:', file.name, error);
        // Fallback for files without metadata or with loading errors
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.tracks.push({ name: file.name.replace(/\.[^/.]+$/, ""), buffer: audioBuffer, duration: audioBuffer.duration, tags: null });
      }
    }
    
    if (this.tracks.length > 0) {
      this.loadTrack(0);
    }
  }
  
  loadTrack(index) {
    if (index < 0 || index >= this.tracks.length) return;
    
    this.stop();
    this.currentTrack = index;
    this.buffer = this.tracks[index].buffer;
    this.cuePoint = 0;
    this.hasCuePoint = false;
    this.startOffset = 0;
    
    this.drawWaveform();
    this.updateAlbumArt();
    this.updateDisplay();
  }
  
  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }
  
  play() {
    if (!this.buffer) return;
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    
    this.source = this.audioContext.createBufferSource();
    this.source.buffer = this.buffer;
    
    const playbackRate = 1 + (this.isPitchEnabled ? this.pitchValue / 100 : 0);
    this.source.playbackRate.value = playbackRate;
    
    this.source.connect(this.gainNode);
    
    this.startTime = this.audioContext.currentTime;
    this.source.start(0, this.startOffset);
    
    this.source.onended = () => {
      if (this.isPlaying) {
        // Check if we reached the end of the track naturally
        if (this.getCurrentTime() >= this.buffer.duration - 0.1) {
            this.nextTrack();
        }
      }
    };
    
    this.isPlaying = true;
    this.animate();
    this.updateDisplay();
  }
  
  pause() {
    if (!this.isPlaying) return;
    
    this.pauseTime = this.audioContext.currentTime - this.startTime;
    this.startOffset += this.pauseTime * (1 + (this.isPitchEnabled ? this.pitchValue / 100 : 0));
    
    if (this.startOffset > this.buffer.duration) {
      this.startOffset = this.buffer.duration;
    }
    
    if (this.source) {
      this.source.stop();
      this.source = null;
    }
    
    this.isPlaying = false;
    cancelAnimationFrame(this.animationId);
    this.updateDisplay();
  }
  
  stop() {
    if (this.source) {
      try {
        this.source.onended = null; // Prevent onended from firing on manual stop
        this.source.stop();
      } catch (e) {}
      this.source = null;
    }
    
    this.isPlaying = false;
    // Resetting startOffset here is what causes the track to restart.
    this.startOffset = 0;
    cancelAnimationFrame(this.animationId);
    this.updateDisplay();
  }
  
  handleCuePress(event) {
    if (!this.buffer) return;

    // If playing, set cue or return to cue.
    if (this.isPlaying) {
      // If no cue point is set yet, set it at the current position.
      if (!this.hasCuePoint) {
        this.cuePoint = this.getCurrentTime();
        this.hasCuePoint = true;
        document.getElementById('cueLed').classList.add('led-on');
        this.updateCueMarker();
        this.updateDisplay();
        return;
      }
      // If a cue point exists, jump to it and continue playing.
      const wasPlaying = this.isPlaying;
      if (wasPlaying) this.pause(); // Pause to stop current playback
      this.startOffset = this.cuePoint;
      this.play();
    } else { // If not playing (paused)
      // If a cue point is set and we are at it, play for stutter effect.
      if (this.hasCuePoint && this.getCurrentTime() === this.cuePoint) {
        this.play();
      } else {
        // Otherwise, set a new cue point at the current position.
        this.cuePoint = this.getCurrentTime();
        this.hasCuePoint = true;
        document.getElementById('cueLed').classList.add('led-on');
        this.updateCueMarker();
        this.updateDisplay();
      }
    }
  }

  handleCueRelease(event) {
    if (!this.buffer || !this.hasCuePoint) return;

    // On right-click release (button=2), we let the music continue to play.
    if (this.isPlaying && event.button === 2) {
      return; // Do nothing, let it play.
    }

    // For stutter play (left-click release), stop and return to the cue point.
    this.pause();
    this.startOffset = this.cuePoint;
    this.updateDisplay();
  }
  
  getCurrentTime() {
    if (!this.buffer) return 0;
    
    if (this.isPlaying) {
      const elapsed = (this.audioContext.currentTime - this.startTime) * (1 + (this.isPitchEnabled ? this.pitchValue / 100 : 0));
      return Math.min(this.startOffset + elapsed, this.buffer.duration);
    }
    
    return this.startOffset;
  }
  
    previousTrack() {
    if (!this.buffer) return;

    const wasPlaying = this.isPlaying;
    const currentTime = this.getCurrentTime();

    // If track has been playing for more than 3 seconds, or we are not on the first track,
    // pressing 'previous' will restart the current track.
    if (currentTime > 3 || this.currentTrack === 0) {
      if (wasPlaying) this.pause();
      this.startOffset = 0;
      this.updateDisplay();
      if (wasPlaying) this.play();
    } 
    // If the track is within the first 3 seconds and it's not the first track, go to the previous track.
    else if (this.currentTrack > 0) {
      this.loadTrack(this.currentTrack - 1);
      if (wasPlaying) {
        this.play();
      }
    } else {
      // If it's the first track and within the first 3 seconds, just restart it.
      if (wasPlaying) this.pause();
      this.startOffset = 0;
      this.updateDisplay();
      if (wasPlaying) this.play();
    }
  }
  
  nextTrack() {
    if (this.currentTrack < this.tracks.length - 1) {
      const wasPlaying = this.isPlaying;
      this.loadTrack(this.currentTrack + 1);
      if (wasPlaying) this.play();
    }
  }

  toggleTimeMode() {
    this.timeMode = this.timeMode === 'elapsed' ? 'remain' : 'elapsed';
    const btn = document.getElementById('timeBtn');
    btn.textContent = this.timeMode === 'elapsed' ? 'ELA' : 'REM';
    document.getElementById('timeMode').textContent = this.timeMode === 'elapsed' ? 'ELAPSED' : 'REMAIN';
    this.updateDisplay();
  }

  togglePitch() {
    this.isPitchEnabled = !this.isPitchEnabled;
    document.getElementById('pitchBtnText').textContent = this.isPitchEnabled ? 'PITCH ON' : 'PITCH OFF';
    document.getElementById('pitchBtn').classList.toggle('active', this.isPitchEnabled);
    
    if (!this.isPitchEnabled) {
      this.setPitch(0);
      document.getElementById('pitchSlider').value = 0;
    }

    if (this.isPlaying) {
      // We need to pause and play to apply the new playback rate correctly.
      this.pause();
      this.play();
    } else {
      // If paused, we still need to update the playback rate for when it resumes.
      // This requires creating and stopping a dummy source node.
      // This is a bit of a workaround for the Web Audio API's architecture.
      const dummySource = this.audioContext.createBufferSource();
      dummySource.buffer = this.buffer;
      const playbackRate = 1 + (this.isPitchEnabled ? this.pitchValue / 100 : 0);
      dummySource.playbackRate.value = playbackRate;
      // No need to connect or start, the rate is latched for the next real `play()` call.
    }
    
    this.updateDisplay();
  }

  setPitch(value) {
    this.pitchValue = value;
    document.getElementById('pitchValue').textContent = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
    document.getElementById('pitchDisplay').textContent = (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
    
    const indicator = document.getElementById('pitchIndicator');
    const percentage = ((10 - value) / 20) * 100;
    indicator.style.top = percentage + '%';
    
    if (this.isPlaying && this.source) {
      const playbackRate = 1 + (this.isPitchEnabled ? value / 100 : 0);
      this.source.playbackRate.value = playbackRate;
    }
  }

  startPitchBend(direction) {
    // If pitch is not enabled, do nothing.
    if (!this.isPitchEnabled) return;

    // If it's currently returning to a pitch, stop that.
    if (this.pitchReturnInterval) {
      clearInterval(this.pitchReturnInterval);
      this.pitchReturnInterval = null;
    }

    // If a bend/return cycle is not already in progress, store the current pitch.
    if (this.preBendPitchValue === null) {
      this.preBendPitchValue = this.pitchValue;
    }

    // Clear any existing bend interval to prevent multiple intervals from running
    clearInterval(this.pitchBendInterval);
    this.pitchBendInterval = null;

    this.pitchBendInterval = setInterval(() => {
      // Bending is only temporary, so we don't update the slider value directly
      const tempPitch = this.pitchValue + (direction * 0.5);
      const newValue = Math.max(-10, Math.min(10, tempPitch));
      document.getElementById('pitchSlider').value = newValue;
      this.setPitch(newValue);
    }, 50);
  }

  stopPitchBend(isMouseUp) {
    clearInterval(this.pitchBendInterval);
    // If the mouse is still down (mouseleave event), don't do anything else.
    // Only proceed if the button was actually released (mouseup).
    if (!isMouseUp) return;

    this.pitchBendInterval = null;

    // If we have a pre-bend value, ramp back to it.
    if (this.preBendPitchValue !== null) {
      this.pitchReturnInterval = setInterval(() => {
        const step = 0.1;
        const difference = this.preBendPitchValue - this.pitchValue;

        if (Math.abs(difference) < step) {
          this.setPitch(this.preBendPitchValue);
          document.getElementById('pitchSlider').value = this.preBendPitchValue;
          clearInterval(this.pitchReturnInterval);
          this.pitchReturnInterval = null;
          this.preBendPitchValue = null; // Reset for next time
        } else {
          const newPitch = this.pitchValue + (difference > 0 ? step : -step);
          this.setPitch(newPitch);
          document.getElementById('pitchSlider').value = newPitch;
        }
      }, 10); // A short interval for a smooth ramp
    }
  }

  startSearch(direction) {
    if (this.searchInterval) {
      clearInterval(this.searchInterval);
    }

    this.searchInterval = setInterval(() => {
      if (!this.buffer) return;
      
      const wasPlaying = this.isPlaying;
      const searchIncrement = wasPlaying ? 0.2 : 0.01; // Larger jump when playing, smaller when paused
      
      // Update the offset
      const newOffset = Math.max(0, Math.min(this.buffer.duration, this.startOffset + (direction * searchIncrement)));
      this.startOffset = newOffset;

      if (wasPlaying) {
        // If playing, we need to restart from the new position.
        // This involves a quick pause and play.
        this.pause();
        this.startOffset = newOffset; // Re-apply offset after pause calculation
        this.play();
      } else {
        // If paused, play a short stutter and update the display.
        this.playStutter(this.startOffset, 0.05); // Play 50ms for the stutter effect
        this.updateDisplay();
      }
    }, 100);
  }

  stopSearch() {
    if (this.searchInterval) {
      clearInterval(this.searchInterval);
      this.searchInterval = null;
    }
  }

  playStutter(offset, duration) {
    if (!this.buffer) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const stutterSource = this.audioContext.createBufferSource();
    stutterSource.buffer = this.buffer;
    stutterSource.connect(this.gainNode);

    const playbackRate = 1 + (this.isPitchEnabled ? this.pitchValue / 100 : 0);
    stutterSource.playbackRate.value = playbackRate;

    stutterSource.start(0, offset, duration);
  }
  
  handleSeekStart(e) {
    if (!this.buffer) return;

    this.isSeeking = true;
    this.wasPlayingBeforeSeek = this.isPlaying;

    if (this.isPlaying) {
      this.pause();
    }

    this.updateSeekPosition(e);
  }

  handleSeekMove(e) {
    if (!this.isSeeking || !this.buffer) return;

    this.updateSeekPosition(e);
    // Stutter while dragging for precise cueing when paused
    if (!this.wasPlayingBeforeSeek) {
      this.playStutter(this.startOffset, 0.05);
    }
  }

  handleSeekEnd() {
    if (!this.isSeeking) return;

    this.isSeeking = false;
    if (this.wasPlayingBeforeSeek) {
      this.play();
    }
  }

  updateSeekPosition(e) {
    const waveformContainer = document.getElementById('waveformContainer');
    const rect = waveformContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));

    const newOffset = this.buffer.duration * percentage;
    this.startOffset = newOffset;

    // If we are setting a cue, update it to the new seek position
    this.updateDisplay();
  }


    formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 75);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${frames.toString().padStart(2, '0')}`;
  }
  
  updateDisplay() {
    if (!this.buffer) {
      document.getElementById('trackNumber').textContent = '--';
      document.getElementById('timeDisplay').textContent = '00:00.00';
      document.getElementById('trackTitle').textContent = 'NO DISC';
      return;
    }
    
    const currentTime = this.getCurrentTime();
    const displayTime = this.timeMode === 'elapsed' ? currentTime : this.buffer.duration - currentTime;
    
    document.getElementById('trackNumber').textContent = (this.currentTrack + 1).toString().padStart(2, '0');
    document.getElementById('timeDisplay').textContent = this.formatTime(displayTime);
    document.getElementById('trackTitle').textContent = this.tracks[this.currentTrack].name.substring(0, 25);
    
    this.updatePlayhead();
  }

  updateAlbumArt() {
    const albumArtContainer = document.getElementById('albumArt');
    const track = this.tracks[this.currentTrack];
    
    // Clear previous art
    albumArtContainer.innerHTML = '<span class="material-icons">music_note</span>';

    if (track && track.tags && track.tags.picture) {
      const { data, format } = track.tags.picture;
      let base64String = "";
      for (let i = 0; i < data.length; i++) {
        base64String += String.fromCharCode(data[i]);
      }
      const imageUrl = `data:${format};base64,${window.btoa(base64String)}`;
      
      const img = document.createElement('img');
      img.src = imageUrl;
      albumArtContainer.innerHTML = ''; // Clear the icon
      albumArtContainer.appendChild(img);
    }
  }

  updatePlayhead() {
    if (!this.buffer) return;
    
    const currentTime = this.getCurrentTime();
    const percentage = (currentTime / this.buffer.duration) * 100;
    document.getElementById('playhead').style.left = percentage + '%';
  }
  
  updateCueMarker() {
    if (!this.buffer || !this.hasCuePoint) {
      document.getElementById('cueMarker').style.display = 'none';
      return;
    }
    
    const percentage = (this.cuePoint / this.buffer.duration) * 100;
    const marker = document.getElementById('cueMarker');
    marker.style.left = percentage + '%';
    marker.style.display = 'block';
  }
  
  animate() {
    if (this.isPlaying) {
      this.updateDisplay();
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }
  
  drawWaveform() {
    const canvas = document.getElementById('waveformCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    if (!this.buffer) return;
    
    const data = this.buffer.getChannelData(0);
    const step = Math.ceil(data.length / canvas.width);
    const amp = canvas.height / 2;
    
    ctx.fillStyle = 'rgba(30, 59, 30, 0.3)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#1e3b1e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    for (let i = 0; i < canvas.width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      ctx.moveTo(i, (1 + min) * amp);
      ctx.lineTo(i, (1 + max) * amp);
    }
    
    ctx.stroke();
  }
}

// Initialize the DN-1000F player
const player = new DN1000F();

// Handle window resize for waveform
window.addEventListener('resize', () => {
  if (player.buffer) {
    player.drawWaveform();
  }
});
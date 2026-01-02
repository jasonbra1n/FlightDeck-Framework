# Starter Prompts for Gemini Code Assist (Denon Emulator)

This file contains starter prompts to quickly bring Gemini Code Assist up to speed on the Denon DN-1000F Web Emulator project. Use these at the beginning of a new chat session to streamline our workflow.

---

## ⚡ Quick Sync Prompt

Use this one-liner to quickly load context at the start of a session.

```
Please read all the project context files (`.gemini/prompt.md`, `.github/ROADMAP.md`, `.github/CONTRIBUTING.md`, etc.) to get in sync with the current state of the project.
```

---

## 🎵 Audio Engine Development

*Use these for working on the Web Audio API logic.*

- "Let's implement the pitch control logic using `playbackRate`. How do we ensure the pitch slider maps correctly to a +/- 10% range?"
- "I need to implement the 'Cue' button behavior. It should play while held and return to the cue point on release. How should we structure this in the audio graph?"
- "Let's debug an audio glitch. I'm hearing popping artifacts when pausing. Can we review the `gainNode` ramp-down logic?"

---

## 🎨 UI & Interaction

*Use these for CSS styling and DOM event handling.*

- "Let's style the LCD display. I need it to look like a retro 7-segment display with a backlight."
- "I want to implement the jog wheel. How can we capture mouse drag events to simulate pitch bending?"
- "Let's make the buttons responsive. They need to have a distinct 'pressed' state that mimics the physical tactile feel."

---

## 🛠️ Maintenance & Refactoring

*Use these for code quality and documentation.*

- "Please review `js/app.js` and suggest any refactoring to decouple the audio logic from the UI event listeners."
- "Let's update `CHANGELOG.md` with the recent features we added."
- "Can we add JSDoc comments to the `AudioEngine` class to better explain the signal flow?"

---

## 🏁 Finishing Coding Sessions

*Use these to wrap up work and keep the project organized.*

- "Summarize the changes we made in this session for a Git commit message. Follow the Conventional Commits format."
- "Let's update `.gemini/scratchpad.md`. Mark completed tasks as done and add any new ideas we discussed to the backlog."
- "Based on our progress today, what should be the primary focus for the next session?"
```
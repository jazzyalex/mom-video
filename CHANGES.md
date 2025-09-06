# Change Log

All notable changes to this project are documented here.

## 2025-09-06

- Signaling: Split ICE candidates into per-role paths `callerCandidates` and `calleeCandidates` to avoid race conditions.
- Reliability: Added candidate buffering until remote SDP is set, then flush.
- ICE: Switched to concise STUN + secure TURN (`turns:` on 5349/443) and reduced `iceCandidatePoolSize` to 1.
- Compatibility: Included `adapter-latest.js` for broader WebRTC support (older Android/iOS Safari).
- Observability: Expanded `icecandidateerror` logging details.
- Logging: Added cloud logging to Firebase Realtime Database under `sessions/<sessionId>` with metadata and per-room session mapping at `rooms/<roomId>/sessions`.
- UX (RU): Translated UI text to Russian across HTML and runtime status messages.
- Debug UI: Hidden on-screen debug panel by default; still available via `?debug=1` if needed.
- Fix: Hide the “Ожидание видео…” overlay when remote video starts (on `ontrack`, and also on `remoteVideo` `playing/loadeddata`).
- Chrome 55 support: Reordered polyfills to run before capability checks, broadened legacy getUserMedia detection, and removed optional chaining (`?.`) from client code (js/ui.js, js/webrtc.js).

## 2025-09-05

- Initial modularization: separated `app.js`, `webrtc.js`, `ui.js`, `debug.js`, `config.js`.
- Basic 1:1 call flow using Firebase Realtime Database signaling.
- Initial styles and start/join screens.

---

For prior history, see repository commits before 2025‑09‑05.

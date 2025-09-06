const APP_VERSION = 'v2025.09.06-modular';

const firebaseConfig = {
    apiKey: "AIzaSyAlw8DCrAgKKx6kOiXUb552znMvKz-yTsY",
    authDomain: "mom-video-call.firebaseapp.com",
    projectId: "mom-video-call",
    storageBucket: "mom-video-call.firebasestorage.app",
    messagingSenderId: "1051927207225",
    appId: "1:1051927207225:web:88d8d895d135e6ed9e5ce8",
    measurementId: "G-JLVCBM279E",
    databaseURL: "https://mom-video-call-default-rtdb.firebaseio.com"
};

const webrtcConfig = {
    iceServers: [
        // STUN
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },

        // TURN over TLS (preferred for restrictive networks)
        {
            urls: ['turns:relay1.expressturn.com:5349', 'turns:relay1.expressturn.com:443?transport=tcp'],
            username: 'efJKX4XJRSKS0DFT3J',
            credential: '2CQpQZPNhPUDGOgO'
        },

        // TURN TCP/UDP fallbacks
        {
            urls: ['turn:relay1.expressturn.com:3478?transport=udp', 'turn:relay1.expressturn.com:443?transport=tcp'],
            username: 'efJKX4XJRSKS0DFT3J',
            credential: '2CQpQZPNhPUDGOgO'
        },
        {
            urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443', 'turn:openrelay.metered.ca:443?transport=tcp'],
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 1
};

const simpleWebrtcConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

const mediaConstraints = {
    video: { 
        facingMode: 'user',
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 }
    },
    audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
    }
};

const fallbackMediaConstraints = {
    video: { 
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
    },
    audio: true
};

const basicMediaConstraints = {
    video: true,
    audio: true
};

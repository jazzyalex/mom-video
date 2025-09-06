class VideoCallApp {
    constructor() {
        this.database = null;
        this.webrtcManager = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            debugLogger.init();
            debugLogger.info('Initializing Video Call App...');
            
            compatibilityManager.init();
            
            if (!compatibilityManager.isSupported()) {
                compatibilityManager.showUnsupportedMessage();
                return;
            }
            
            await this.initFirebase();
            await this.initUI();
            await this.checkForRoomJoin();
            await this.setupEventListeners();
            
            this.isInitialized = true;
            debugLogger.success('Video Call App initialized successfully');
        } catch (err) {
            debugLogger.error('Failed to initialize app: ' + err.message);
            this.showInitError(err);
        }
    }

    async initFirebase() {
        try {
            debugLogger.info('Initializing Firebase...');
            firebase.initializeApp(firebaseConfig);
            this.database = firebase.database();
            debugLogger.success('Firebase initialized successfully');
        } catch (err) {
            debugLogger.error('Firebase initialization failed: ' + err.message);
            throw new Error('Firebase connection failed');
        }
    }

    async initUI() {
        uiManager.init();
        this.webrtcManager = new WebRTCManager(this.database, debugLogger);
        window.webrtcManager = this.webrtcManager;
    }

    async checkForRoomJoin() {
        const urlParams = new URLSearchParams(window.location.search);
        const joinRoom = urlParams.get('room');
        
        if (joinRoom) {
            debugLogger.info('Join room detected: ' + joinRoom);
            this.webrtcManager.setRoomId(joinRoom);
            uiManager.showJoinButton();
            
            setTimeout(() => {
                debugLogger.info('Auto-joining call...');
                this.joinCall();
            }, 500);
        }
    }

    setupEventListeners() {
        const createBtn = document.getElementById('createCallBtn');
        const joinBtn = document.getElementById('joinCallBtn');

        if (createBtn) {
            createBtn.addEventListener('click', () => this.createCall());
        }

        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.joinCall());
        }
    }

    async createCall() {
        try {
            debugLogger.info('Create call initiated');
            uiManager.setStatus('Accessing camera...');
            
            const stream = await this.webrtcManager.getMediaStream();
            uiManager.setLocalVideo(stream);
            
            const roomId = this.webrtcManager.createRoom();
            const link = window.location.origin + window.location.pathname + '?room=' + roomId;
            uiManager.showLinkDisplay(link);
            
            await this.webrtcManager.startCall();
            debugLogger.success('Call created successfully');
            
        } catch (err) {
            debugLogger.error('Failed to create call: ' + err.message);
            this.showMediaError(err);
        }
    }

    async joinCall() {
        try {
            debugLogger.info('Join call initiated');
            uiManager.setStatus('Accessing camera...');
            
            const stream = await this.webrtcManager.getMediaStream();
            uiManager.setLocalVideo(stream);
            uiManager.showVideoCall();
            uiManager.setStatus('Connecting to call...');
            
            await this.webrtcManager.joinCall();
            debugLogger.success('Joined call successfully');
            
        } catch (err) {
            debugLogger.error('Failed to join call: ' + err.message);
            this.showMediaError(err);
        }
    }

    showMediaError(err) {
        let message = 'Please allow camera and microphone access';
        
        if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            message = 'Camera or microphone not found';
        } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            message = 'Camera and microphone access denied. Please allow access and refresh.';
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            message = 'Camera or microphone is being used by another app';
        } else if (err.name === 'OverconstrainedError') {
            message = 'Camera settings not supported';
        }
        
        alert(message);
        debugLogger.error('Media error: ' + err.name + ' - ' + err.message);
    }

    showInitError(err) {
        alert('Failed to start video call app. Please refresh the page and try again.');
        debugLogger.error('Initialization error: ' + err.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.videoCallApp = new VideoCallApp();
    window.videoCallApp.init();
});
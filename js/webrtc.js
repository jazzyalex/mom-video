class WebRTCManager {
    constructor(database, debugLogger) {
        this.database = database;
        this.debug = debugLogger;
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.roomId = null;
        this.isInitiator = false;
        this.remoteVideoReceived = false;
        this.connectionTimeout = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.pendingCandidates = [];
        this.remoteDescriptionSet = false;
    }

    async getMediaStream() {
        const constraints = [
            mediaConstraints,
            fallbackMediaConstraints,
            basicMediaConstraints,
            { video: { facingMode: 'user' }, audio: true },
            { video: true, audio: true }
        ];

        for (let i = 0; i < constraints.length; i++) {
            try {
                const constraintName = ['advanced', 'fallback', 'basic', 'simple', 'minimal'][i];
                this.debug.info(`Requesting media access with ${constraintName} constraints...`);
                
                this.localStream = await navigator.mediaDevices.getUserMedia(constraints[i]);
                this.debug.success(`Media access granted with ${constraintName} constraints`);
                return this.localStream;
                
            } catch (err) {
                this.debug.warn(`${constraintName} constraints failed: ${err.message}`);
                
                if (i === constraints.length - 1) {
                    this.debug.error('All media access attempts failed');
                    throw err;
                }
            }
        }
    }

    createRoom() {
        this.roomId = Math.random().toString(36).substring(2, 12);
        this.isInitiator = true;
        this.debug.info('Created room: ' + this.roomId);
        return this.roomId;
    }

    setRoomId(roomId) {
        this.roomId = roomId;
        this.isInitiator = false;
        this.debug.info('Joining room: ' + roomId);
    }

    async setupPeerConnection(useSimpleConfig = false) {
        try {
            const config = useSimpleConfig ? simpleWebrtcConfig : webrtcConfig;
            this.debug.info('Setting up WebRTC peer connection' + (useSimpleConfig ? ' (simple)' : ''));
            this.peerConnection = new RTCPeerConnection(config);
            
            this.setupConnectionHandlers();
            this.addLocalTracks();
            
            this.debug.success('PeerConnection created');
            return true;
        } catch (err) {
            this.debug.error('Failed to setup peer connection: ' + err.message);
            throw err;
        }
    }

    setupConnectionHandlers() {
        this.peerConnection.ontrack = (event) => this.handleRemoteTrack(event);
        this.peerConnection.onicecandidate = (event) => this.handleIceCandidate(event);
        this.peerConnection.onconnectionstatechange = () => this.handleConnectionStateChange();
        this.peerConnection.oniceconnectionstatechange = () => this.handleIceConnectionStateChange();
        this.peerConnection.onicegatheringstatechange = () => this.handleIceGatheringStateChange();
        this.peerConnection.addEventListener('icecandidateerror', (e) => this.handleIceCandidateError(e));
    }

    addLocalTracks() {
        this.localStream.getTracks().forEach(track => {
            this.debug.info('Adding local track: ' + track.kind);
            this.peerConnection.addTrack(track, this.localStream);
        });
    }

    handleRemoteTrack(event) {
        this.debug.success('Received remote track: ' + event.track.kind);
        
        if (!this.remoteStream) {
            this.remoteStream = new MediaStream();
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = this.remoteStream;
            }
        }
        
        this.remoteStream.addTrack(event.track);
        
        if (event.track.kind === 'video') {
            this.remoteVideoReceived = true;
            const waitingElement = document.getElementById('waitingForVideo');
            if (waitingElement) {
                waitingElement.classList.remove('show');
            }
            uiManager.setStatus('Connected!');
            this.clearConnectionTimeout();
        }
    }

    async handleIceCandidate(event) {
        if (event.candidate) {
            this.debug.info('New ICE candidate: ' + event.candidate.type);
            try {
                const path = this.isInitiator ? `rooms/${this.roomId}/callerCandidates` : `rooms/${this.roomId}/calleeCandidates`;
                await this.database.ref(path).push({ candidate: event.candidate.toJSON() });
                this.debug.success('ICE candidate sent to Firebase');
            } catch (err) {
                this.debug.error('Failed to send ICE candidate: ' + err.message);
            }
        } else {
            this.debug.info('ICE gathering complete');
        }
    }

    handleConnectionStateChange() {
        const state = this.peerConnection.connectionState;
        this.debug.warn('Connection state: ' + state);
        
        switch(state) {
            case 'connected':
                this.debug.success('WebRTC connected!');
                if (this.remoteVideoReceived) {
                    uiManager.setStatus('Connected!');
                } else {
                    uiManager.setStatus('Connected - waiting for video...');
                }
                this.clearConnectionTimeout();
                break;
            case 'connecting':
                uiManager.setStatus('Establishing connection...');
                this.setConnectionTimeout();
                break;
            case 'failed':
                this.debug.error('Connection failed!');
                this.handleConnectionFailure();
                break;
            case 'disconnected':
                this.debug.error('Connection lost');
                uiManager.setStatus('Connection lost');
                break;
        }
    }

    handleIceConnectionStateChange() {
        const state = this.peerConnection.iceConnectionState;
        this.debug.warn('ICE connection state: ' + state);
        
        switch(state) {
            case 'checking':
                uiManager.setStatus('Finding connection path...');
                break;
            case 'connected':
            case 'completed':
                if (this.remoteVideoReceived) {
                    uiManager.setStatus('Connected!');
                }
                break;
            case 'failed':
                this.debug.error('ICE connection failed');
                this.handleConnectionFailure();
                break;
            case 'disconnected':
                uiManager.setStatus('Connection interrupted');
                break;
        }
    }

    handleIceGatheringStateChange() {
        const state = this.peerConnection.iceGatheringState;
        this.debug.info('ICE gathering state: ' + state);
        
        if (state === 'gathering') {
            uiManager.setStatus('Gathering network info...');
        }
    }

    handleIceCandidateError(event) {
        const parts = [];
        if (event.errorText) parts.push(`text=${event.errorText}`);
        if (event.errorCode) parts.push(`code=${event.errorCode}`);
        if (event.url) parts.push(`url=${event.url}`);
        if (event.address) parts.push(`address=${event.address}`);
        if (event.port) parts.push(`port=${event.port}`);
        if (event.hostname) parts.push(`hostname=${event.hostname}`);
        this.debug.error('ICE candidate error: ' + (parts.join(', ') || 'Unknown'));
    }

    setConnectionTimeout() {
        this.clearConnectionTimeout();
        this.connectionTimeout = setTimeout(() => {
            if (this.peerConnection && this.peerConnection.connectionState !== 'connected') {
                this.debug.warn('Connection timeout - attempting retry');
                this.handleConnectionFailure();
            }
        }, 30000);
    }

    clearConnectionTimeout() {
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
        }
    }

    async handleConnectionFailure() {
        this.clearConnectionTimeout();
        
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            this.debug.warn(`Connection failed, retrying (${this.retryCount}/${this.maxRetries})`);
            uiManager.setStatus(`Connection failed - retrying (${this.retryCount}/${this.maxRetries})...`);
            
            setTimeout(async () => {
                try {
                    await this.restartConnection();
                } catch (err) {
                    this.debug.error('Retry failed: ' + err.message);
                    this.showFinalError();
                }
            }, 2000);
        } else {
            this.showFinalError();
        }
    }

    showFinalError() {
        this.debug.error('All connection attempts failed');
        uiManager.setStatus('Connection failed - please refresh and try again');
    }

    async restartConnection() {
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        await this.setupPeerConnection();
        
        if (this.isInitiator) {
            await this.createOffer();
        } else {
            await this.handleExistingOffer();
        }
        
        this.setupCandidateListening();
    }

    async createOffer() {
        try {
            this.debug.info('Creating offer...');
            
            // Add timeout protection for offer creation
            const offerPromise = this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Offer creation timeout')), 10000);
            });
            
            const offer = await Promise.race([offerPromise, timeoutPromise]);
            this.debug.success('Offer created successfully');
            
            this.debug.info('Setting local description...');
            const setLocalPromise = this.peerConnection.setLocalDescription(offer);
            const setLocalTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Set local description timeout')), 5000);
            });
            
            await Promise.race([setLocalPromise, setLocalTimeout]);
            this.debug.success('Local description set');
            
            this.debug.info('Storing offer in Firebase...');
            await this.database.ref(`rooms/${this.roomId}/offer`).set({
                type: offer.type,
                sdp: offer.sdp
            });
            this.debug.success('Offer stored in Firebase');
            
            this.listenForAnswer();
        } catch (err) {
            this.debug.error('Failed to create offer: ' + err.message);
            
            // Try to recover from offer creation failure
            if (err.message.includes('timeout')) {
                this.debug.warn('Offer creation timed out, attempting recovery...');
                await this.handleOfferTimeout();
            } else {
                throw err;
            }
        }
    }

    async handleOfferTimeout() {
        try {
            this.debug.info('Attempting offer creation recovery...');
            
            // Close and recreate peer connection
            if (this.peerConnection) {
                this.peerConnection.close();
            }
            
            // Wait a moment before recreating
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Recreate connection with simplified constraints
            await this.setupPeerConnection(true);
            
            // Try creating offer with basic constraints
            this.debug.info('Creating simplified offer...');
            const offer = await this.peerConnection.createOffer();
            
            await this.peerConnection.setLocalDescription(offer);
            this.debug.success('Recovery: Local description set');
            
            await this.database.ref(`rooms/${this.roomId}/offer`).set({
                type: offer.type,
                sdp: offer.sdp
            });
            this.debug.success('Recovery: Offer stored in Firebase');
            
            this.listenForAnswer();
            
        } catch (recoveryErr) {
            this.debug.error('Recovery failed: ' + recoveryErr.message);
            uiManager.setStatus('Connection failed - please refresh and try again');
            throw recoveryErr;
        }
    }

    listenForAnswer() {
        this.debug.info('Listening for answer...');
        this.database.ref(`rooms/${this.roomId}/answer`).on('value', async (snapshot) => {
            const answer = snapshot.val();
            if (answer && !this.peerConnection.currentRemoteDescription) {
                try {
                    this.debug.success('Answer received!');
                    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
                    this.debug.success('Remote description set');
                    this.remoteDescriptionSet = true;
                    await this.flushPendingCandidates();
                    uiManager.showVideoCall();
                    uiManager.setStatus('Finalizing connection...');
                } catch (err) {
                    this.debug.error('Error setting remote description: ' + err.message);
                    uiManager.setStatus('Error connecting - please try again');
                }
            }
        });
    }

    async handleExistingOffer() {
        try {
            this.debug.info('Fetching offer from Firebase...');
            const snapshot = await this.database.ref(`rooms/${this.roomId}/offer`).once('value');
            const offer = snapshot.val();
            
            if (offer) {
                this.debug.success('Offer received, creating answer...');
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
                this.debug.success('Remote description set');
                this.remoteDescriptionSet = true;
                await this.flushPendingCandidates();
                
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);
                this.debug.success('Local description set');
                
                await this.database.ref(`rooms/${this.roomId}/answer`).set({
                    type: answer.type,
                    sdp: answer.sdp
                });
                this.debug.success('Answer stored in Firebase');
                uiManager.setStatus('Finalizing connection...');
            } else {
                this.debug.error('No offer found in Firebase!');
                uiManager.setStatus('Call not found - ask for a new link');
            }
        } catch (err) {
            this.debug.error('Error handling offer: ' + err.message);
            uiManager.setStatus('Error joining call - please try again');
            throw err;
        }
    }

    setupCandidateListening() {
        this.debug.info('Listening for ICE candidates...');
        const listenPath = this.isInitiator ? `rooms/${this.roomId}/calleeCandidates` : `rooms/${this.roomId}/callerCandidates`;
        this.database.ref(listenPath).on('child_added', async (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.candidate) return;
            try {
                if (!this.remoteDescriptionSet || !this.peerConnection.currentRemoteDescription) {
                    this.pendingCandidates.push(data.candidate);
                    this.debug.info('Queued remote ICE candidate');
                } else {
                    this.debug.info('Adding remote ICE candidate');
                    await this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
                    this.debug.success('Remote ICE candidate added');
                }
            } catch (err) {
                this.debug.error('Error handling remote ICE candidate: ' + err.message);
            }
        });
    }

    setupCallEndListening() {
        this.database.ref(`rooms/${this.roomId}/ended`).on('value', (snapshot) => {
            if (snapshot.val() === true) {
                this.debug.warn('Call ended by other party');
                this.endCall(false);
            }
        });
    }

    async startCall() {
        try {
            uiManager.setStatus('Setting up connection...');
            await this.setupPeerConnection();
            
            uiManager.setStatus('Creating call offer...');
            await this.createOffer();
            
            this.setupCandidateListening();
            this.setupCallEndListening();
            
            uiManager.setStatus('Waiting for someone to join...');
        } catch (err) {
            this.debug.error('Failed to start call: ' + err.message);
            uiManager.setStatus('Failed to start call - click to retry');
            this.addRetryButton();
            throw err;
        }
    }

    addRetryButton() {
        const linkDisplay = document.getElementById('linkDisplay');
        if (linkDisplay && !document.getElementById('retryBtn')) {
            const retryBtn = document.createElement('button');
            retryBtn.id = 'retryBtn';
            retryBtn.textContent = 'Retry Connection';
            retryBtn.style.cssText = `
                background: #ff9800;
                color: white;
                border: none;
                padding: 15px 25px;
                font-size: 18px;
                border-radius: 5px;
                cursor: pointer;
                margin: 10px 5px;
                -webkit-tap-highlight-color: transparent;
            `;
            
            retryBtn.addEventListener('click', async () => {
                retryBtn.remove();
                this.debug.info('Manual retry initiated');
                try {
                    await this.startCall();
                } catch (err) {
                    this.debug.error('Manual retry failed: ' + err.message);
                }
            });
            
            linkDisplay.appendChild(retryBtn);
        }
    }

    async joinCall() {
        try {
            await this.setupPeerConnection();
            await this.handleExistingOffer();
            this.setupCandidateListening();
            this.setupCallEndListening();
        } catch (err) {
            this.debug.error('Failed to join call: ' + err.message);
            throw err;
        }
    }

    endCall(notify = true) {
        this.debug.info('Ending call, notify: ' + notify);
        
        this.clearConnectionTimeout();
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        
        if (notify && this.roomId) {
            this.database.ref(`rooms/${this.roomId}/ended`).set(true);
        }
        
        if (this.roomId && this.isInitiator) {
            setTimeout(() => {
                this.database.ref(`rooms/${this.roomId}`).remove();
            }, 5000);
        }
    }

    async flushPendingCandidates() {
        if (!this.pendingCandidates.length) return;
        this.debug.info(`Flushing ${this.pendingCandidates.length} queued ICE candidates...`);
        while (this.pendingCandidates.length) {
            const cand = this.pendingCandidates.shift();
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(cand));
            } catch (err) {
                this.debug.error('Error flushing ICE candidate: ' + err.message);
            }
        }
    }
}

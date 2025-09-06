class UIManager {
    constructor() {
        this.elements = {};
        this.statusTimeout = null;
    }

    init() {
        this.elements = {
            startScreen: document.getElementById('startScreen'),
            videoContainer: document.getElementById('videoContainer'),
            localVideo: document.getElementById('localVideo'),
            remoteVideo: document.getElementById('remoteVideo'),
            createCallBtn: document.getElementById('createCallBtn'),
            joinCallBtn: document.getElementById('joinCallBtn'),
            endCallBtn: document.getElementById('endCallBtn'),
            linkDisplay: document.getElementById('linkDisplay'),
            callLink: document.getElementById('callLink'),
            copyBtn: document.getElementById('copyBtn'),
            shareBtn: document.getElementById('shareBtn'),
            status: document.getElementById('status'),
            waitingForVideo: document.getElementById('waitingForVideo')
        };

        this.setupEventListeners();
        debugLogger.success('UI Manager initialized');
    }

    setupEventListeners() {
        if (this.elements.copyBtn) {
            this.elements.copyBtn.addEventListener('click', () => this.copyLink());
        }

        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', () => this.shareLink());
        }

        if (this.elements.endCallBtn) {
            this.elements.endCallBtn.addEventListener('click', () => this.confirmEndCall());
        }

        document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        window.addEventListener('beforeunload', () => {
            if (window.webrtcManager) {
                window.webrtcManager.endCall(true);
            }
        });
    }

    setStatus(message) {
        debugLogger.info('Status: ' + message);
        
        if (this.elements.status) {
            this.elements.status.textContent = message;
            this.elements.status.style.display = 'block';
            
            if (this.statusTimeout) {
                clearTimeout(this.statusTimeout);
            }
            
            if (message.includes('Connected') || message === '') {
                this.statusTimeout = setTimeout(() => {
                    if (this.elements.status) {
                        this.elements.status.style.display = 'none';
                    }
                }, 3000);
            }
        }
    }

    showLinkDisplay(link) {
        if (this.elements.callLink && this.elements.linkDisplay) {
            this.elements.callLink.textContent = link;
            this.elements.linkDisplay.style.display = 'block';
        }
        
        if (this.elements.createCallBtn) {
            this.elements.createCallBtn.style.display = 'none';
        }
    }

    showVideoCall() {
        if (this.elements.startScreen) {
            this.elements.startScreen.style.display = 'none';
        }
        
        if (this.elements.videoContainer) {
            this.elements.videoContainer.style.display = 'block';
        }
        
        if (this.elements.waitingForVideo) {
            this.elements.waitingForVideo.classList.add('show');
        }

        debugLogger.showPanel();
    }

    setLocalVideo(stream) {
        if (this.elements.localVideo) {
            this.elements.localVideo.srcObject = stream;
        }
    }

    copyLink() {
        const link = this.elements.callLink?.textContent;
        if (!link) return;

        debugLogger.info('Copying link: ' + link);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(() => {
                this.showCopySuccess();
            }).catch(() => {
                this.fallbackCopy(link);
            });
        } else {
            this.fallbackCopy(link);
        }
    }

    fallbackCopy(link) {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showCopySuccess();
        } catch (err) {
            debugLogger.error('Copy failed: ' + err.message);
        }
        
        document.body.removeChild(textArea);
    }

    showCopySuccess() {
        if (this.elements.copyBtn) {
            const originalText = this.elements.copyBtn.textContent;
            this.elements.copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                if (this.elements.copyBtn) {
                    this.elements.copyBtn.textContent = originalText;
                }
            }, 2000);
        }
    }

    shareLink() {
        const link = this.elements.callLink?.textContent;
        if (!link) return;

        if (navigator.share) {
            navigator.share({
                title: 'Join my video call',
                text: 'Click this link to join my video call',
                url: link
            }).catch(err => {
                debugLogger.warn('Share cancelled: ' + err.message);
            });
        } else {
            this.copyLink();
        }
    }

    confirmEndCall() {
        if (confirm('End this call?')) {
            this.endCall();
        }
    }

    endCall() {
        if (window.webrtcManager) {
            window.webrtcManager.endCall(true);
        }
        
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname;
        }, 500);
    }

    showJoinButton() {
        if (this.elements.joinCallBtn) {
            this.elements.joinCallBtn.style.display = 'block';
        }
        
        if (this.elements.createCallBtn) {
            this.elements.createCallBtn.style.display = 'none';
        }
    }
}

const uiManager = new UIManager();
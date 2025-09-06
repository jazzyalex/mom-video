class CompatibilityManager {
    constructor() {
        this.checks = {};
    }

    init() {
        this.performChecks();
        this.addPolyfills();
        debugLogger.info('Compatibility checks completed');
        this.logCapabilities();
    }

    performChecks() {
        this.checks.webrtc = !!window.RTCPeerConnection;
        this.checks.mediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        this.checks.promises = typeof Promise !== 'undefined';
        this.checks.arrow = (() => { try { eval('()=>{}'); return true; } catch(e) { return false; } })();
        this.checks.asyncAwait = (() => { try { eval('async function test(){}'); return true; } catch(e) { return false; } })();
        this.checks.firebase = typeof firebase !== 'undefined';
    }

    addPolyfills() {
        if (!navigator.mediaDevices) {
            navigator.mediaDevices = {};
        }

        if (!navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia = function(constraints) {
                const getUserMedia = navigator.webkitGetUserMedia || 
                                  navigator.mozGetUserMedia || 
                                  navigator.getUserMedia;
                
                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia not supported'));
                }
                
                return new Promise((resolve, reject) => {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            };
        }

        if (!window.RTCPeerConnection) {
            window.RTCPeerConnection = window.webkitRTCPeerConnection ||
                                     window.mozRTCPeerConnection ||
                                     window.msRTCPeerConnection;
        }

        if (!window.RTCIceCandidate) {
            window.RTCIceCandidate = window.webkitRTCIceCandidate ||
                                   window.mozRTCIceCandidate ||
                                   window.msRTCIceCandidate;
        }

        if (!window.RTCSessionDescription) {
            window.RTCSessionDescription = window.webkitRTCSessionDescription ||
                                         window.mozRTCSessionDescription ||
                                         window.msRTCSessionDescription;
        }

        if (!Array.prototype.find) {
            Array.prototype.find = function(predicate) {
                for (let i = 0; i < this.length; i++) {
                    if (predicate(this[i], i, this)) return this[i];
                }
                return undefined;
            };
        }

        if (!Array.prototype.includes) {
            Array.prototype.includes = function(searchElement) {
                return this.indexOf(searchElement) !== -1;
            };
        }
    }

    logCapabilities() {
        debugLogger.info('=== Browser Compatibility Report ===');
        debugLogger.info('WebRTC Support: ' + (this.checks.webrtc ? 'YES' : 'NO'));
        debugLogger.info('MediaDevices API: ' + (this.checks.mediaDevices ? 'YES' : 'NO'));
        debugLogger.info('Promises: ' + (this.checks.promises ? 'YES' : 'NO'));
        debugLogger.info('Arrow Functions: ' + (this.checks.arrow ? 'YES' : 'NO'));
        debugLogger.info('Async/Await: ' + (this.checks.asyncAwait ? 'YES' : 'NO'));
        debugLogger.info('Firebase: ' + (this.checks.firebase ? 'YES' : 'NO'));
        debugLogger.info('User Agent: ' + navigator.userAgent);
        debugLogger.info('================================');
    }

    isSupported() {
        return this.checks.webrtc && this.checks.mediaDevices && this.checks.promises;
    }

    showUnsupportedMessage() {
        const message = 'Your browser doesn\'t support video calling. Please try:\n\n' +
                       '• Chrome 60+\n' +
                       '• Firefox 60+\n' +
                       '• Safari 12+\n' +
                       '• Edge 79+\n\n' +
                       'Or update your current browser.';
        
        alert(message);
        debugLogger.error('Browser not supported');
        
        const body = document.body;
        if (body) {
            body.innerHTML = '<div style="padding:20px;text-align:center;color:white;background:#1a1a1a;height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;">' +
                           '<h1>Browser Not Supported</h1>' +
                           '<p style="margin:20px 0;">Your browser doesn\'t support video calling.</p>' +
                           '<p>Please try Chrome, Firefox, Safari, or Edge.</p>' +
                           '</div>';
        }
    }
}

const compatibilityManager = new CompatibilityManager();
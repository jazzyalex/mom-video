class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 50;
        this.panel = null;
        this.database = null;
        this.sessionId = null;
        this.cloudPath = null;
        this.cloudLogging = false;
        this.roomId = null;
        this.role = null;
    }

    init() {
        this.panel = document.getElementById('debugPanel');
        const debugToggle = document.getElementById('debugToggle');
        
        if (debugToggle) {
            // Keep toggle functional when URL has ?debug=1; otherwise leave hidden
            debugToggle.addEventListener('click', () => this.togglePanel());
        }

        if (new URLSearchParams(location.search).get('debug') === '1') {
            setTimeout(() => this.showPanel(), 100);
        }

        this.log('Debug system initialized', 'success');
        this.log('App Version: ' + APP_VERSION, 'info');
        this.log('WebRTC supported: ' + !!window.RTCPeerConnection, 'info');
        this.log('Browser: ' + navigator.userAgent.substring(0, 60), 'info');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] ${message}`;
        
        console.log(`[${type.toUpperCase()}]`, logEntry);
        
        this.logs.push({ message: logEntry, type });
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        this.updatePanel();

        // Push to Firebase if enabled
        if (this.cloudLogging && this.database && this.cloudPath) {
            try {
                this.database.ref(`${this.cloudPath}/entries`).push({
                    ts: Date.now(),
                    type,
                    message: logEntry
                });
            } catch (_) { /* best-effort logging */ }
        }
    }

    togglePanel() {
        if (this.panel) {
            this.panel.classList.toggle('show');
            const toggle = document.getElementById('debugToggle');
            if (toggle) {
                toggle.textContent = this.panel.classList.contains('show') ? 
                    'Hide Debug Info' : 'Show Debug Info';
            }
            this.updatePanel();
        }
    }

    showPanel() {
        if (this.panel) {
            this.panel.classList.add('show');
            this.updatePanel();
        }
    }

    updatePanel() {
        if (this.panel && this.panel.classList.contains('show')) {
            this.panel.innerHTML = this.logs.map(log => 
                `<div class="${log.type}">${log.message}</div>`
            ).reverse().join('');
        }
    }

    error(message) { this.log(message, 'error'); }
    success(message) { this.log(message, 'success'); }
    warn(message) { this.log(message, 'warn'); }
    info(message) { this.log(message, 'info'); }

    // Attach Firebase database for cloud logging
    attachDatabase(database) {
        this.database = database;
        if (!this.sessionId) {
            this.sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
        }
        this.cloudPath = `sessions/${this.sessionId}`;
        this.cloudLogging = true;
        // Write metadata
        try {
            this.database.ref(this.cloudPath).set({
                meta: {
                    appVersion: APP_VERSION,
                    userAgent: navigator.userAgent,
                    createdAt: Date.now(),
                    roomId: this.roomId || null,
                    role: this.role || null
                }
            });
        } catch (_) { /* ignore */ }
        // Flush existing logs
        try {
            const batch = this.logs.map(l => ({ ts: Date.now(), type: l.type, message: l.message }));
            batch.forEach(entry => this.database.ref(`${this.cloudPath}/entries`).push(entry));
        } catch (_) { /* ignore */ }
        console.log('[DEBUG] Log session:', this.sessionId);
    }

    setRoomId(roomId) {
        this.roomId = roomId;
        if (this.cloudLogging && this.database && this.cloudPath) {
            try { this.database.ref(`${this.cloudPath}/meta/roomId`).set(roomId); } catch (_) {}
        }
    }

    setRole(role) {
        this.role = role;
        if (this.cloudLogging && this.database && this.cloudPath) {
            try { this.database.ref(`${this.cloudPath}/meta/role`).set(role); } catch (_) {}
        }
    }
}

const debugLogger = new DebugLogger();

class DebugLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 50;
        this.panel = null;
    }

    init() {
        this.panel = document.getElementById('debugPanel');
        const debugToggle = document.getElementById('debugToggle');
        
        if (debugToggle) {
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
}

const debugLogger = new DebugLogger();
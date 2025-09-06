# Simple Video Call App

## Features
- One-click video calling
- Works on old Android browsers (6+ years old)
- No registration or login required
- Simple link sharing
- Full-screen video with picture-in-picture
- Confirmation before ending call

## Quick Setup

### Option 1: Use the Test Firebase (Immediate Testing)
The app is pre-configured with a test Firebase project. You can use it immediately for testing:
1. Open `index.html` in a web browser
2. Click "Start New Call"
3. Share the generated link
4. Both parties join using the link

**Note:** For production use, create your own Firebase project (see Option 2).

### Option 2: Create Your Own Firebase (Recommended for Production)

1. **Create Firebase Project** (Free)
   - Go to https://console.firebase.google.com
   - Click "Create Project"
   - Name it (e.g., "mom-video-call")
   - Disable Google Analytics (not needed)
   - Click "Create Project"

2. **Enable Realtime Database**
   - In Firebase Console, click "Realtime Database" in left menu
   - Click "Create Database"
   - Choose "Start in test mode" (for easy setup)
   - Select your region
   - Click "Enable"

3. **Get Your Config**
   - Go to Project Settings (gear icon)
   - Scroll to "Your apps" section
   - Click "Web" icon (</>)
   - Register app with a nickname
   - Copy the firebaseConfig object

4. **Update the App**
   - Open `index.html`
   - Replace the firebaseConfig object with your config
   - Ensure `databaseURL` matches your Realtime Database URL (looks like `https://<your-project>-default-rtdb.firebaseio.com`)

## Deployment Options

### Easiest: GitHub Pages (Free)
1. Create a GitHub account
2. Create new repository
3. Upload `index.html`
4. Go to Settings → Pages
5. Source: Deploy from branch (main)
6. Your app will be at: `https://[username].github.io/[repo-name]`

### Alternative: Netlify (Free)
1. Go to https://app.netlify.com
2. Drag and drop the `video-call-app` folder
3. Get instant URL

### Alternative: Vercel (Free)
1. Go to https://vercel.com
2. Import project
3. Deploy

## Usage Instructions for Your Mom

1. **First Time Setup:**
   - Open the link you send her
   - When prompted, tap "Allow" for camera and microphone
   - The browser should remember this choice

2. **Making a Call:**
   - You create a call and send her the link via WhatsApp/SMS
   - She taps the link
   - She taps the big "Join Call" button
   - Video starts automatically

3. **During Call:**
   - Full screen shows the other person
   - Small window shows herself
   - Red "End Call" button at bottom

4. **Ending Call:**
   - Tap "End Call"
   - Confirm "Yes" when asked
   - Page returns to start

## Browser Compatibility
- Chrome 50+ (2016)
- Firefox 45+ (2016)
- Safari 11+ (2017)
- Chrome Android 50+ (2016)
- Samsung Internet 5+ (2016)

## Troubleshooting

**Camera/Mic not working:**
- Check browser permissions in phone settings
- Try closing and reopening browser
- Make sure no other app is using camera

**Connection issues:**
- Both people need good internet (WiFi preferred)
- Try refreshing the page
- Create a new call link
 - If calls don’t connect on cellular, add a TURN server (required for some networks).

**TURN (recommended for reliability):**
- WebRTC needs a TURN server to relay media when direct connection isn’t possible (e.g., carrier NAT, strict firewalls).
- Options: Twilio/Nexus/TykTurn or self-host coturn. Add credentials to the `iceServers` array in `index.html`.

**Old Android specific:**
- Use Chrome or Samsung Internet browser
- Avoid Firefox on old Android (may have issues)
- Update Chrome if possible via Play Store

## Technical Notes
- Uses WebRTC for peer-to-peer video
- Firebase Realtime Database for signaling (minimal data usage)
- Free Google STUN servers for NAT traversal
- No video recording or storage
- Completely private peer-to-peer connection

## Cost
- **Hosting:** Free (GitHub Pages/Netlify/Vercel)
- **Firebase:** Free tier includes:
  - 1GB storage
  - 10GB/month transfer
  - Supports thousands of calls/month
- **STUN servers:** Free (Google public servers)

Total monthly cost: **$0**

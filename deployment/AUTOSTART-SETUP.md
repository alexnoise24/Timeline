# Server Autostart Setup Guide

This guide will help you set up automatic startup for your Timeline server when your system reboots.

## macOS Setup (Using launchd)

### Prerequisites
- Node.js installed (verify with `which node`)
- All dependencies installed (`npm install` in backend directory)
- `.env` file configured with all necessary environment variables

### Installation Steps

1. **Update the plist file with your correct paths:**
   
   Edit `deployment/com.timeline.server.plist` and verify:
   - `WorkingDirectory` points to your backend folder
   - Node path is correct (run `which node` to verify)

2. **Copy the plist file to LaunchAgents:**
   ```bash
   cp deployment/com.timeline.server.plist ~/Library/LaunchAgents/
   ```

3. **Load the service:**
   ```bash
   launchctl load ~/Library/LaunchAgents/com.timeline.server.plist
   ```

4. **Start the service immediately:**
   ```bash
   launchctl start com.timeline.server
   ```

### Management Commands

- **Check status:**
  ```bash
  launchctl list | grep timeline
  ```

- **View logs:**
  ```bash
  tail -f /tmp/timeline-server.log
  tail -f /tmp/timeline-server-error.log
  ```

- **Stop the service:**
  ```bash
  launchctl stop com.timeline.server
  ```

- **Unload the service (disable autostart):**
  ```bash
  launchctl unload ~/Library/LaunchAgents/com.timeline.server.plist
  ```

- **Reload after changes:**
  ```bash
  launchctl unload ~/Library/LaunchAgents/com.timeline.server.plist
  launchctl load ~/Library/LaunchAgents/com.timeline.server.plist
  ```

---

## Linux/Ubuntu Setup (Using systemd)

### Prerequisites
- Node.js installed system-wide
- Application deployed to `/var/www/Timeline/backend` (or update the path in service file)
- `.env` file in backend directory
- MongoDB service running

### Installation Steps

1. **Update the service file:**
   
   Edit `deployment/timeline-server.service` and update:
   - `WorkingDirectory` to match your deployment path
   - `User` to match your deployment user (default: www-data)
   - Node path if different (run `which node` to verify)

2. **Copy the service file:**
   ```bash
   sudo cp deployment/timeline-server.service /etc/systemd/system/
   ```

3. **Reload systemd:**
   ```bash
   sudo systemctl daemon-reload
   ```

4. **Enable the service (autostart on boot):**
   ```bash
   sudo systemctl enable timeline-server
   ```

5. **Start the service:**
   ```bash
   sudo systemctl start timeline-server
   ```

### Management Commands

- **Check status:**
  ```bash
  sudo systemctl status timeline-server
  ```

- **View logs:**
  ```bash
  sudo journalctl -u timeline-server -f
  ```

- **Stop the service:**
  ```bash
  sudo systemctl stop timeline-server
  ```

- **Restart the service:**
  ```bash
  sudo systemctl restart timeline-server
  ```

- **Disable autostart:**
  ```bash
  sudo systemctl disable timeline-server
  ```

- **Reload after configuration changes:**
  ```bash
  sudo systemctl daemon-reload
  sudo systemctl restart timeline-server
  ```

---

## Environment Variables

Make sure your `.env` file contains all required variables:

```env
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=your_secret_key
NODE_ENV=production
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

**Important for macOS:** launchd doesn't automatically load `.env` files. You have two options:

### Option 1: Add variables to plist (Recommended)
Update the `EnvironmentVariables` section in `com.timeline.server.plist`:

```xml
<key>EnvironmentVariables</key>
<dict>
    <key>NODE_ENV</key>
    <string>production</string>
    <key>PORT</key>
    <string>5000</string>
    <key>MONGODB_URI</key>
    <string>your_mongodb_uri</string>
    <key>JWT_SECRET</key>
    <string>your_jwt_secret</string>
</dict>
```

### Option 2: Create a wrapper script
Create `backend/start-server.sh`:

```bash
#!/bin/bash
cd "$(dirname "$0")"
source .env
exec node server.js
```

Then update the plist to use this script instead:
```xml
<key>ProgramArguments</key>
<array>
    <string>/bin/bash</string>
    <string>start-server.sh</string>
</array>
```

---

## Troubleshooting

### Server won't start
1. Check logs for errors
2. Verify Node.js path: `which node`
3. Test server manually: `cd backend && node server.js`
4. Check permissions on working directory
5. Verify `.env` file exists and has correct values

### MongoDB connection fails
- Ensure MongoDB is running and accessible
- Verify MONGODB_URI in environment variables
- Check MongoDB service status

### Port already in use
- Check if another instance is running: `lsof -i :5000`
- Kill the process: `kill -9 <PID>`
- Or change PORT in environment variables

### Changes not taking effect
- After modifying service files, reload the service
- On macOS: `launchctl unload` then `launchctl load`
- On Linux: `systemctl daemon-reload` then `systemctl restart`

---

## Security Notes

1. **Never commit** `.env` files or service files with sensitive data
2. For production, use proper secret management
3. Consider using PM2 as an alternative with built-in monitoring:
   ```bash
   npm install -g pm2
   pm2 start backend/server.js --name timeline-server
   pm2 save
   pm2 startup
   ```

---

## Testing

After setup, test the autostart:

1. Start the service
2. Verify it's running: `curl http://localhost:5000/api/health`
3. Reboot your system
4. Check if service auto-started after reboot
5. Verify logs for any startup errors

---

## Alternative: PM2 (Recommended for production)

PM2 is a production-grade process manager with built-in monitoring, log management, and autostart:

```bash
# Install PM2 globally
npm install -g pm2

# Start your server
cd backend
pm2 start server.js --name timeline-server

# Save the process list
pm2 save

# Setup startup script (runs automatically on boot)
pm2 startup

# This will output a command to run, execute it
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# View logs
pm2 logs timeline-server

# Monitor
pm2 monit

# Restart
pm2 restart timeline-server
```

PM2 provides automatic restart on crashes, better logging, and easier management.

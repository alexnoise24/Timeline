# 🚀 Complete Migration Guide to Ubuntu Server

This guide will walk you through migrating your Timeline app from Netlify/MongoDB Atlas to your own Ubuntu server.

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ Ubuntu Server 20.04 or 22.04 (running on your PC)
- ✅ Root/sudo access to the server
- ✅ SSH access configured
- ✅ A domain name (or subdomain) pointed to your server's IP
- ✅ Your Firebase credentials ready
- ✅ At least 4GB RAM and 2 CPU cores (8GB/4 cores recommended)

## 🎯 Migration Overview

**What we'll do:**
1. Set up server dependencies (Node.js, MongoDB, Nginx, PM2)
2. Deploy your backend API
3. Deploy your frontend
4. Configure Nginx as reverse proxy
5. Set up SSL certificate (HTTPS)
6. Configure environment variables
7. Test everything

**Time required:** 30-45 minutes

---

## Step 1: Configure Deployment Scripts

### 1.1 Update Server Information

Edit `deployment/deploy-to-server.sh` and change these values:

```bash
SERVER_USER="your_username"           # Your Ubuntu username
SERVER_IP="192.168.1.100"            # Your server IP address
SERVER_PATH="/var/www/timeline"       # Leave as is
DOMAIN="timeline.yourdomain.com"      # Your domain or subdomain
```

### 1.2 Configure DNS (If Using a Domain)

Point your domain to your server's IP:

**For Subdomain (Recommended):**
```
Type: A Record
Host: timeline (or @)
Value: Your server's IP address
TTL: 3600
```

**Note:** DNS propagation can take 5-60 minutes.

---

## Step 2: Prepare Your Local Machine

### 2.1 Install Dependencies Locally

```bash
# In the project root
cd /Volumes/T7/Web\ APP/Timeline

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2.2 Configure Environment Variables

**Frontend Environment:**

Create or update `frontend/.env`:

```bash
VITE_API_URL=https://timeline.yourdomain.com/api
VITE_SOCKET_URL=https://timeline.yourdomain.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=moment-weaver-66582.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=moment-weaver-66582
VITE_FIREBASE_STORAGE_BUCKET=moment-weaver-66582.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=110581331447
VITE_FIREBASE_APP_ID=1:110581331447:web:c6c8c69163f713ecf42af2
VITE_FIREBASE_VAPID_KEY=your_vapid_key
```

> See `deployment/ENV-SETUP.md` for detailed Firebase setup instructions.

### 2.3 Test SSH Connection

```bash
ssh your_username@your_server_ip
```

If this works, you're ready to proceed!

---

## Step 3: Set Up the Server

### 3.1 Copy Setup Script to Server

```bash
# From your local machine
scp deployment/server-setup.sh your_username@your_server_ip:~/
```

### 3.2 SSH into Server and Run Setup

```bash
ssh your_username@your_server_ip

# Run the setup script
sudo bash server-setup.sh
```

This will install:
- Node.js 20.x
- MongoDB 7.0
- Nginx
- PM2
- Git
- UFW Firewall
- Certbot (for SSL)

**Time:** 5-10 minutes

---

## Step 4: Deploy Your Application

### 4.1 Run Deployment Script

From your **local machine**:

```bash
cd /Volumes/T7/Web\ APP/Timeline
bash deployment/deploy-to-server.sh
```

This script will:
1. Build your frontend
2. Package backend and frontend
3. Upload to server via rsync
4. Install backend dependencies
5. Configure PM2
6. Set up Nginx

**Time:** 5-10 minutes

---

## Step 5: Configure Environment Variables

### 5.1 SSH into Server

```bash
ssh your_username@your_server_ip
```

### 5.2 Edit Backend Environment

```bash
nano /var/www/timeline/backend/.env
```

**Required changes:**

```bash
# Generate a strong JWT secret (or use: openssl rand -base64 32)
JWT_SECRET=your_super_secure_random_string_here

# Update with your domain
FRONTEND_URL=https://timeline.yourdomain.com

# MongoDB (default is fine for local MongoDB)
MONGODB_URI=mongodb://localhost:27017/wedding-timeline

# Firebase Admin (see ENV-SETUP.md for options)
# Option 1: Leave empty and upload service account file to backend/config/
# Option 2: Paste entire JSON as single line
FIREBASE_SERVICE_ACCOUNT=
```

Save: `Ctrl+X`, `Y`, `Enter`

### 5.3 Upload Firebase Service Account (If using file method)

From your **local machine**:

```bash
# Upload Firebase service account JSON
scp /path/to/firebase-service-account.json your_username@your_server_ip:/var/www/timeline/backend/config/
```

### 5.4 Restart Backend

```bash
pm2 restart timeline-api
pm2 logs timeline-api
```

Look for: `✅ Conectado a MongoDB` and `🚀 Servidor corriendo en puerto 5000`

---

## Step 6: Set Up SSL Certificate (HTTPS)

### 6.1 Ensure DNS is Propagated

Test your domain:

```bash
ping timeline.yourdomain.com
```

Should return your server's IP.

### 6.2 Get SSL Certificate

On your **server**:

```bash
sudo certbot --nginx -d timeline.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended: Yes)

**Time:** 1-2 minutes

### 6.3 Test HTTPS

Visit: `https://timeline.yourdomain.com`

You should see your app with a secure lock icon! 🔒

---

## Step 7: Update CORS and Frontend URL

### 7.1 Update Backend CORS Settings

```bash
nano /var/www/timeline/backend/server.js
```

Find the `allowedOrigins` array and update:

```javascript
const allowedOrigins = [
  'https://timeline.yourdomain.com',  // Your production domain
  'http://localhost:5173'              // Keep for local development
];
```

Save and restart:

```bash
pm2 restart timeline-api
```

### 7.2 Update Frontend Config (if needed)

The frontend was built with the environment variables you set earlier. If you need to change them:

1. Update `frontend/.env` locally
2. Run `bash deployment/deploy-to-server.sh` again

---

## Step 8: Verification & Testing

### 8.1 Check All Services

```bash
# Check PM2
pm2 status
# Should show: timeline-api | online

# Check Nginx
sudo systemctl status nginx
# Should show: active (running)

# Check MongoDB
sudo systemctl status mongod
# Should show: active (running)

# Check logs
pm2 logs timeline-api --lines 50
```

### 8.2 Test Your App

1. **Homepage:** `https://timeline.yourdomain.com`
2. **Register:** Create a test account
3. **Login:** Test authentication
4. **Create Timeline:** Test main functionality
5. **Socket.io:** Check real-time updates
6. **Notifications:** Test push notification permission

### 8.3 Test from Mobile

Open your domain on your phone to verify mobile responsiveness and PWA functionality.

---

## 🎉 Success! Your App is Live

Your Timeline app is now running on your own server!

**What you've achieved:**
- ✅ Self-hosted frontend (was on Netlify)
- ✅ Self-hosted backend
- ✅ Self-hosted database (was on MongoDB Atlas)
- ✅ SSL certificate (HTTPS)
- ✅ Process management (auto-restart on crash)
- ✅ Reverse proxy (Nginx)

**Only external dependency:** Firebase (for push notifications)

---

## 📊 Monitoring & Maintenance

### Daily Monitoring

```bash
# Check app status
pm2 status

# View logs
pm2 logs timeline-api --lines 100

# Check server resources
htop  # or: top

# Check disk space
df -h
```

### Useful Commands

```bash
# Restart app
pm2 restart timeline-api

# Stop app
pm2 stop timeline-api

# View detailed info
pm2 show timeline-api

# Clear logs
pm2 flush

# Restart Nginx
sudo systemctl restart nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# MongoDB shell
mongosh mongodb://localhost:27017/wedding-timeline
```

### Backup Strategy

**Database Backup:**

```bash
# Create backup script
nano ~/backup-timeline.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/your_username/backups"
mkdir -p $BACKUP_DIR
mongodump --db wedding-timeline --out $BACKUP_DIR/timeline-$(date +%Y%m%d-%H%M%S)
# Keep only last 7 backups
ls -t $BACKUP_DIR | tail -n +8 | xargs -I {} rm -rf $BACKUP_DIR/{}
```

```bash
chmod +x ~/backup-timeline.sh

# Add to crontab (run daily at 2 AM)
crontab -e
# Add: 0 2 * * * /home/your_username/backup-timeline.sh
```

**File Backup:**

```bash
# Backup entire app directory
tar -czf timeline-backup-$(date +%Y%m%d).tar.gz /var/www/timeline
```

### Updates & Redeployment

When you make changes:

1. Update your code locally
2. Run `bash deployment/deploy-to-server.sh`
3. Script will rebuild, upload, and restart automatically

---

## 🐛 Troubleshooting

### App Not Loading

```bash
# Check if backend is running
pm2 status
pm2 logs timeline-api

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check if port 5000 is open
sudo netstat -tlnp | grep 5000
```

### Database Connection Issues

```bash
# Check MongoDB is running
sudo systemctl status mongod

# Try connecting
mongosh mongodb://localhost:27017/wedding-timeline

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

### Socket.io Not Working

- Ensure WebSocket connections are allowed through firewall
- Check Nginx WebSocket configuration
- Verify CORS settings include your domain

### SSL Certificate Issues

```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

### High Memory Usage

```bash
# Check processes
htop

# Reduce PM2 instances
pm2 scale timeline-api 1  # Run only 1 instance

# Restart with lower memory limit
pm2 restart timeline-api --max-memory-restart 300M
```

---

## 📚 Additional Resources

- **PM2 Documentation:** https://pm2.keymetrics.io/docs/
- **Nginx Documentation:** https://nginx.org/en/docs/
- **MongoDB Documentation:** https://docs.mongodb.com/
- **Let's Encrypt:** https://letsencrypt.org/docs/

---

## 🆘 Need Help?

1. Check logs: `pm2 logs timeline-api`
2. Review `deployment/ENV-SETUP.md`
3. Test each component individually
4. Check firewall: `sudo ufw status`

---

## 🎯 Next Steps

- [ ] Set up automated backups
- [ ] Configure monitoring (e.g., pm2.io)
- [ ] Set up log rotation
- [ ] Configure fail2ban for security
- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline

Enjoy your self-hosted Timeline app! 🎊

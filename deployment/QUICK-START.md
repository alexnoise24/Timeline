# ⚡ Quick Start Guide - 15 Minutes

Fast-track migration guide for experienced users.

## 📦 What You Get

- Self-hosted frontend + backend
- Local MongoDB database
- Nginx reverse proxy with SSL
- PM2 process management
- 99% independent (only Firebase for push notifications)

## 🚀 3-Step Deployment

### Step 1: Configure (2 min)

```bash
# Edit deploy script
nano deployment/deploy-to-server.sh

# Change these:
SERVER_USER="your_username"
SERVER_IP="192.168.1.100"  
DOMAIN="timeline.yourdomain.com"

# Create frontend env
cat > frontend/.env << EOF
VITE_API_URL=https://timeline.yourdomain.com/api
VITE_SOCKET_URL=https://timeline.yourdomain.com
VITE_FIREBASE_API_KEY=AIzaSyAp4cELjeAhey_-RtJ26ehQtI0WOXSPoqU
VITE_FIREBASE_AUTH_DOMAIN=moment-weaver-66582.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=moment-weaver-66582
VITE_FIREBASE_STORAGE_BUCKET=moment-weaver-66582.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=110581331447
VITE_FIREBASE_APP_ID=1:110581331447:web:c6c8c69163f713ecf42af2
VITE_FIREBASE_VAPID_KEY=your_vapid_key
EOF
```

### Step 2: Setup Server (8 min)

```bash
# Copy and run setup script
scp deployment/server-setup.sh your_username@your_server_ip:~/
ssh your_username@your_server_ip "sudo bash ~/server-setup.sh"

# Installs: Node.js, MongoDB, Nginx, PM2, Certbot
```

### Step 3: Deploy (5 min)

```bash
# Deploy from local machine
bash deployment/deploy-to-server.sh

# Configure backend
ssh your_username@your_server_ip
nano /var/www/timeline/backend/.env

# Set:
# - JWT_SECRET (generate with: openssl rand -base64 32)
# - FRONTEND_URL=https://timeline.yourdomain.com

pm2 restart timeline-api

# Setup SSL
sudo certbot --nginx -d timeline.yourdomain.com
```

## ✅ Verify

```bash
# Check services
pm2 status              # Backend should be online
sudo systemctl status mongod   # MongoDB active
sudo systemctl status nginx    # Nginx active

# Test
curl https://timeline.yourdomain.com
curl https://timeline.yourdomain.com/api/health
```

## 🔧 Common Tasks

```bash
# View logs
pm2 logs timeline-api

# Restart app
pm2 restart timeline-api

# Redeploy after changes
bash deployment/deploy-to-server.sh

# Database backup
mongodump --db wedding-timeline --out ~/backup

# Check resources
htop
```

## 📂 File Structure on Server

```
/var/www/timeline/
├── backend/
│   ├── server.js
│   ├── .env          # ⚠️ Configure this!
│   └── config/
│       └── firebase-service-account.json
├── frontend/
│   └── dist/         # Built files
└── deployment/
    └── (scripts)

/etc/nginx/sites-available/timeline  # Nginx config
```

## ⚙️ Key Configuration Files

### Backend .env
```bash
PORT=5000
NODE_ENV=production
JWT_SECRET=your_random_32_char_string
MONGODB_URI=mongodb://localhost:27017/wedding-timeline
FRONTEND_URL=https://timeline.yourdomain.com
FIREBASE_SERVICE_ACCOUNT=  # Or use file in config/
```

### Backend CORS (server.js)
```javascript
const allowedOrigins = [
  'https://timeline.yourdomain.com',
  'http://localhost:5173'  // For local dev
];
```

### Nginx (/etc/nginx/sites-available/timeline)
- Serves frontend static files from `frontend/dist`
- Proxies `/api` to `localhost:5000`
- Proxies `/socket.io` to `localhost:5000`
- SSL configured by Certbot

## 🔥 Firebase Setup

1. **Get VAPID Key:**
   - Firebase Console → Cloud Messaging → Web Push Certificates → Generate

2. **Service Account:**
   - Firebase Console → Settings → Service Accounts → Generate Private Key
   - Upload to: `/var/www/timeline/backend/config/firebase-service-account.json`

## 🚨 Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | `pm2 restart timeline-api` |
| MongoDB connection failed | `sudo systemctl restart mongod` |
| CORS errors | Update `allowedOrigins` in `backend/server.js` |
| SSL not working | Check DNS, run certbot again |
| Can't SSH | Check firewall: `sudo ufw allow OpenSSH` |

**Full troubleshooting:** See `TROUBLESHOOTING.md`

## 📚 Full Documentation

- **Complete Guide:** `MIGRATION-GUIDE.md` (detailed step-by-step)
- **Environment Setup:** `ENV-SETUP.md` (all configuration)
- **Troubleshooting:** `TROUBLESHOOTING.md` (common issues)
- **Checklist:** `CHECKLIST.md` (track progress)

## 🎯 Architecture

```
Internet → Nginx (80/443)
           ├─→ Static Files (frontend/dist)
           ├─→ /api → Backend (5000) → MongoDB (27017)
           └─→ /socket.io → Backend (5000)
                           └─→ Firebase (push)
```

## 💡 Pro Tips

- Use strong JWT_SECRET: `openssl rand -base64 32`
- Set up automated backups (see MIGRATION-GUIDE.md)
- Monitor with: `pm2 monit`
- Check logs regularly: `pm2 logs timeline-api`
- Set up log rotation
- Enable MongoDB auth for production

## 🔒 Security Checklist

- [ ] Firewall enabled (ports 22, 80, 443 only)
- [ ] SSL certificate active
- [ ] Strong JWT_SECRET
- [ ] MongoDB authentication (optional but recommended)
- [ ] Regular backups configured
- [ ] Updated CORS origins to production domain only

## 🎊 You're Done!

Visit: `https://timeline.yourdomain.com`

Your app is now:
- ✅ Self-hosted on your server
- ✅ Secure with HTTPS
- ✅ Auto-restarting on crash
- ✅ Backed by your own database
- ✅ 99% independent (only Firebase for notifications)

---

**Need help?** Check `TROUBLESHOOTING.md` or run: `pm2 logs timeline-api`

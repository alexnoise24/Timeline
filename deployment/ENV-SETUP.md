# Environment Configuration Guide

This guide explains how to configure environment variables for your Timeline app on the server.

## Backend Environment Variables

Location: `/var/www/timeline/backend/.env`

### Required Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/wedding-timeline

# JWT Configuration (IMPORTANT: Change this to a strong random string!)
JWT_SECRET=your_super_secure_jwt_secret_here_change_this_in_production

# Frontend URL (update after domain setup)
FRONTEND_URL=https://yourdomain.com

# Firebase Admin SDK for Push Notifications
# Option 1: Use local file (easier)
# Place your firebase-service-account.json in /var/www/timeline/backend/config/
# FIREBASE_SERVICE_ACCOUNT=

# Option 2: Use environment variable (recommended for production)
# Copy the entire content of your firebase-service-account.json as a single line
# FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

### How to Edit

1. SSH into your server:
   ```bash
   ssh your_username@your_server_ip
   ```

2. Edit the .env file:
   ```bash
   nano /var/www/timeline/backend/.env
   ```

3. Make your changes, then save (Ctrl+X, Y, Enter)

4. Restart the backend:
   ```bash
   pm2 restart timeline-api
   ```

## Frontend Environment Variables

The frontend uses build-time environment variables. If you need to change them:

### Local Build (before deployment)

Location: `/frontend/.env`

```bash
# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_vapid_key

# Backend API URL
VITE_API_URL=https://yourdomain.com/api
VITE_SOCKET_URL=https://yourdomain.com
```

After changing frontend env variables, you need to rebuild and redeploy:
```bash
cd frontend
npm run build
# Then copy dist folder to server or run deploy script again
```

## Firebase Setup

### 1. Firebase Project Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (moment-weaver-66582)
3. Go to Project Settings > General
4. Copy the Firebase SDK configuration
5. Add these values to your frontend `.env` file

### 2. Firebase Admin SDK (for Backend)

**Option A: Using Service Account File (Easier)**

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. Upload to server:
   ```bash
   scp firebase-service-account.json your_username@your_server_ip:/var/www/timeline/backend/config/
   ```
5. Leave `FIREBASE_SERVICE_ACCOUNT` empty in `.env`

**Option B: Using Environment Variable (More Secure)**

1. Open the downloaded JSON file
2. Copy the entire content
3. Convert to single line (remove line breaks)
4. Add to `.env`:
   ```bash
   FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"moment-weaver-66582",...}'
   ```

### 3. VAPID Key (for Web Push)

1. In Firebase Console, go to Project Settings > Cloud Messaging
2. Under "Web Push certificates", click "Generate key pair"
3. Copy the key
4. Add to frontend `.env`:
   ```bash
   VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
   ```

## MongoDB Configuration

### Using Local MongoDB

```bash
MONGODB_URI=mongodb://localhost:27017/wedding-timeline
```

### Using MongoDB Atlas (Cloud)

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wedding-timeline?retryWrites=true&w=majority
```

### Creating MongoDB User (Local)

```bash
# Connect to MongoDB
mongosh

# Switch to your database
use wedding-timeline

# Create admin user
db.createUser({
  user: "timeline_admin",
  pwd: "secure_password_here",
  roles: ["readWrite", "dbAdmin"]
})

# Update .env with authentication
MONGODB_URI=mongodb://timeline_admin:secure_password_here@localhost:27017/wedding-timeline
```

## Security Checklist

- [ ] Changed JWT_SECRET to a strong random string
- [ ] Updated FRONTEND_URL to your actual domain
- [ ] Configured Firebase credentials
- [ ] Set MongoDB with authentication
- [ ] Restricted CORS origins to your domain only
- [ ] Set up SSL certificate
- [ ] Configured firewall rules

## Quick Reference Commands

```bash
# Restart backend after env changes
pm2 restart timeline-api

# View logs
pm2 logs timeline-api

# Check environment variables are loaded
pm2 env 0

# Test MongoDB connection
mongosh mongodb://localhost:27017/wedding-timeline

# Check Nginx status
sudo systemctl status nginx

# Reload Nginx after config changes
sudo systemctl reload nginx
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs timeline-api --lines 100

# Common issues:
# - JWT_SECRET not set
# - MongoDB connection failed
# - Port 5000 already in use
```

### Push notifications not working
```bash
# Check Firebase credentials
# - FIREBASE_SERVICE_ACCOUNT is set correctly
# - Service account file exists and is valid
# - Firebase project has Cloud Messaging enabled
```

### Can't connect to MongoDB
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Test connection
mongosh mongodb://localhost:27017/wedding-timeline

# Check firewall
sudo ufw status
```

# 🔧 Troubleshooting Guide

Common issues and their solutions during Timeline app deployment.

## 🚨 Deployment Issues

### ❌ "Cannot connect to server"

**Symptoms:** SSH connection fails or times out

**Solutions:**
```bash
# 1. Check if server is reachable
ping your_server_ip

# 2. Check if SSH service is running (on server)
sudo systemctl status ssh

# 3. Check firewall allows SSH
sudo ufw status
sudo ufw allow OpenSSH

# 4. Verify SSH port (default 22)
netstat -tlnp | grep :22
```

### ❌ "Permission denied" during deployment

**Symptoms:** rsync or file operations fail

**Solutions:**
```bash
# 1. Check ownership of target directory (on server)
ls -la /var/www/timeline

# 2. Fix ownership
sudo chown -R your_username:your_username /var/www/timeline

# 3. Check write permissions
sudo chmod -R 755 /var/www/timeline
```

### ❌ "Port 5000 already in use"

**Symptoms:** Backend won't start, port conflict

**Solutions:**
```bash
# 1. Find what's using the port
sudo lsof -i :5000

# 2. Kill the process (if safe to do so)
sudo kill -9 <PID>

# OR change port in backend/.env
PORT=5001  # Use different port

# 3. Update Nginx config to match new port
sudo nano /etc/nginx/sites-available/timeline
# Change proxy_pass http://localhost:5001;
```

---

## 🗄️ Database Issues

### ❌ MongoDB won't start

**Symptoms:** `mongod.service failed to start`

**Solutions:**
```bash
# 1. Check MongoDB status
sudo systemctl status mongod

# 2. Check logs
sudo tail -f /var/log/mongodb/mongod.log

# 3. Check disk space
df -h

# 4. Check if data directory exists and has correct permissions
sudo ls -la /var/lib/mongodb
sudo chown -R mongodb:mongodb /var/lib/mongodb

# 5. Restart MongoDB
sudo systemctl restart mongod
```

### ❌ "MongoServerError: Authentication failed"

**Symptoms:** Backend can't connect to MongoDB

**Solutions:**
```bash
# 1. Check connection string in .env
# If using auth:
MONGODB_URI=mongodb://username:password@localhost:27017/wedding-timeline

# If NOT using auth (local dev):
MONGODB_URI=mongodb://localhost:27017/wedding-timeline

# 2. Test connection
mongosh mongodb://localhost:27017/wedding-timeline

# 3. Verify user exists in MongoDB
mongosh
use wedding-timeline
db.getUsers()
```

### ❌ Database is empty after migration

**Symptoms:** No data showing in app

**Solutions:**
```bash
# 1. Check if database exists
mongosh
show dbs

# 2. Check collections
use wedding-timeline
show collections

# 3. If migrating from Atlas, restore backup
mongorestore --db wedding-timeline /path/to/backup

# 4. Or export from Atlas and import
mongoimport --db wedding-timeline --collection users --file users.json
```

---

## 🌐 Nginx Issues

### ❌ "502 Bad Gateway"

**Symptoms:** Nginx shows 502 error

**Solutions:**
```bash
# 1. Check if backend is running
pm2 status
pm2 logs timeline-api

# 2. Verify backend port matches Nginx config
# Backend .env
PORT=5000

# Nginx config
sudo nano /etc/nginx/sites-available/timeline
# Ensure: proxy_pass http://localhost:5000;

# 3. Restart both services
pm2 restart timeline-api
sudo systemctl restart nginx

# 4. Check SELinux (if applicable)
sudo setsebool -P httpd_can_network_connect 1
```

### ❌ "404 Not Found" for static files

**Symptoms:** Frontend routes don't work, refresh gives 404

**Solutions:**
```bash
# 1. Check Nginx config has try_files
sudo nano /etc/nginx/sites-available/timeline

# Ensure this exists:
location / {
    root /var/www/timeline/frontend/dist;
    try_files $uri $uri/ /index.html;
}

# 2. Check files are actually deployed
ls -la /var/www/timeline/frontend/dist/

# 3. Check permissions
sudo chmod -R 755 /var/www/timeline/frontend/dist

# 4. Reload Nginx
sudo nginx -t
sudo systemctl reload nginx
```

### ❌ "Connection refused" for WebSocket

**Symptoms:** Socket.io doesn't work, real-time updates fail

**Solutions:**
```bash
# 1. Check Nginx WebSocket config
sudo nano /etc/nginx/sites-available/timeline

# Ensure this exists:
location /socket.io {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}

# 2. Check backend Socket.io CORS
nano /var/www/timeline/backend/server.js

# Ensure your domain is in allowed origins
const io = new Server(httpServer, {
  cors: {
    origin: ['https://yourdomain.com'],
    credentials: true
  }
});

# 3. Restart services
pm2 restart timeline-api
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS Issues

### ❌ Certbot fails to obtain certificate

**Symptoms:** SSL setup fails with error

**Solutions:**
```bash
# 1. Check DNS is propagated
nslookup yourdomain.com
ping yourdomain.com

# 2. Check port 80 is accessible
sudo netstat -tlnp | grep :80
curl http://yourdomain.com

# 3. Check Nginx is serving on port 80
sudo nginx -t
sudo systemctl status nginx

# 4. Try manual verification
sudo certbot certonly --webroot -w /var/www/timeline/frontend/dist -d yourdomain.com

# 5. Check firewall
sudo ufw status
sudo ufw allow 'Nginx Full'
```

### ❌ "Your connection is not private"

**Symptoms:** Browser shows SSL warning

**Solutions:**
```bash
# 1. Check certificate is installed
sudo certbot certificates

# 2. Check Nginx is using HTTPS
sudo nano /etc/nginx/sites-available/timeline

# Should have:
listen 443 ssl http2;
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# 3. Reload Nginx
sudo systemctl reload nginx

# 4. Clear browser cache
```

### ❌ Mixed content warnings

**Symptoms:** HTTPS page loads HTTP resources

**Solutions:**
```bash
# 1. Update frontend .env to use HTTPS
VITE_API_URL=https://yourdomain.com/api
VITE_SOCKET_URL=https://yourdomain.com

# 2. Rebuild frontend
cd frontend
npm run build

# 3. Redeploy
bash deployment/deploy-to-server.sh

# 4. Clear browser cache
```

---

## 🔥 Firebase Issues

### ❌ Push notifications not working

**Symptoms:** Can't request permission or notifications don't arrive

**Solutions:**
```bash
# 1. Check Firebase config in frontend
# frontend/src/lib/firebase.ts should have correct credentials

# 2. Check VAPID key is set
VITE_FIREBASE_VAPID_KEY=your_vapid_key

# 3. Check service worker is registered
# Browser console should show: "Service worker registered"

# 4. Check Firebase Admin on backend
pm2 logs timeline-api | grep Firebase

# Should see: ✅ Firebase Admin initialized

# 5. Verify service account
ls -la /var/www/timeline/backend/config/firebase-service-account.json

# 6. Check Firebase Console
# - Cloud Messaging is enabled
# - Service account has correct permissions
```

### ❌ "Firebase: Error (auth/invalid-api-key)"

**Symptoms:** Firebase initialization fails

**Solutions:**
```bash
# 1. Verify API key in frontend .env
VITE_FIREBASE_API_KEY=your_actual_api_key

# 2. Check Firebase Console > Project Settings > Web API Key

# 3. Rebuild frontend with correct keys
cd frontend
npm run build

# 4. Redeploy frontend
```

---

## 🚀 PM2 Issues

### ❌ Backend crashes immediately

**Symptoms:** PM2 shows "errored" or keeps restarting

**Solutions:**
```bash
# 1. Check detailed logs
pm2 logs timeline-api --lines 100

# 2. Common causes:

# Missing .env file
ls -la /var/www/timeline/backend/.env

# MongoDB not running
sudo systemctl status mongod

# Port conflict
sudo lsof -i :5000

# Missing dependencies
cd /var/www/timeline/backend
npm install

# 3. Try running manually to see error
cd /var/www/timeline/backend
node server.js

# 4. Check NODE_ENV
pm2 env 0 | grep NODE_ENV
```

### ❌ High memory usage

**Symptoms:** Server becomes slow, app crashes

**Solutions:**
```bash
# 1. Check memory usage
free -h
pm2 monit

# 2. Reduce PM2 instances
pm2 scale timeline-api 1

# 3. Set memory limit
pm2 restart timeline-api --max-memory-restart 300M

# 4. Check for memory leaks in logs
pm2 logs timeline-api | grep "memory"

# 5. Restart app
pm2 restart timeline-api
```

---

## 🔐 CORS Issues

### ❌ "CORS policy" errors in browser

**Symptoms:** API calls fail with CORS error

**Solutions:**
```bash
# 1. Update backend CORS settings
nano /var/www/timeline/backend/server.js

const allowedOrigins = [
  'https://yourdomain.com',  # Add your domain
  'http://localhost:5173'
];

# 2. Restart backend
pm2 restart timeline-api

# 3. Clear browser cache

# 4. Check Nginx isn't blocking headers
sudo nano /etc/nginx/sites-available/timeline

# Ensure headers are passed:
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
```

---

## 🌐 General Web Issues

### ❌ Slow page loads

**Solutions:**
```bash
# 1. Enable Gzip in Nginx (already in config)
sudo nano /etc/nginx/sites-available/timeline

# Should have:
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 2. Check server resources
htop
df -h

# 3. Optimize images in frontend

# 4. Enable caching (already in config)
```

### ❌ Cannot upload files

**Symptoms:** File uploads fail

**Solutions:**
```bash
# 1. Check Nginx upload limit
sudo nano /etc/nginx/nginx.conf

# Add if not present:
client_max_body_size 10M;

# 2. Reload Nginx
sudo systemctl reload nginx

# 3. Check disk space
df -h
```

---

## 🛠️ Quick Diagnostic Commands

```bash
# Check all services
sudo systemctl status mongod
sudo systemctl status nginx
pm2 status

# Check ports in use
sudo netstat -tlnp

# Check logs
pm2 logs timeline-api
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/mongodb/mongod.log

# Check resources
free -h
df -h
top

# Test backend API
curl http://localhost:5000/api/health

# Test frontend
curl http://localhost/

# Test DNS
nslookup yourdomain.com
dig yourdomain.com

# Test SSL
openssl s_client -connect yourdomain.com:443
```

---

## 🆘 Still Having Issues?

1. **Check all logs systematically**
   ```bash
   pm2 logs timeline-api --lines 200
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Verify each component separately**
   - MongoDB: `mongosh`
   - Backend: `curl http://localhost:5000/api/health`
   - Nginx: `sudo nginx -t`

3. **Review configuration files**
   - `/var/www/timeline/backend/.env`
   - `/etc/nginx/sites-available/timeline`
   - `/var/www/timeline/backend/server.js`

4. **Check security**
   - Firewall: `sudo ufw status`
   - Permissions: `ls -la /var/www/timeline`

5. **Start fresh if needed**
   ```bash
   # Stop everything
   pm2 delete all
   sudo systemctl stop nginx
   
   # Redeploy
   bash deployment/deploy-to-server.sh
   ```

---

## 📋 Debug Checklist

- [ ] All services running (MongoDB, Nginx, PM2)
- [ ] .env file configured correctly
- [ ] Firewall allows ports 80, 443
- [ ] DNS points to correct IP
- [ ] SSL certificate valid
- [ ] CORS configured for your domain
- [ ] Backend can connect to MongoDB
- [ ] Frontend built with correct API URL
- [ ] Logs show no errors

---

Remember: Most issues are configuration-related. Double-check your .env files and Nginx config! 🔍

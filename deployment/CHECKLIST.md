# ✅ Migration Checklist

Use this checklist to track your progress during migration.

## 📋 Pre-Migration

- [ ] Ubuntu Server is set up and accessible
- [ ] SSH access is working
- [ ] Domain/subdomain is ready (optional but recommended)
- [ ] Firebase credentials are available
- [ ] Local app runs successfully
- [ ] Backup of current data (if any)

## 🔧 Configuration

- [ ] Updated `SERVER_USER` in `deploy-to-server.sh`
- [ ] Updated `SERVER_IP` in `deploy-to-server.sh`
- [ ] Updated `DOMAIN` in `deploy-to-server.sh`
- [ ] Created `frontend/.env` with correct values
- [ ] DNS A record pointing to server IP (if using domain)

## 🖥️ Server Setup

- [ ] Copied `server-setup.sh` to server
- [ ] Ran `sudo bash server-setup.sh`
- [ ] Verified Node.js is installed (`node -v`)
- [ ] Verified MongoDB is running (`sudo systemctl status mongod`)
- [ ] Verified Nginx is running (`sudo systemctl status nginx`)
- [ ] Verified PM2 is installed (`pm2 -v`)

## 📤 Deployment

- [ ] Ran `bash deploy-to-server.sh` from local machine
- [ ] Frontend built successfully
- [ ] Files uploaded to server via rsync
- [ ] Backend dependencies installed on server
- [ ] PM2 started the backend
- [ ] Nginx configured

## ⚙️ Environment Configuration

- [ ] Edited `/var/www/timeline/backend/.env`
- [ ] Changed `JWT_SECRET` to secure random string
- [ ] Updated `FRONTEND_URL` with domain
- [ ] Configured `MONGODB_URI`
- [ ] Set up Firebase credentials (file or env variable)
- [ ] Restarted backend: `pm2 restart timeline-api`
- [ ] Checked logs: `pm2 logs timeline-api`

## 🔒 SSL Certificate

- [ ] DNS is propagated (tested with `ping`)
- [ ] Ran `sudo certbot --nginx -d yourdomain.com`
- [ ] Certificate installed successfully
- [ ] HTTPS is working (green lock in browser)
- [ ] HTTP redirects to HTTPS

## 🔐 Security

- [ ] Firewall is enabled (`sudo ufw status`)
- [ ] Only ports 22, 80, 443 are open
- [ ] Changed default MongoDB port (optional)
- [ ] MongoDB authentication configured (optional)
- [ ] Strong passwords used
- [ ] SSH key authentication enabled (recommended)

## ✨ Backend Configuration

- [ ] Updated CORS origins in `backend/server.js`
- [ ] Restarted backend after CORS update
- [ ] Backend is accessible via `/api` routes

## 🧪 Testing

- [ ] App loads at `https://yourdomain.com`
- [ ] Can register a new account
- [ ] Can login successfully
- [ ] Can create a timeline
- [ ] Real-time updates work (Socket.io)
- [ ] Push notification permission works
- [ ] Mobile view works correctly
- [ ] All API endpoints respond correctly

## 📊 Monitoring

- [ ] `pm2 status` shows app running
- [ ] `pm2 logs` shows no errors
- [ ] MongoDB is accessible
- [ ] Nginx access logs show traffic
- [ ] SSL certificate expires in 90 days

## 💾 Backup Setup

- [ ] Database backup script created
- [ ] Backup script tested
- [ ] Cron job for automated backups (optional)
- [ ] Backup location secured

## 📱 Post-Deployment

- [ ] Updated Firebase CORS settings (if needed)
- [ ] Updated any external service URLs
- [ ] Notified users of new URL (if changed)
- [ ] Updated documentation
- [ ] Tested from multiple devices

## 🎯 Optional Enhancements

- [ ] Set up log rotation
- [ ] Configure monitoring (pm2.io, etc.)
- [ ] Set up staging environment
- [ ] Configure CI/CD pipeline
- [ ] Set up fail2ban for security
- [ ] Configure automatic SSL renewal check
- [ ] Set up server monitoring (uptime, performance)
- [ ] Configure email notifications for errors

## 📝 Notes

Use this space to track any custom configurations or issues:

```
Date: ___________
Issues encountered:


Solutions applied:


Custom configurations:


```

---

## 🎊 Migration Complete!

Once all items are checked, your app is fully migrated to your server!

**Next steps:**
- Monitor logs for the first few days
- Set up automated backups
- Share the new URL with users
- Celebrate! 🎉

---

**Useful Commands Quick Reference:**

```bash
# Check status
pm2 status
pm2 logs timeline-api
sudo systemctl status mongod
sudo systemctl status nginx

# Restart services
pm2 restart timeline-api
sudo systemctl restart mongod
sudo systemctl restart nginx

# View logs
pm2 logs timeline-api --lines 100
sudo tail -f /var/log/nginx/error.log

# Database backup
mongodump --db wedding-timeline --out ~/backup

# Check resources
htop
df -h
free -h
```

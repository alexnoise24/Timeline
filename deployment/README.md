# 📦 Timeline App - Deployment Package

This directory contains everything you need to deploy your Timeline app to your own Ubuntu server.

## 📄 Files Overview

| File | Purpose |
|------|---------|
| `MIGRATION-GUIDE.md` | **START HERE** - Complete step-by-step migration guide |
| `ENV-SETUP.md` | Environment variables configuration guide |
| `server-setup.sh` | Installs all server dependencies (Node.js, MongoDB, Nginx, etc.) |
| `deploy-to-server.sh` | Deploys your app from local machine to server |
| `setup-nginx.sh` | Configures Nginx reverse proxy |
| `ssl-setup.sh` | Sets up SSL certificate with Let's Encrypt |
| `ecosystem.config.js` | PM2 process management configuration |

## 🚀 Quick Start (3 Steps)

### 1. Configure

Edit `deploy-to-server.sh`:
```bash
SERVER_USER="your_username"
SERVER_IP="192.168.1.100"
DOMAIN="timeline.yourdomain.com"
```

### 2. Set Up Server

```bash
# Copy script to server
scp server-setup.sh your_username@your_server_ip:~/

# SSH and run
ssh your_username@your_server_ip
sudo bash server-setup.sh
```

### 3. Deploy

```bash
# From your local machine
bash deploy-to-server.sh
```

Done! 🎉

## 📚 Documentation

- **Complete Guide:** Read `MIGRATION-GUIDE.md` for detailed instructions
- **Environment Setup:** See `ENV-SETUP.md` for configuration details

## 🔧 Requirements

- Ubuntu Server 20.04 or 22.04
- At least 4GB RAM, 2 CPU cores
- Domain or subdomain (optional but recommended)
- SSH access with sudo privileges

## 🆘 Support

If something goes wrong:
1. Check `pm2 logs timeline-api`
2. Review the Troubleshooting section in `MIGRATION-GUIDE.md`
3. Verify all environment variables in `ENV-SETUP.md`

## 📊 Architecture

```
┌─────────────────────────────────────────────────┐
│  Client Browser (https://yourdomain.com)        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Nginx (Port 80/443)                            │
│  - SSL Termination                              │
│  - Static Files                                 │
│  - Reverse Proxy                                │
└────────────────┬────────────────────────────────┘
                 │
                 ├─► Frontend (Static Files)
                 │   /var/www/timeline/frontend/dist
                 │
                 └─► Backend API (Port 5000)
                     Node.js + Express + Socket.io
                     ├─► MongoDB (Port 27017)
                     └─► Firebase (Push Notifications)
```

## 🎯 What Gets Migrated

| Component | From | To |
|-----------|------|-----|
| Frontend | Netlify | Your Nginx Server |
| Backend | (Already yours) | Your Server |
| Database | MongoDB Atlas | Local MongoDB |
| SSL | Netlify | Let's Encrypt |
| Process Management | - | PM2 |

**Only External Dependency:** Firebase Cloud Messaging (for push notifications)

## 💡 Tips

- Run `MIGRATION-GUIDE.md` steps in order
- Keep a backup before starting
- Test locally before deploying
- Use strong passwords for production
- Enable firewall (UFW)
- Set up automated backups

Happy deploying! 🚀

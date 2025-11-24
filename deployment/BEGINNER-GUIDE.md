# 🎓 Beginner's Step-by-Step Migration Guide

This guide assumes you have **zero server experience**. I'll tell you exactly what to type and where.

## 🖥️ Understanding Your Setup

You have **TWO computers**:
1. **Your Mac** - Where your code is (this computer)
2. **Your Ubuntu Server** - The PC where you'll host the app

We'll use **TWO terminal windows**:
- Terminal 1: For your Mac (local commands)
- Terminal 2: For your Ubuntu server (remote commands via SSH)

---

## 📝 Before We Start - Information You Need

Write down these details (you'll need them):

```
Ubuntu Server Username: alexobregon_________________
Ubuntu Server IP Address: 192.168.100.150_________________
Your Domain (optional): lenzu.app_________________
Your Email: alex.obregon@outlook.es_________________
```

**How to find your Ubuntu Server IP:**
- On your Ubuntu PC, open Terminal and type: `ip addr show`
- Look for something like `192.168.1.100` or similar

---

## 🚀 PART 1: Prepare Your Mac (Your Local Computer)

### Step 1.1: Open Terminal on Your Mac

1. Press `Cmd + Space`
2. Type: `Terminal`
3. Press Enter

You now have **Terminal 1** open. Keep this open!

### Step 1.2: Navigate to Your Project

In Terminal 1, type:

```bash
cd /Volumes/T7/Web\ APP/Timeline
```

Press Enter. This takes you to your project folder.

### Step 1.3: Configure Server Details

We need to tell the deployment script where your server is.

In Terminal 1, type:

```bash
nano deployment/deploy-to-server.sh
```

Press Enter. This opens a text editor.

**What you'll see:**
- Lines of code
- Look for lines that say `SERVER_USER=`, `SERVER_IP=`, and `DOMAIN=`

**What to change:**

1. Find the line: `SERVER_USER="your_username"`
   - Change it to your Ubuntu username
   - Example: `SERVER_USER="alex"` (use YOUR username)

2. Find the line: `SERVER_IP="your_server_ip"`
   - Change it to your server's IP address
   - Example: `SERVER_IP="192.168.1.100"` (use YOUR IP)

3. Find the line: `DOMAIN="timeline.yourdomain.com"`
   - If you have a domain: `DOMAIN="timeline.mydomain.com"`
   - If you DON'T have a domain: `DOMAIN="your_server_ip"` (use the IP)

**To save and exit:**
1. Press `Ctrl + X`
2. Press `Y` (for Yes)
3. Press Enter

### Step 1.4: Create Frontend Environment File

In Terminal 1, type:

```bash
nano frontend/.env
```

**Copy and paste this** (you'll need to customize the VAPID key later):

```bash
VITE_API_URL=https://timeline.yourdomain.com/api
VITE_SOCKET_URL=https://timeline.yourdomain.com
VITE_FIREBASE_API_KEY=AIzaSyAp4cELjeAhey_-RtJ26ehQtI0WOXSPoqU
VITE_FIREBASE_AUTH_DOMAIN=moment-weaver-66582.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=moment-weaver-66582
VITE_FIREBASE_STORAGE_BUCKET=moment-weaver-66582.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=110581331447
VITE_FIREBASE_APP_ID=1:110581331447:web:c6c8c69163f713ecf42af2
VITE_FIREBASE_VAPID_KEY=your_vapid_key_here
```

**Important:** Replace:
- `timeline.yourdomain.com` with YOUR domain (or IP if no domain)
- `your_vapid_key_here` with your Firebase VAPID key (we'll get this later)

**Save and exit:** `Ctrl + X`, then `Y`, then Enter

### Step 1.5: Test SSH Connection

Let's make sure you can connect to your Ubuntu server.

In Terminal 1, type (replace with YOUR username and IP):

```bash
ssh your_username@your_server_ip
```

Example: `ssh alexobregon@192.168.100.150`

**What will happen:**
- It might ask: "Are you sure you want to continue connecting?"
  - Type: `yes` and press Enter
- It will ask for your Ubuntu server password
  - Type it (you won't see it typing - that's normal!)
  - Press Enter

**If successful:** You'll see your Ubuntu server's command line!

**To exit back to your Mac:** Type `exit` and press Enter

✅ **You're done with Part 1! Keep Terminal 1 open.**

---

## 🖥️ PART 2: Setup Your Ubuntu Server

Now we'll install everything needed on your Ubuntu server.

### Step 2.1: Copy Setup Script to Server

In Terminal 1 (on your Mac), type (replace with YOUR details):

```bash
scp deployment/server-setup.sh your_username@your_server_ip:~/
```

Example: `scp deployment/server-setup.sh alex@192.168.1.100:~/`

- Enter your Ubuntu password when asked
- You'll see a progress bar as the file uploads

### Step 2.2: Connect to Your Ubuntu Server

**Open a NEW Terminal window** (this will be Terminal 2):
1. Press `Cmd + N` in Terminal
2. This is now **Terminal 2** (for Ubuntu server)

In Terminal 2, type (replace with YOUR details):

```bash
ssh your_username@your_server_ip
```

Enter your password.

**You're now on your Ubuntu server!** The prompt should look different.

### Step 2.3: Run the Setup Script

In Terminal 2 (Ubuntu server), type:

```bash
sudo bash server-setup.sh
```

Enter your Ubuntu password when asked.

**What will happen:**
- The script will install Node.js, MongoDB, Nginx, PM2, and more
- You'll see lots of text scrolling
- This takes about 5-10 minutes
- ☕ Go get a coffee!

**When it's done:** You'll see a success message with green checkmarks ✅

**DO NOT CLOSE Terminal 2** - Keep it open!

---

## 📤 PART 3: Deploy Your Application

### Step 3.1: Build and Deploy from Your Mac

Go back to **Terminal 1** (your Mac).

Type:

```bash
bash deployment/deploy-to-server.sh
```

Press Enter, then type `y` when it asks to continue.

**What will happen:**
1. Your frontend will build (1-2 minutes)
2. Files will upload to your server (2-3 minutes)
3. Dependencies will install on server (2-3 minutes)
4. PM2 will start your backend

**Watch for:** Progress bars and status messages

When done, you'll see: ✅ Deployment completed successfully!

---

## ⚙️ PART 4: Configure Environment Variables

Now we need to configure your app on the server.

### Step 4.1: Edit Backend Configuration

In **Terminal 2** (Ubuntu server), type:

```bash
nano /var/www/timeline/backend/.env
```

**What you'll see:** A file with configuration variables

**What to change:**

1. **Find:** `JWT_SECRET=tu_secreto_jwt_super_seguro_aqui_cambiar_en_produccion`
   
   We need a random, secure secret. In Terminal 2, press `Ctrl + Z` to pause the editor.
   
   Type:
   ```bash
   openssl rand -base64 32
   ```
   
   This generates a random string. **Copy it** (select with mouse, then Cmd+C).
   
   Type `fg` and press Enter to return to the editor.
   
   Replace the JWT_SECRET value with your copied string.

2. **Find:** `FRONTEND_URL=`
   
   Change to:
   - If you have a domain: `FRONTEND_URL=https://timeline.yourdomain.com`
   - If using IP only: `FRONTEND_URL=http://your_server_ip`

3. **Find:** `MONGODB_URI=mongodb://localhost:27017/wedding-timeline`
   
   This is correct! Leave it as is.

4. **Firebase configuration:**
   - We'll handle this in the next steps

**Save and exit:** `Ctrl + X`, then `Y`, then Enter

### Step 4.2: Restart Your Backend

In Terminal 2 (Ubuntu server), type:

```bash
pm2 restart timeline-api
```

### Step 4.3: Check if Everything is Running

In Terminal 2, type:

```bash
pm2 status
```

**You should see:**
```
┌─────┬───────────────┬─────────┬─────────┬──────────┐
│ id  │ name          │ status  │ restart │ uptime   │
├─────┼───────────────┼─────────┼─────────┼──────────┤
│ 0   │ timeline-api  │ online  │ 0       │ 5s       │
└─────┴───────────────┴─────────┴─────────┴──────────┘
```

✅ **Status should say "online"**

If it says "errored", type:
```bash
pm2 logs timeline-api
```

This shows you what went wrong. (Let me know the error if you see one!)

---

## 🌐 PART 5: Test Your App

### Step 5.1: Test Without SSL First

Open your web browser and go to:

**If using a domain:**
```
http://timeline.yourdomain.com
```

**If using IP only:**
```
http://192.168.1.100
```

**You should see your Timeline app!** 🎉

**If you see "502 Bad Gateway":**
- Go back to Terminal 2
- Type: `pm2 logs timeline-api`
- Look for errors (tell me what you see)

---

## 🔒 PART 6: Setup SSL (HTTPS) - Only if Using a Domain

**Skip this section if you're using just an IP address.**

### Step 6.1: Make Sure DNS is Working

In your browser, try going to your domain. If it loads (even without HTTPS), DNS is working!

### Step 6.2: Install SSL Certificate

In Terminal 2 (Ubuntu server), type (replace with YOUR domain):

```bash
sudo certbot --nginx -d timeline.yourdomain.com
```

**It will ask you questions:**

1. **"Enter email address"** - Type your email and press Enter
2. **"Terms of Service"** - Type `Y` and press Enter
3. **"Share email with EFF"** - Type `N` and press Enter
4. **"Redirect HTTP to HTTPS"** - Type `2` and press Enter (this is recommended)

**When successful:** You'll see "Congratulations!" 🎊

### Step 6.3: Test HTTPS

In your browser, go to:
```
https://timeline.yourdomain.com
```

You should see a **lock icon** 🔒 in the address bar!

---

## 🎉 CONGRATULATIONS! Your App is Live!

You've successfully migrated your Timeline app to your own server!

## 📊 What You Accomplished

- ✅ Installed server software (Node.js, MongoDB, Nginx)
- ✅ Deployed your frontend
- ✅ Deployed your backend
- ✅ Configured environment variables
- ✅ Set up process management (PM2)
- ✅ Added SSL certificate (if using domain)
- ✅ Your app is now accessible on the internet!

---

## 🔧 Daily Management - Commands You'll Use

Keep these commands handy! Use them in Terminal 2 (Ubuntu server).

### Check if Your App is Running

```bash
pm2 status
```

### View App Logs (See What's Happening)

```bash
pm2 logs timeline-api
```

Press `Ctrl + C` to stop viewing logs.

### Restart Your App

```bash
pm2 restart timeline-api
```

### Check Server Resources

```bash
htop
```

Press `q` to quit.

### Check Disk Space

```bash
df -h
```

---

## 🔄 How to Update Your App Later

When you make changes to your code:

**On Terminal 1 (your Mac):**

```bash
cd /Volumes/T7/Web\ APP/Timeline
bash deployment/deploy-to-server.sh
```

That's it! The script rebuilds and redeploys everything.

---

## 🆘 Common Issues and Solutions

### "Permission denied" when connecting via SSH

**Solution:** Check your username and password are correct.

```bash
ssh your_username@your_server_ip
```

### App shows "502 Bad Gateway"

**Solution:** Backend isn't running.

```bash
pm2 restart timeline-api
pm2 logs timeline-api
```

### "Connection refused" 

**Solution:** Check firewall.

```bash
sudo ufw status
sudo ufw allow 'Nginx Full'
```

### MongoDB not connecting

**Solution:** Restart MongoDB.

```bash
sudo systemctl restart mongod
sudo systemctl status mongod
```

### Can't access app from internet (only works locally)

**Solution:** 
1. Check your router allows incoming connections (port forwarding)
2. Forward ports 80 and 443 to your Ubuntu server's IP
3. Check firewall: `sudo ufw status`

---

## 🔥 Firebase Push Notifications Setup (Optional - Do Later)

This is more advanced. You can skip this for now and add it later.

When you're ready, see `ENV-SETUP.md` for detailed Firebase instructions.

---

## 📞 Getting Help

If something goes wrong:

1. **Check the logs:**
   ```bash
   pm2 logs timeline-api
   ```

2. **Check what's running:**
   ```bash
   pm2 status
   sudo systemctl status mongod
   sudo systemctl status nginx
   ```

3. **Restart everything:**
   ```bash
   pm2 restart timeline-api
   sudo systemctl restart mongod
   sudo systemctl restart nginx
   ```

4. **Show me the error:** Copy the error message and send it to me!

---

## 🎯 Next Steps (Optional)

Once your app is working:

- [ ] Set up automated database backups
- [ ] Configure Firebase for push notifications
- [ ] Test on mobile devices
- [ ] Share the URL with users
- [ ] Monitor the server occasionally

---

## 📚 Cheat Sheet - Keep This Handy!

```bash
# Connect to your server
ssh your_username@your_server_ip

# Check app status
pm2 status

# View logs
pm2 logs timeline-api

# Restart app
pm2 restart timeline-api

# Check all services
sudo systemctl status mongod
sudo systemctl status nginx

# Redeploy (from your Mac)
cd /Volumes/T7/Web\ APP/Timeline
bash deployment/deploy-to-server.sh
```

---

## 🎊 You Did It!

You successfully deployed a full-stack web application to your own server. That's impressive for someone with no server experience!

Your app is now:
- Self-hosted on your hardware
- Secure with HTTPS (if using domain)
- Automatically restarting if it crashes
- Using your own database
- Costing you $0/month in hosting fees

Welcome to the world of self-hosting! 🚀

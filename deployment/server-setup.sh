#!/bin/bash

# Timeline App - Ubuntu Server Setup Script
# This script installs all necessary dependencies on your Ubuntu server
# Run with: sudo bash server-setup.sh

set -e

echo "🚀 Starting Timeline App Server Setup..."
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Please run as root (use sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Updating system packages...${NC}"
apt update && apt upgrade -y

# Install Node.js 20.x
echo -e "${YELLOW}📦 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm -v)${NC}"

# Install MongoDB
echo -e "${YELLOW}📦 Installing MongoDB...${NC}"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   tee /etc/apt/sources.list.d/mongodb-org-7.0.list

apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

echo -e "${GREEN}✅ MongoDB installed and started${NC}"

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
apt install -y nginx

systemctl start nginx
systemctl enable nginx

echo -e "${GREEN}✅ Nginx installed and started${NC}"

# Install PM2 globally
echo -e "${YELLOW}📦 Installing PM2 process manager...${NC}"
npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER
env PATH=$PATH:/usr/bin pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

echo -e "${GREEN}✅ PM2 installed${NC}"

# Install Git (if not present)
echo -e "${YELLOW}📦 Installing Git...${NC}"
apt install -y git

# Install UFW firewall
echo -e "${YELLOW}🔒 Setting up firewall...${NC}"
apt install -y ufw

# Allow SSH, HTTP, and HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
echo "y" | ufw enable

echo -e "${GREEN}✅ Firewall configured${NC}"

# Install certbot for SSL
echo -e "${YELLOW}📦 Installing Certbot for SSL...${NC}"
apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}✅ Certbot installed${NC}"

# Create app directory
echo -e "${YELLOW}📁 Creating application directories...${NC}"
mkdir -p /var/www/timeline
chown -R $SUDO_USER:$SUDO_USER /var/www/timeline

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Server setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 Installed components:"
echo "  - Node.js $(node -v)"
echo "  - MongoDB (running on port 27017)"
echo "  - Nginx (running on port 80)"
echo "  - PM2 process manager"
echo "  - Git"
echo "  - UFW Firewall"
echo "  - Certbot (for SSL)"
echo ""
echo "🎯 Next steps:"
echo "  1. Run the deployment script: bash deploy-to-server.sh"
echo "  2. Configure your domain DNS to point to this server"
echo "  3. Run SSL setup: sudo bash ssl-setup.sh yourdomain.com"
echo ""

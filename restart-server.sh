#!/bin/bash

# Timeline App - Server Restart Script
# Run this script on your server to restart all services
# Usage: bash restart-server.sh

echo "🔄 Restarting Timeline App Services..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as sudo for system services
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}⚠️  Some commands require sudo. You may be prompted for your password.${NC}"
fi

# Start MongoDB
echo -e "${YELLOW}📦 Starting MongoDB...${NC}"
sudo systemctl start mongod
if systemctl is-active --quiet mongod; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB failed to start${NC}"
fi
echo ""

# Start Nginx
echo -e "${YELLOW}🌐 Starting Nginx...${NC}"
sudo systemctl start nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx failed to start${NC}"
fi
echo ""

# Start Cloudflare Tunnel
echo -e "${YELLOW}🔒 Starting Cloudflare Tunnel...${NC}"
sudo systemctl start cloudflared
if systemctl is-active --quiet cloudflared; then
    echo -e "${GREEN}✅ Cloudflare Tunnel is running${NC}"
else
    echo -e "${RED}❌ Cloudflare Tunnel failed to start${NC}"
fi
echo ""

# Restart PM2 apps
echo -e "${YELLOW}🚀 Restarting PM2 apps...${NC}"
pm2 restart all
echo -e "${GREEN}✅ PM2 apps restarted${NC}"
echo ""

# Show status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}📊 Service Status${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo "MongoDB:"
sudo systemctl status mongod --no-pager | grep "Active:"
echo ""

echo "Nginx:"
sudo systemctl status nginx --no-pager | grep "Active:"
echo ""

echo "Cloudflare Tunnel:"
sudo systemctl status cloudflared --no-pager | grep "Active:"
echo ""

echo "PM2 Apps:"
pm2 list
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Restart Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🌐 Your app should be available at: https://lenzu.app"
echo ""
echo "📝 Check logs with:"
echo "   pm2 logs timeline-api"
echo ""

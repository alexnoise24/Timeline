#!/bin/bash

# Timeline App - Deployment Script
# This script deploys your app to the Ubuntu server
# Run from your local machine: bash deploy-to-server.sh

set -e

# Configuration - CHANGE THESE VALUES
SERVER_USER="alexobregon"           # Your Ubuntu server username
SERVER_IP="192.168.100.150"            # Your server IP address
SERVER_PATH="/var/www/timeline"       # Installation path on server
DOMAIN="lenzu.app"      # Your domain (or subdomain)

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Timeline App Deployment"
echo "=========================="
echo ""
echo "Target: $SERVER_USER@$SERVER_IP"
echo "Path: $SERVER_PATH"
echo "Domain: $DOMAIN"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo -e "${YELLOW}📦 Building frontend...${NC}"
cd "$PROJECT_ROOT/frontend"
npm install
npm run build

echo -e "${GREEN}✅ Frontend built${NC}"

echo -e "${YELLOW}📤 Creating deployment package...${NC}"
cd "$PROJECT_ROOT"

# Create temporary deployment directory
DEPLOY_DIR="/tmp/timeline-deploy-$(date +%s)"
mkdir -p "$DEPLOY_DIR"

# Copy backend
cp -r backend "$DEPLOY_DIR/"
rm -rf "$DEPLOY_DIR/backend/node_modules"

# Copy frontend build
mkdir -p "$DEPLOY_DIR/frontend"
cp -r frontend/dist "$DEPLOY_DIR/frontend/"

# Copy deployment configs
cp -r deployment "$DEPLOY_DIR/"

echo -e "${GREEN}✅ Package created${NC}"

echo -e "${YELLOW}📤 Uploading to server...${NC}"
rsync -avz --progress "$DEPLOY_DIR/" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

echo -e "${GREEN}✅ Files uploaded${NC}"

# Clean up local temp
rm -rf "$DEPLOY_DIR"

echo -e "${YELLOW}🔧 Installing backend dependencies on server...${NC}"
ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH/backend && npm install --production"

echo -e "${GREEN}✅ Dependencies installed${NC}"

echo -e "${YELLOW}⚙️ Setting up environment file...${NC}"
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /var/www/timeline/backend

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created .env file from example. Please edit with your values:"
    echo "   nano /var/www/timeline/backend/.env"
fi
ENDSSH

echo -e "${YELLOW}🔧 Setting up PM2...${NC}"
ssh "$SERVER_USER@$SERVER_IP" << 'ENDSSH'
cd /var/www/timeline/backend
pm2 stop timeline-api 2>/dev/null || true
pm2 delete timeline-api 2>/dev/null || true
pm2 start server.js --name timeline-api --time
pm2 save
ENDSSH

echo -e "${GREEN}✅ PM2 configured${NC}"

echo -e "${YELLOW}🔧 Setting up Nginx...${NC}"
ssh "$SERVER_USER@$SERVER_IP" "sudo bash $SERVER_PATH/deployment/setup-nginx.sh $DOMAIN"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📋 Your app is now running at:"
echo "   http://$DOMAIN (or http://$SERVER_IP)"
echo ""
echo "🎯 Next steps:"
echo "  1. Edit environment variables:"
echo "     ssh $SERVER_USER@$SERVER_IP"
echo "     nano /var/www/timeline/backend/.env"
echo ""
echo "  2. Setup SSL certificate:"
echo "     sudo certbot --nginx -d $DOMAIN"
echo ""
echo "  3. Check app status:"
echo "     pm2 status"
echo "     pm2 logs timeline-api"
echo ""

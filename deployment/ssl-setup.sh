#!/bin/bash

# SSL Certificate Setup with Let's Encrypt
# Run on server: sudo bash ssl-setup.sh yourdomain.com

set -e

DOMAIN=$1
EMAIL="your-email@example.com"  # CHANGE THIS to your email

if [ -z "$DOMAIN" ]; then
    echo "Usage: sudo bash ssl-setup.sh yourdomain.com"
    exit 1
fi

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "🔒 Setting up SSL certificate for: $DOMAIN"
echo ""
read -p "Enter your email for SSL notifications: " EMAIL

# Obtain SSL certificate
echo "📜 Obtaining SSL certificate..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect

echo ""
echo "✅ SSL certificate installed successfully!"
echo ""
echo "🔒 Your app is now accessible via HTTPS:"
echo "   https://$DOMAIN"
echo ""
echo "📋 Certificate auto-renewal:"
echo "   Certbot will automatically renew your certificate before it expires."
echo "   You can test renewal with: sudo certbot renew --dry-run"
echo ""

# Update backend .env with HTTPS URL
if grep -q "FRONTEND_URL" /var/www/timeline/backend/.env; then
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=https://$DOMAIN|" /var/www/timeline/backend/.env
    echo "✅ Updated FRONTEND_URL in backend .env"
    
    # Restart backend
    pm2 restart timeline-api
    echo "♻️  Backend restarted"
fi

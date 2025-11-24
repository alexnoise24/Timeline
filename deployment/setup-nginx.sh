#!/bin/bash

# Nginx Configuration Setup Script
# Run on server: sudo bash setup-nginx.sh yourdomain.com

set -e

DOMAIN=$1
APP_PATH="/var/www/timeline"

if [ -z "$DOMAIN" ]; then
    echo "Usage: sudo bash setup-nginx.sh yourdomain.com"
    exit 1
fi

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo "🔧 Setting up Nginx for domain: $DOMAIN"

# Create Nginx configuration
cat > "/etc/nginx/sites-available/timeline" << EOF
# Timeline App - Nginx Configuration

# Redirect HTTP to HTTPS (will be enabled after SSL setup)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    
    # For now, serve the app
    # After SSL setup, uncomment the line below to redirect to HTTPS
    # return 301 https://\$server_name\$request_uri;
    
    # Root directory for frontend static files
    root $APP_PATH/frontend/dist;
    index index.html;

    # Serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Socket.io proxy
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}

# HTTPS configuration (will be set up by Certbot)
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name $DOMAIN;
#
#     # SSL certificates (Certbot will add these)
#     # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
#     # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
#
#     # Same configuration as above...
# }
EOF

# Enable site
ln -sf /etc/nginx/sites-available/timeline /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Reload Nginx
echo "♻️  Reloading Nginx..."
systemctl reload nginx

echo "✅ Nginx configured successfully!"
echo ""
echo "📋 Configuration file: /etc/nginx/sites-available/timeline"
echo "🌐 Your app should now be accessible at: http://$DOMAIN"
echo ""
echo "🔒 To enable SSL (HTTPS), run:"
echo "   sudo certbot --nginx -d $DOMAIN"

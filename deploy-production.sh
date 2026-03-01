#!/bin/bash
set -e  # Detener si hay cualquier error

echo "🚀 Iniciando deploy de Lenzu a producción..."

# ─────────────────────────────────────
# CONFIGURACIÓN
# ─────────────────────────────────────
SERVER_USER="alexobregon"
SERVER_IP="192.168.100.150"
SERVER_PATH="/var/www/timeline"

# ─────────────────────────────────────
# PASO 1 — Build del frontend
# ─────────────────────────────────────
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..
echo "✅ Frontend build exitoso"

# ─────────────────────────────────────
# PASO 2 — Push a git origin
# ─────────────────────────────────────
echo "📤 Pushing cambios a git..."
git push origin main
echo "✅ Git push exitoso"

# ─────────────────────────────────────
# PASO 3 — Copiar frontend al servidor
# ─────────────────────────────────────
echo "� Copiando frontend al servidor..."
scp -r frontend/dist/* $SERVER_USER@$SERVER_IP:$SERVER_PATH/frontend/dist/
echo "✅ Frontend copiado"

# ─────────────────────────────────────
# PASO 4 — Copiar backend al servidor
# ─────────────────────────────────────
echo "� Copiando backend al servidor..."
rsync -avz --exclude 'node_modules' --exclude '.env' backend/ $SERVER_USER@$SERVER_IP:$SERVER_PATH/backend/
echo "✅ Backend copiado"

# ─────────────────────────────────────
# PASO 5 — Instalar deps y reiniciar PM2
# ─────────────────────────────────────
echo "� Instalando dependencias y reiniciando PM2..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH/backend && npm install --production && pm2 restart timeline-api"
echo "✅ PM2 reiniciado"

echo ""
echo "✅ ═══════════════════════════════════"
echo "✅  Deploy exitoso — lenzu.app"
echo "✅ ═══════════════════════════════════"
echo ""
echo "🔍 Verifica en: https://lenzu.app"

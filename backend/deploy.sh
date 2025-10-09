#!/bin/bash

# Configuración del proyecto
PROJECT_ID="moment-weaver-66582"
SERVICE_NAME="wedding-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Configurando despliegue del backend a Google Cloud Run..."

# 1. Autenticación y configuración del proyecto
echo "🔐 Iniciando sesión en Google Cloud..."
gcloud auth login
gcloud config set project $PROJECT_ID

# 2. Habilitar servicios necesarios
echo "⚙️ Habilitando servicios de Google Cloud..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com

# 3. Construir la imagen del contenedor
echo "🏗️ Construyendo imagen del contenedor..."
gcloud builds submit --tag $IMAGE_NAME

# 4. Desplegar a Cloud Run
echo "🚀 Desplegando a Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image $IMAGE_NAME \
  --platform managed \
  --allow-unauthenticated \
  --region $REGION \
  --set-env-vars PORT=8080,NODE_ENV=production,FRONTEND_URL=https://${PROJECT_ID}.web.app \
  --set-env-vars MONGODB_URI="$1" \
  --set-env-vars JWT_SECRET="$2"

echo "✅ ¡Despliegue del backend completado!"
echo "🔗 El servicio estará disponible en: https://${SERVICE_NAME}-${PROJECT_ID}-${REGION}.run.app"
echo ""
echo "📝 Variables de entorno configuradas:"
echo "   - PORT=8080"
echo "   - NODE_ENV=production"
echo "   - FRONTEND_URL=https://${PROJECT_ID}.web.app"
echo "   - MONGODB_URI=***"
echo "   - JWT_SECRET=***"

#!/bin/bash

echo "🚀 Deploying to Netlify..."

# Build the frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Deploy using netlify CLI
echo "🌐 Deploying to Netlify..."
echo "y" | npx netlify-cli deploy --prod --dir=frontend/dist

echo "✅ Deployment complete!"

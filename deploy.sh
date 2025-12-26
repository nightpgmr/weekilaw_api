#!/bin/bash

# Weekilaw API Deployment Script

echo "🚀 Starting Weekilaw API deployment..."

# Create logs directory
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Start with PM2
echo "⚡ Starting server with PM2..."
npx pm2 start ecosystem.config.js

# Save PM2 configuration
npx pm2 save

echo "✅ Deployment completed!"
echo "📊 Server running on port 3001"
echo "🔍 Check status: npx pm2 status"
echo "📝 Check logs: npx pm2 logs weekilaw-api"

# Weekilaw API Server

Express.js API server for lawyer search and verification using the Iranian Bar Association API.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

The server will run on `http://localhost:3001`

## 📋 API Endpoints

### POST `/api/lawyers/search`
Search for lawyers using name, family, and contact information.

**Request Body:**
```json
{
  "name": "دکترکامران",
  "family": "آقایی",
  "mobileNumber": "09121080348",
  "licenseNumber": "7675"
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "message": "Lawyer search completed successfully"
}
```

### POST `/api/lawyers/verify`
Verify if a lawyer exists and is verified.

**Request Body:**
```json
{
  "name": "دکترکامران",
  "family": "آقایی",
  "mobileNumber": "09121080348"
}
```

**Response:**
```json
{
  "verified": true,
  "message": "Lawyer is verified"
}
```

### GET `/health`
Health check endpoint.

### GET `/`
API information and available endpoints.

## 🔧 Requirements

- Node.js 16+
- npm or yarn

## 📦 Dependencies

- `express`: Web framework
- `axios`: HTTP client for external API calls
- `cors`: CORS middleware

## 🧪 Testing

```bash
# Test lawyer search
curl -X POST http://localhost:3001/api/lawyers/search \
  -H "Content-Type: application/json" \
  -d '{"name":"دکترکامران","family":"آقایی","mobileNumber":"09121080348"}'

# Test lawyer verification
curl -X POST http://localhost:3001/api/lawyers/verify \
  -H "Content-Type: application/json" \
  -d '{"name":"دکترکامران","family":"آقایی","mobileNumber":"09121080348"}'

# Health check
curl http://localhost:3001/health
```

## 🚀 Deployment

Set the `PORT` environment variable for custom port:

```bash
PORT=8080 npm start
```

## 📝 Notes

- The server communicates with the Iranian Bar Association API at `https://search.icbar.org`
- SSL certificate verification is disabled for the external API
- CORS is enabled for all origins
- Request timeout is set to 30 seconds

## 🚀 Production Deployment

### PM2 (Recommended)

PM2 is a production process manager for Node.js applications.

```bash
# Install PM2 globally (run as root if needed)
npm install -g pm2

# Or install locally
npm install pm2 --save-dev

# Start the application
npx pm2 start ecosystem.config.js

# Check status
npx pm2 status

# View logs
npx pm2 logs weekilaw-api

# Restart application
npx pm2 restart weekilaw-api

# Stop application
npx pm2 stop weekilaw-api

# Save PM2 configuration (survives reboot)
npx pm2 save

# Setup PM2 to start on boot
npx pm2 startup
```

### Using Deployment Script

```bash
# Run deployment script
./deploy.sh
```

### Systemd Service (Alternative)

Create a systemd service file `/etc/systemd/system/weekilaw-api.service`:

```ini
[Unit]
Description=Weekilaw API Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/weekilaw_api
ExecStart=/usr/bin/node /path/to/weekilaw_api/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

Then run:
```bash
sudo systemctl daemon-reload
sudo systemctl enable weekilaw-api
sudo systemctl start weekilaw-api
sudo systemctl status weekilaw-api
```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📊 Monitoring

### PM2 Commands
```bash
npx pm2 monit                    # Real-time monitoring
npx pm2 logs weekilaw-api        # View logs
npx pm2 reloadLogs               # Reload logs
npx pm2 list                     # List all processes
```

### Health Check
```bash
curl http://localhost:3001/health
```

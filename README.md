# Weekilaw API Server

Express.js API server for lawyer search and verification using local database. This service provides fast and reliable access to Iranian lawyer information without external dependencies.

## 🌐 Production Domain
- **URL:** `https://sv.weekila.com`
- **SSL:** Let's Encrypt (Auto-renewal enabled)
- **Valid until:** March 26, 2026

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
Search for lawyers in the local database with flexible matching criteria.

**Required Fields:** `name`, `family`, and either `mobileNumber` or `licenseNumber`

**Request Body:**
```json
{
  "name": "جلال",
  "family": "آبتین",
  "licenseNumber": "22994",
  "mobileNumber": "09123456789",
  "gender": "1",
  "province": "تهران",
  "workstate": "8"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "licenseNumber": "22994",
      "name": "جلال",
      "family": "آبتین",
      "sex": "1",
      "officeAddress": "شهران -شهید اسحاقی...",
      "trainingTitle": "آثار مالی جرائم...",
      "proexperience": "52a74802-f581-42c4-8a5d-3c389283b2ed"
    }
  ],
  "count": 1,
  "message": "Found 1 matching lawyers"
}
```

### POST `/api/lawyers/verify`
Verify if a lawyer exists with exact matching criteria.

**Required Fields:** `name`, `family`, and either `mobileNumber` or `licenseNumber`

**Request Body:**
```json
{
  "name": "جلال",
  "family": "آبتین",
  "licenseNumber": "22994"
}
```

**Success Response:**
```json
{
  "verified": true,
  "message": "Lawyer is verified",
  "lawyer": {
    "licenseNumber": "22994",
    "name": "جلال",
    "family": "آبتین",
    "trainingTitle": "آثار مالی جرائم...",
    "proexperience": "52a74802-f581-42c4-8a5d-3c389283b2ed"
  }
}
```

**Not Found Response:**
```json
{
  "verified": false,
  "message": "Lawyer not found",
  "lawyer": null
}
```

### POST `/api/lawyers/fetch-lawyers-data`
Fetch and update lawyer data from external API and save to local database.

**Request Body:** Empty or with specific parameters

**Response:**
```json
{
  "success": true,
  "message": "Lawyer data fetched and saved successfully",
  "status_code": 200,
  "total_records": 150
}
```

### GET `/health`
Health check endpoint.

### GET `/`
API information and available endpoints.

## 🔧 Requirements

- Node.js 18+
- npm or yarn

## 📦 Dependencies

- `express`: Web framework
- `axios`: HTTP client (used for data fetching)
- `cors`: CORS middleware
- `fs`: File system operations (built-in)

## 📊 Data Structure

The `lawyers.json` file contains lawyer data organized by training courses:

```json
[
  {
    "title": "Course Title",
    "proexperience": "course-id",
    "lawyers": [
      {
        "licenseNumber": "12345",
        "name": "Lawyer Name",
        "family": "Lawyer Family",
        "sex": "1",
        "officeAddress": "Office Address",
        "mobileNumber": "09123456789",
        "workState": "8",
        "trainingTitle": "Course Title",
        "proexperience": "course-id"
      }
    ]
  }
]
```

## 🧪 Testing

### Local Testing
```bash
# Test lawyer search
curl -X POST http://localhost:3001/api/lawyers/search \
  -H "Content-Type: application/json" \
  -d '{"name":"جلال","family":"آبتین","licenseNumber":"22994"}'

# Test lawyer verification
curl -X POST http://localhost:3001/api/lawyers/verify \
  -H "Content-Type: application/json" \
  -d '{"name":"جلال","family":"آبتین","licenseNumber":"22994"}'

# Test with invalid data
curl -X POST http://localhost:3001/api/lawyers/verify \
  -H "Content-Type: application/json" \
  -d '{"name":"Invalid","family":"Name","licenseNumber":"99999"}'

# Health check
curl http://localhost:3001/health
```

### Production Testing
```bash
# Test with HTTPS domain
curl -X POST https://sv.weekila.com/api/lawyers/search \
  -H "Content-Type: application/json" \
  -d '{"name":"جلال","family":"آبتین","licenseNumber":"22994"}'

# Health check
curl https://sv.weekila.com/health
```

## 🚀 Deployment

### Environment Variables
```bash
PORT=3001                    # Server port (default: 3001)
NODE_ENV=production          # Environment mode
```

### Domain & SSL
- **Domain:** sv.weekila.com
- **SSL Provider:** Let's Encrypt
- **Auto-renewal:** Enabled
- **Valid until:** March 26, 2026

### CI/CD Deployment
The project includes GitHub Actions workflow for automatic deployment:

```yaml
# .github/workflows/deploy.yml
# Deploys to production server on push to main branch
# Uses PM2 for process management
# Includes SSL certificate setup
```

## 📝 Features

- **Fast Local Search:** No external API dependencies for search/verification
- **Flexible Matching:** Partial name matching for search, exact matching for verification
- **Comprehensive Data:** Includes training courses, office addresses, contact info
- **HTTPS Ready:** SSL certificate with auto-renewal
- **CORS Enabled:** Cross-origin requests allowed
- **Production Ready:** PM2 process management with auto-restart

## 📝 Notes

- Data is stored locally in `lawyers.json` for fast access
- The `fetch-lawyers-data` endpoint updates the local database from external API
- SSL certificate verification is disabled only for external data fetching
- All search/verification operations are performed locally
- CORS is enabled for all origins for frontend integration

## 🏗️ Architecture

### Data Flow
1. **Initial Setup:** Use `/api/lawyers/fetch-lawyers-data` to fetch data from external API
2. **Data Storage:** Lawyer information is saved to `lawyers.json`
3. **Search/Verify:** All search and verification requests use local database
4. **Updates:** Run fetch endpoint periodically to update lawyer database

### API Response Codes
- `200`: Success
- `422`: Validation error (missing required fields)
- `500`: Server error or database read error

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

### Production Server
- **Domain:** https://sv.weekila.com
- **Process Manager:** PM2
- **Logs Location:** `/home/user/.pm2/logs/`
- **SSL Certificate:** Let's Encrypt (auto-renewal)

### PM2 Commands
```bash
npx pm2 monit                    # Real-time monitoring
npx pm2 logs weekilaw-api        # View logs
npx pm2 reloadLogs               # Reload logs
npx pm2 list                     # List all processes
npx pm2 restart weekilaw-api     # Restart service
```

### Health Checks
```bash
# Local
curl http://localhost:3001/health

# Production
curl https://sv.weekila.com/health
```

### SSL Certificate Management
```bash
# Check certificate status
certbot certificates

# Renew certificates (automatic)
certbot renew

# Manual certificate renewal
certbot certonly --nginx -d sv.weekila.com
```

## 🔧 Troubleshooting

### Common Issues

**API Returns Empty Results:**
- Check if `lawyers.json` file exists and has data
- Run `/api/lawyers/fetch-lawyers-data` to update the database

**SSL Certificate Issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

**Port 3001 Not Accessible:**
```bash
# Check if port is open
sudo ufw status | grep 3001

# Open port if needed
sudo ufw allow 3001/tcp
```

**PM2 Issues:**
```bash
# Check PM2 status
npx pm2 status

# Restart service
npx pm2 restart weekilaw-api

# Check logs
npx pm2 logs weekilaw-api
```

**File Permission Issues:**
```bash
# Fix lawyers.json permissions
chmod 644 lawyers.json

# Check file ownership
ls -la lawyers.json
```

### Performance Tips

- The local database approach provides sub-second response times
- Use exact matching for verification (faster than search)
- The `fetch-lawyers-data` endpoint should be run periodically to keep data current
- Monitor PM2 logs for any performance issues

---

**For support or issues, check the logs and ensure all dependencies are properly installed.**

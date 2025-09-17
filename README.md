# Website Screenshot Server

A production-ready Node.js API server for capturing full-page screenshots of websites using Playwright. Supports multiple device presets and concurrent screenshot capture.

## Features

- 🚀 **High Performance**: Reuses single browser instance for optimal concurrency
- 📱 **Multi-Device Support**: Mobile, tablet, laptop, and desktop viewports
- 🛡️ **Production Ready**: Security headers, rate limiting, error handling
- 📸 **Full-Page Screenshots**: Captures complete webpage content
- ⚡ **Parallel Processing**: Captures multiple device screenshots simultaneously
- 🔧 **Configurable**: Environment variables for easy deployment
- 📊 **Monitoring**: Health checks, request logging, and error tracking

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone or download the project**

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Install browser binaries**

   ```bash
   npm run install-browsers
   ```

4. **Configure environment** (optional)

   The server comes with a `.env` file with default settings. You can modify it if needed.

5. **Start the server**

   ```bash
   # Development (with auto-restart)
   npm run dev

   # Production
   npm start
   ```

The server will start on `http://localhost:3000` by default.

## API Documentation

### 📸 Capture Screenshots

**POST** `/capture`

Capture full-page screenshots for specified device types.

#### Request Body

```json
{
  "url": "https://example.com",
  "devices": ["mobile", "tablet", "laptop", "desktop"]
}
```

#### Response

```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  },
  "screenshots": [
    {
      "device": "mobile",
      "url": "http://localhost:3000/uploads/1705315800000_mobile_abc123.png",
      "viewport": {
        "width": 375,
        "height": 812
      }
    },
    {
      "device": "desktop",
      "url": "http://localhost:3000/uploads/1705315800000_desktop_def456.png",
      "viewport": {
        "width": 1920,
        "height": 1080
      }
    }
  ]
}
```

### 📱 Available Devices

**GET** `/capture/devices`

List all available device presets and their configurations.

#### Response

```json
{
  "success": true,
  "devices": [
    {
      "name": "mobile",
      "viewport": { "width": 375, "height": 812 },
      "deviceScaleFactor": 2,
      "isMobile": true
    }
  ],
  "total": 4
}
```

### 🏥 Health Check

**GET** `/health`

Server health and status information.

### 🖼️ Access Screenshots

**GET** `/uploads/{filename}.png`

Direct access to captured screenshot files.

## Device Presets

| Device  | Resolution  | Scale | Mobile | Touch |
| ------- | ----------- | ----- | ------ | ----- |
| mobile  | 375 × 812   | 2x    | ✅     | ✅    |
| tablet  | 768 × 1024  | 2x    | ✅     | ✅    |
| laptop  | 1366 × 768  | 1x    | ❌     | ❌    |
| desktop | 1920 × 1080 | 1x    | ❌     | ❌    |

## Configuration

Environment variables can be configured in a `.env` file:

```bash
# Server Configuration
PORT=3000

# Storage Configuration
UPLOADS_PATH=./uploads

# Screenshot Configuration
SCREENSHOT_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Environment
NODE_ENV=production
```

## Usage Examples

### Basic Screenshot

```bash
curl -X POST http://localhost:3000/capture \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com", "devices": ["desktop"]}'
```

### Multiple Devices

```bash
curl -X POST http://localhost:3000/capture \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["mobile", "tablet", "laptop", "desktop"]}'
```

### Check Available Devices

```bash
curl http://localhost:3000/capture/devices
```

## Production Deployment

### Docker (Recommended)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
RUN npx playwright install chromium
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 Process Manager

```bash
npm install -g pm2
pm2 start app.js --name screenshot-server
pm2 save
pm2 startup
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=3000
UPLOADS_PATH=/app/uploads
SCREENSHOT_TIMEOUT=30000
RATE_LIMIT_MAX_REQUESTS=100
```

## Error Handling

The API provides comprehensive error handling with appropriate HTTP status codes:

- `400` - Bad Request (invalid URL, missing parameters)
- `408` - Request Timeout
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error
- `503` - Service Unavailable (browser issues)

## Performance & Scaling

- **Browser Reuse**: Single browser instance handles all requests
- **Concurrent Processing**: Screenshots taken in parallel
- **Memory Management**: Automatic context cleanup after each request
- **Rate Limiting**: Configurable request limits per IP
- **Caching**: Static file caching with proper headers

## Security Features

- **Input Validation**: URL and parameter validation
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Security Headers**: Helmet.js with CSP policies
- **File Access Control**: Restricted file serving
- **Request Logging**: Full audit trail
- **Graceful Shutdown**: Clean resource cleanup

## Troubleshooting

### Browser Installation Issues

```bash
# Reinstall browser binaries
npm run install-browsers

# Check browser installation
npx playwright install --dry-run chromium
```

### Memory Issues

- Increase Node.js memory limit: `node --max-old-space-size=4096 app.js`
- Monitor browser processes
- Adjust concurrent request limits

### Permission Issues

- Ensure uploads directory is writable
- Check file system permissions
- Verify browser can access system resources

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**Need help?** Check the health endpoint at `/health` or review the logs for detailed error information.

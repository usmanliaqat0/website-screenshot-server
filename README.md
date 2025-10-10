# Website Screenshot Server

A production-ready Node.js API server for capturing full-page website screenshots using Playwright. Features multiple device presets, concurrent processing, and comprehensive error handling.

## Features

- 🚀 **High Performance**: Single browser instance with connection reuse for optimal performance
- 📱 **Multi-Device Support**: Mobile, tablet, laptop, and desktop viewport presets
- 🛡️ **Production Ready**: Security headers (Helmet), CORS, rate limiting, and request logging
- 📸 **Full-Page Screenshots**: Smart content detection and complete page capture
- ⚡ **Parallel Processing**: Concurrent screenshot capture across multiple devices
- 📅 **Date & Time Management**: Organized filenames with date/time stamps for easy management
- 🗑️ **Automatic Cleanup**: Scheduled cleanup of screenshots older than 10 hours (runs every 12 hours)
- 🔧 **Manual Cleanup**: Trigger cleanup manually and monitor cleanup status
- 🔧 **Robust Error Handling**: Comprehensive error mapping and graceful degradation
- 📊 **Monitoring**: Health checks, request ID tracking, and detailed logging
- ⏱️ **Smart Timeouts**: Configurable timeouts with network idle detection

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Windows, macOS, or Linux

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Install browser binaries**

   ```bash
   npm run install-browsers
   ```

3. **Configure environment** (optional)

   The server comes with a `.env` file with default settings. You can modify it if needed.

4. **Start the server**

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

### 🎯 Capture Section Screenshots

**POST** `/capture/section`

Capture screenshots of specific page sections/elements for specified device types.

#### Request Body

```json
{
  "url": "https://example.com",
  "devices": ["mobile", "tablet", "laptop", "desktop"],
  "selector": ".hero-section"
}
```

#### Selector Types

- **Element**: `"div"`, `"section"`, `"header"`
- **Class**: `".hero-section"`, `".main-content"`, `".navigation"`
- **ID**: `"#banner"`, `"#navigation"`, `"#footer"`
- **Complex**: `"section.hero"`, `"header#main-header"`, `"div.content-wrapper"`
- **Multiple Classes (Chained)**: `".elementor-element.elementor-element-bb4cf52.e-flex.e-con-boxed.e-con.e-parent.e-lazyloaded"`
- **Data Attributes**: `"[data-id='bb4cf52']"`, `"[data-element_type='container']"`

#### ⚠️ Important: Class Selector Format

When copying class names from HTML, you need to format them correctly:

**❌ Wrong (space-separated):**

```json
"selector": "elementor-element elementor-element-bb4cf52 e-flex e-con-boxed e-con e-parent e-lazyloaded"
```

**✅ Correct (chained with dots):**

```json
"selector": ".elementor-element.elementor-element-bb4cf52.e-flex.e-con-boxed.e-con.e-parent.e-lazyloaded"
```

**✅ Alternative (data attribute - more reliable):**

```json
"selector": "[data-id='bb4cf52']"
```

#### Response

```json
{
  "success": true,
  "url": "https://example.com",
  "selector": ".hero-section",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0
  },
  "screenshots": [
    {
      "device": "mobile",
      "url": "http://localhost:3000/uploads/1705315800000_mobile_hero_section_abc123.png",
      "viewport": {
        "width": 375,
        "height": 812
      },
      "selector": ".hero-section",
      "elementBounds": {
        "x": 0,
        "y": 100,
        "width": 375,
        "height": 400
      }
    },
    {
      "device": "desktop",
      "url": "http://localhost:3000/uploads/1705315800000_desktop_hero_section_def456.png",
      "viewport": {
        "width": 1920,
        "height": 1080
      },
      "selector": ".hero-section",
      "elementBounds": {
        "x": 0,
        "y": 80,
        "width": 1920,
        "height": 600
      }
    }
  ]
}
```

#### Device Requirements

- **Minimum**: 1 device required
- **Maximum**: All available devices (mobile, tablet, laptop, desktop)
- **Validation**: Invalid devices will return error with valid options

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
    },
    {
      "name": "tablet",
      "viewport": { "width": 768, "height": 1024 },
      "deviceScaleFactor": 2,
      "isMobile": true
    },
    {
      "name": "laptop",
      "viewport": { "width": 1366, "height": 768 },
      "deviceScaleFactor": 1,
      "isMobile": false
    },
    {
      "name": "desktop",
      "viewport": { "width": 1920, "height": 1080 },
      "deviceScaleFactor": 1,
      "isMobile": false
    }
  ],
  "total": 4
}
```

### 🧹 Manual Cleanup

**POST** `/capture/cleanup`

Manually trigger cleanup of screenshots older than 10 hours.

#### Response

```json
{
  "success": true,
  "message": "Cleanup completed",
  "result": {
    "success": true,
    "deletedCount": 3,
    "totalChecked": 8,
    "duration": 1250,
    "errors": [],
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### 📊 Cleanup Status

**GET** `/capture/cleanup/status`

Get cleanup service status and statistics.

#### Response

```json
{
  "success": true,
  "cleanup": {
    "isRunning": false,
    "lastCleanup": "2024-01-15T10:30:00.000Z",
    "cleanupIntervalHours": 10,
    "stats": {
      "totalDeleted": 15,
      "lastRun": "2024-01-15T10:30:00.000Z",
      "errors": []
    },
    "nextScheduledRun": "2024-01-15T12:00:00.000Z"
  }
}
```

### 🏥 Health Check

**GET** `/health`

Server health and status information with uptime and version.

#### Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "version": "1.0.0",
  "environment": "development"
}
```

### 📄 API Information

**GET** `/`

Get complete API documentation and endpoint information.

### 🖼️ Access Screenshots

**GET** `/uploads/{filename}`

Direct access to captured screenshot files with proper caching headers.

## Device Presets

| Device  | Width × Height | Scale Factor | Mobile | Touch |
| ------- | -------------- | ------------ | ------ | ----- |
| Mobile  | 375 × 812      | 2×           | ✓      | ✓     |
| Tablet  | 768 × 1024     | 2×           | ✓      | ✓     |
| Laptop  | 1366 × 768     | 1×           | ✗      | ✗     |
| Desktop | 1920 × 1080    | 1×           | ✗      | ✗     |

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

### Section Screenshots

#### Capture by Class

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["mobile", "desktop"], "selector": ".hero-section"}'
```

#### Capture by ID

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["tablet"], "selector": "#main-banner"}'
```

#### Capture by Element

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["mobile", "tablet", "laptop", "desktop"], "selector": "header"}'
```

#### Complex Selector

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["desktop"], "selector": "section.hero#main-hero"}'
```

#### Multiple Classes (Elementor Example)

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["mobile", "desktop"], "selector": ".elementor-element.elementor-element-bb4cf52"}'
```

#### Full Class String (Chained)

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["tablet"], "selector": ".elementor-element.elementor-element-bb4cf52.e-flex.e-con-boxed.e-con.e-parent.e-lazyloaded"}'
```

#### Data Attribute Selector (Recommended)

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["mobile", "desktop"], "selector": "[data-id=\'bb4cf52\']"}'
```

### Check Available Devices

```bash
curl http://localhost:3000/capture/devices
```

### Manual Cleanup

```bash
curl -X POST http://localhost:3000/capture/cleanup
```

### Check Cleanup Status

```bash
curl http://localhost:3000/capture/cleanup/status
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Project Structure

```
website-screenshot-server/
├── app.js                    # Main server application
├── package.json              # Dependencies and scripts
├── src/
│   ├── browserManager.js     # Browser instance management
│   ├── config.js             # Device presets configuration
│   ├── screenshotService.js  # Core screenshot logic
│   ├── cleanupService.js     # Automatic cleanup service
│   ├── middleware/
│   │   ├── errorHandler.js   # Error handling & logging
│   │   └── static.js         # Static file serving
│   └── routes/
│       └── capture.js        # API route handlers
└── uploads/                  # Screenshot storage directory
```

## Security Features

- **Helmet.js**: Comprehensive security headers including CSP
- **Rate Limiting**: 1000 requests per 15-minute window per IP
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: URL and parameter sanitization
- **Request Logging**: Unique request IDs for audit trails
- **Graceful Shutdown**: Clean browser and server cleanup
- **Error Handling**: Secure error responses without internal details

## Performance Features

- **Browser Reuse**: Single Chromium instance for all requests
- **Parallel Processing**: Concurrent screenshot capture across devices
- **Network Optimization**: Smart wait strategies for content loading
- **Memory Management**: Automatic context cleanup after requests
- **File Caching**: Proper cache headers for uploaded images
- **Request Deduplication**: Removes duplicate devices from requests

## Error Handling

Comprehensive error responses with appropriate HTTP status codes:

- **400**: Bad Request (validation errors, invalid URLs)
- **408**: Request Timeout (screenshot capture timeout)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error (capture failures)
- **503**: Service Unavailable (browser issues)

Example error response:

```json
{
  "success": false,
  "error": "Invalid devices: mobile2, tablet2",
  "code": "INVALID_DEVICES",
  "invalidDevices": ["mobile2", "tablet2"],
  "validDevices": ["mobile", "tablet", "laptop", "desktop"]
}
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start with auto-restart on changes
- `npm run install-browsers` - Install Playwright browsers
- `npm run health` - Quick health check via curl
- `npm run clean` - Remove all PNG files from uploads

## Environment Configuration

Create or modify the `.env` file for custom settings:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Screenshot Settings
SCREENSHOT_TIMEOUT=30000
UPLOADS_PATH=./uploads
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

## System Requirements

- **Node.js**: 18.0.0 or higher
- **RAM**: Minimum 1GB, recommended 2GB+
- **Storage**: ~500MB for browser binaries + screenshot storage
- **OS**: Windows, macOS, or Linux

## Dependencies

**Core:**

- **Express.js** - Web framework
- **Playwright** - Browser automation
- **Helmet** - Security headers
- **CORS** - Cross-origin support
- **express-rate-limit** - Rate limiting
- **node-cron** - Scheduled cleanup tasks

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

### Performance Issues

- Monitor memory usage with `htop` or Task Manager
- Check `uploads/` directory disk usage
- Review rate limiting configuration

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**API Documentation**: Visit `http://localhost:3000` for interactive endpoint documentation.

**Need help?** Check the health endpoint at `/health` or review the logs for detailed error information.

# Website Screenshot Server# Website Screenshot Server

A production-ready Node.js API server for capturing full-page website screenshots using Playwright. Features multiple device presets, concurrent processing, and comprehensive error handling.A production-ready Node.js API server for capturing full-page website screenshots using Playwright. Features multiple device presets, concurrent processing, and comprehensive error handling.

## Features## Features

- 🚀 **High Performance**: Single browser instance with connection reuse for optimal performance- 🚀 **High Performance**: Single browser instance with connection reuse for optimal performance

- 📱 **Multi-Device Support**: Mobile, tablet, laptop, and desktop viewport presets- 📱 **Multi-Device Support**: Mobile, tablet, laptop, and desktop viewport presets

- 🛡️ **Production Ready**: Security headers (Helmet), CORS, rate limiting, and request logging- 🛡️ **Production Ready**: Security headers (Helmet), CORS, rate limiting, and request logging

- 📸 **Full-Page Screenshots**: Smart content detection and complete page capture- 📸 **Full-Page Screenshots**: Smart content detection and complete page capture

- ⚡ **Parallel Processing**: Concurrent screenshot capture across multiple devices- ⚡ **Parallel Processing**: Concurrent screenshot capture across multiple devices

- 🔧 **Robust Error Handling**: Comprehensive error mapping and graceful degradation- 🔧 **Robust Error Handling**: Comprehensive error mapping and graceful degradation

- 📊 **Monitoring**: Health checks, request ID tracking, and detailed logging- 📊 **Monitoring**: Health checks, request ID tracking, and detailed logging

- 🗑️ **File Management**: Built-in endpoint for clearing uploaded screenshots- 🗑️ **File Management**: Built-in endpoint for clearing uploaded screenshots

- ⏱️ **Smart Timeouts**: Configurable timeouts with network idle detection- ⏱️ **Smart Timeouts**: Configurable timeouts with network idle detection

## Quick Start## Quick Start

### Prerequisites### Prerequisites

- Node.js 18.0.0 or higher- Node.js 18.0.0 or higher

- npm 8.0.0 or higher- npm 8.0.0 or higher

- Windows, macOS, or Linux- Windows, macOS, or Linux

### Installation### Installation

1. **Install dependencies**1. **Install dependencies**

   `bash   `bash

   npm install npm install

   `   `

2. **Start the server**3. **Install browser binaries**

   ````bash

   # Development (with auto-restart)   ```bash

   npm run dev   npm run install-browsers

   ````

   # Production

   npm start4. **Configure environment** (optional)

   ```

   The server comes with a `.env` file with default settings. You can modify it if needed.
   ```

The server will start on `http://localhost:3000` and browsers will be automatically installed.

5. **Start the server**

## API Endpoints

````bash

### 📸 Capture Screenshots   # Development (with auto-restart)

**POST** `/capture`   npm run dev



Capture full-page screenshots for specified device types.   # Production

npm start

**Request Body:**   ```

```json

{The server will start on `http://localhost:3000` by default.

"url": "https://example.com",

"devices": ["mobile", "tablet", "laptop", "desktop"]## API Documentation

}

```### 📸 Capture Screenshots



**Response:****POST** `/capture`

```json

{Capture full-page screenshots for specified device types.

"success": true,

"url": "https://example.com",#### Request Body

"timestamp": "2024-01-15T10:30:00.000Z",

"summary": {```json

 "total": 2,{

 "successful": 2,  "url": "https://example.com",

 "failed": 0  "devices": ["mobile", "tablet", "laptop", "desktop"]

},}

"screenshots": [```

 {

   "device": "mobile",#### Response

   "url": "http://localhost:3000/uploads/1705315800000_mobile_abc123.png",

   "viewport": { "width": 375, "height": 812 }```json

 }{

]  "success": true,

}  "url": "https://example.com",

```  "timestamp": "2024-01-15T10:30:00.000Z",

"summary": {

### 📱 Get Available Devices    "total": 2,

**GET** `/capture/devices`    "successful": 2,

 "failed": 0

List all available device presets and their configurations.  },

"screenshots": [

### 🗑️ Clear All Images    {

**DELETE** `/capture/clear`      "device": "mobile",

   "url": "http://localhost:3000/uploads/1705315800000_mobile_abc123.png",

Delete all screenshot images from the uploads directory.      "viewport": {

     "width": 375,

**Response:**        "height": 812

```json      }

{    },

"success": true,    {

"message": "Successfully deleted 5 images",      "device": "desktop",

"deletedCount": 5      "url": "http://localhost:3000/uploads/1705315800000_desktop_def456.png",

}      "viewport": {

```        "width": 1920,

     "height": 1080

### 🏥 Health Check      }

**GET** `/health`    }

]

Server health and status information with uptime and version.}

````

### 📄 API Information

**GET** `/`### 📱 Available Devices

Get complete API documentation and endpoint information.**GET** `/capture/devices`

### 🖼️ Access ScreenshotsList all available device presets and their configurations.

**GET** `/uploads/{filename}`

#### Response

Direct access to captured screenshot files with proper caching headers.

```json

## Device Presets{

  "success": true,

| Device  | Resolution  | Scale | Mobile | Touch |  "devices": [

| ------- | ----------- | ----- | ------ | ----- |    {

| mobile  | 375 × 812   | 2x    | ✅     | ✅    |      "name": "mobile",

| tablet  | 768 × 1024  | 2x    | ✅     | ✅    |      "viewport": { "width": 375, "height": 812 },

| laptop  | 1366 × 768  | 1x    | ❌     | ❌    |      "deviceScaleFactor": 2,

| desktop | 1920 × 1080 | 1x    | ❌     | ❌    |      "isMobile": true

    }

## Configuration  ],

  "total": 4

The server uses hardcoded configuration optimized for production:}

```

- **Port**: 3000

- **Rate Limiting**: 1000 requests per 15 minutes per IP### 🏥 Health Check

- **Request Timeout**: 60 seconds

- **Body Size Limit**: 50MB**GET** `/health`

- **CORS**: Enabled for all origins

- **Security Headers**: Comprehensive CSP and security policiesServer health and status information.

## Usage Examples### 🖼️ Access Screenshots

### Basic Screenshot**GET** `/uploads/{filename}.png`

```bash

curl -X POST http://localhost:3000/capture \Direct access to captured screenshot files.

  -H "Content-Type: application/json" \

  -d '{"url": "https://github.com", "devices": ["desktop"]}'## Device Presets

```

| Device | Resolution | Scale | Mobile | Touch |

### Multiple Devices| ------- | ----------- | ----- | ------ | ----- |

```bash| mobile  | 375 × 812   | 2x    | ✅     | ✅    |

curl -X POST http://localhost:3000/capture \| tablet  | 768 × 1024  | 2x    | ✅     | ✅    |

  -H "Content-Type: application/json" \| laptop  | 1366 × 768  | 1x    | ❌     | ❌    |

  -d '{"url": "https://example.com", "devices": ["mobile", "tablet"]}'| desktop | 1920 × 1080 | 1x    | ❌     | ❌    |

```

## Configuration

### Clear All Images

```bashEnvironment variables can be configured in a `.env` file:

curl -X DELETE http://localhost:3000/capture/clear

```````bash

# Server Configuration

### Check HealthPORT=3000

```bash

curl http://localhost:3000/health# Storage Configuration

```UPLOADS_PATH=./uploads



## Architecture# Screenshot Configuration

SCREENSHOT_TIMEOUT=30000

```

├── app.js                     # Main server application# Rate Limiting

├── package.json              # Dependencies and scriptsRATE_LIMIT_WINDOW_MS=900000

├── src/RATE_LIMIT_MAX_REQUESTS=100

│   ├── browserManager.js     # Browser instance management

│   ├── config.js             # Device presets configuration# Environment

│   ├── screenshotService.js  # Core screenshot logicNODE_ENV=production

│   ├── middleware/```

│   │   ├── errorHandler.js   # Error handling & logging

│   │   └── static.js         # Static file serving## Usage Examples

│   └── routes/

│       └── capture.js        # API route handlers### Basic Screenshot

└── uploads/                  # Screenshot storage directory

``````bash

curl -X POST http://localhost:3000/capture \

## Security Features  -H "Content-Type: application/json" \

  -d '{"url": "https://github.com", "devices": ["desktop"]}'

- **Helmet.js**: Comprehensive security headers including CSP```

- **Rate Limiting**: 1000 requests per 15-minute window per IP

- **CORS**: Configurable cross-origin resource sharing### Multiple Devices

- **Input Validation**: URL and parameter sanitization

- **Request Logging**: Unique request IDs for audit trails```bash

- **Graceful Shutdown**: Clean browser and server cleanupcurl -X POST http://localhost:3000/capture \

- **Error Handling**: Secure error responses without internal details  -H "Content-Type: application/json" \

  -d '{"url": "https://example.com", "devices": ["mobile", "tablet", "laptop", "desktop"]}'

## Performance Features```



- **Browser Reuse**: Single Chromium instance for all requests### Check Available Devices

- **Parallel Processing**: Concurrent screenshot capture across devices

- **Network Optimization**: Smart wait strategies for content loading```bash

- **Memory Management**: Automatic context cleanup after requestscurl http://localhost:3000/capture/devices

- **File Caching**: Proper cache headers for uploaded images```

- **Request Deduplication**: Removes duplicate devices from requests

## Production Deployment

## Error Handling

### Docker (Recommended)

Comprehensive error responses with appropriate HTTP status codes:

```dockerfile

- **400**: Bad Request (validation errors, invalid URLs)FROM node:18-alpine

- **408**: Request Timeout (screenshot capture timeout)WORKDIR /app

- **429**: Too Many Requests (rate limit exceeded)COPY package*.json ./

- **500**: Internal Server Error (capture failures)RUN npm ci --only=production

- **503**: Service Unavailable (browser issues)RUN npx playwright install chromium

COPY . .

## ScriptsEXPOSE 3000

CMD ["npm", "start"]

- `npm start` - Start production server```

- `npm run dev` - Start with auto-restart on changes

- `npm run install-browsers` - Install Playwright browsers### PM2 Process Manager

- `npm run health` - Quick health check via curl

- `npm run clean` - Remove all PNG files from uploads```bash

npm install -g pm2

## Dependenciespm2 start app.js --name screenshot-server

pm2 save

**Core:**pm2 startup

- **Express.js** - Web framework```

- **Playwright** - Browser automation

- **Helmet** - Security headers### Environment Variables for Production

- **CORS** - Cross-origin support

- **express-rate-limit** - Rate limiting```bash

NODE_ENV=production

## System RequirementsPORT=3000

UPLOADS_PATH=/app/uploads

- **Node.js**: 18.0.0 or higherSCREENSHOT_TIMEOUT=30000

- **RAM**: Minimum 1GB, recommended 2GB+RATE_LIMIT_MAX_REQUESTS=100

- **Storage**: ~500MB for browser binaries + screenshot storage```

- **OS**: Windows, macOS, or Linux

## Error Handling

## Troubleshooting

The API provides comprehensive error handling with appropriate HTTP status codes:

### Browser Issues

```bash- `400` - Bad Request (invalid URL, missing parameters)

# Reinstall browsers- `408` - Request Timeout

npm run install-browsers- `429` - Too Many Requests (rate limit)

- `500` - Internal Server Error

# Check browser status- `503` - Service Unavailable (browser issues)

npx playwright install --dry-run chromium

```## Performance & Scaling



### Performance Issues- **Browser Reuse**: Single browser instance handles all requests

- Monitor memory usage with `htop` or Task Manager- **Concurrent Processing**: Screenshots taken in parallel

- Check `uploads/` directory disk usage- **Memory Management**: Automatic context cleanup after each request

- Review rate limiting configuration- **Rate Limiting**: Configurable request limits per IP

- **Caching**: Static file caching with proper headers

### Permission Issues

- Ensure `uploads/` directory is writable## Security Features

- Verify Node.js has necessary system permissions

- Check firewall settings for port 3000- **Input Validation**: URL and parameter validation

- **Rate Limiting**: Prevents abuse and DoS attacks

## License- **Security Headers**: Helmet.js with CSP policies

- **File Access Control**: Restricted file serving

MIT License- **Request Logging**: Full audit trail

- **Graceful Shutdown**: Clean resource cleanup

---

## Troubleshooting

**API Documentation**: Visit `http://localhost:3000` for interactive endpoint documentation.
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
```````

# Website Screenshot Server

A production-ready Node.js API server that captures high-quality website screenshots across multiple devices using Playwright. Perfect for web development, testing, monitoring, and documentation purposes.

## Key Features

This is a production-grade solution designed for real-world applications with:

- **Smart Content Detection**: Automatically waits for lazy-loaded content, animations, and dynamic elements
- **Multi-Device Support**: Capture screenshots across mobile, tablet, laptop, and desktop viewports
- **Section Screenshots**: Target specific page elements with CSS selectors
- **Intelligent Cleanup**: Automatic file management with configurable retention policies
- **Enterprise Security**: Rate limiting, security headers, and comprehensive error handling
- **Performance Optimized**: Single browser instance with connection reuse for maximum efficiency

## Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **Operating System**: Windows, macOS, or Linux

### Installation

1. **Clone and install dependencies**

   ```bash
   git clone <your-repo-url>
   cd website-screenshot-server
   npm install
   ```

2. **Install browser binaries**

   ```bash
   npm run install-browsers
   ```

3. **Start the server**

   ```bash
   # Development mode (auto-restart on changes)
   npm run dev

   # Production mode
   npm start
   ```

The server will be available at `http://localhost:3000` with full API documentation.

## API Reference

### Core Endpoints

#### Capture Full-Page Screenshots

**POST** `/capture`

Capture complete website screenshots across multiple device types.

**Request:**

```json
{
  "url": "https://example.com",
  "devices": ["mobile", "tablet", "laptop", "desktop"],
  "fastMode": false
}
```

**Response:**

```json
{
  "success": true,
  "url": "https://example.com",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "total": 4,
    "successful": 4,
    "failed": 0
  },
  "screenshots": [
    {
      "device": "mobile",
      "url": "http://localhost:3000/uploads/2024-01-15_10-30-00_mobile_abc123.png",
      "viewport": { "width": 375, "height": 812 }
    },
    {
      "device": "desktop",
      "url": "http://localhost:3000/uploads/2024-01-15_10-30-00_desktop_def456.png",
      "viewport": { "width": 1920, "height": 1080 }
    }
  ]
}
```

#### Capture Section Screenshots

**POST** `/capture/section`

Capture specific page sections or elements using CSS selectors.

**Request:**

```json
{
  "url": "https://example.com",
  "devices": ["mobile", "desktop"],
  "selector": ".hero-section",
  "fastMode": false
}
```

**Response:**

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
      "url": "http://localhost:3000/uploads/2024-01-15_10-30-00_mobile_hero_section_abc123.png",
      "viewport": { "width": 375, "height": 812 },
      "selector": ".hero-section",
      "elementBounds": {
        "x": 0,
        "y": 100,
        "width": 375,
        "height": 400
      }
    }
  ]
}
```

#### Available Devices

**GET** `/capture/devices`

Get all available device presets and their configurations.

**Response:**

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

### Management Endpoints

#### Manual Cleanup

**POST** `/capture/cleanup`

Manually trigger cleanup of screenshots older than 10 hours.

**Response:**

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

#### Cleanup Status

**GET** `/capture/cleanup/status`

Get cleanup service status and statistics.

**Response:**

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

#### Health Check

**GET** `/health`

Server health and status information.

**Response:**

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

#### API Information

**GET** `/`

Complete API documentation and endpoint information.

#### Access Screenshots

**GET** `/uploads/{filename}`

Direct access to captured screenshot files with proper caching headers.

## Device Presets

| Device  | Resolution  | Scale | Mobile | Touch | Use Case                    |
| ------- | ----------- | ----- | ------ | ----- | --------------------------- |
| Mobile  | 375 × 812   | 2×    | ✓      | ✓     | iPhone-style mobile testing |
| Tablet  | 768 × 1024  | 2×    | ✓      | ✓     | iPad-style tablet testing   |
| Laptop  | 1366 × 768  | 1×    | ✗      | ✗     | Standard laptop screens     |
| Desktop | 1920 × 1080 | 1×    | ✗      | ✗     | Full desktop experience     |

## CSS Selector Guide

When capturing section screenshots, you can use various CSS selector types:

### Basic Selectors

```javascript
// Element selectors
"div", "section", "header", "main";

// Class selectors
".hero-section", ".main-content", ".navigation";

// ID selectors
"#banner", "#navigation", "#footer";
```

### Complex Selectors

```javascript
// Combined selectors
"section.hero", "header#main-header", "div.content-wrapper";

// Multiple classes (chained)
(".elementor-element.elementor-element-bb4cf52.e-flex.e-con-boxed");

// Data attributes (recommended for dynamic content)
"[data-id='bb4cf52']", "[data-element_type='container']";
```

### Important: Class Selector Formatting

When copying class names from HTML, format them correctly:

**Wrong (space-separated):**

```json
"selector": "elementor-element elementor-element-bb4cf52 e-flex e-con-boxed"
```

**Correct (chained with dots):**

```json
"selector": ".elementor-element.elementor-element-bb4cf52.e-flex.e-con-boxed"
```

**Alternative (data attribute - more reliable):**

```json
"selector": "[data-id='bb4cf52']"
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

### Section Screenshots

#### By Class

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["mobile", "desktop"], "selector": ".hero-section"}'
```

#### By ID

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["tablet"], "selector": "#main-banner"}'
```

#### Complex Selector

```bash
curl -X POST http://localhost:3000/capture/section \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["desktop"], "selector": "section.hero#main-hero"}'
```

### Fast Mode

```bash
curl -X POST http://localhost:3000/capture \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "devices": ["desktop"], "fastMode": true}'
```

### Check Available Devices

```bash
curl http://localhost:3000/capture/devices
```

### Manual Cleanup

```bash
curl -X POST http://localhost:3000/capture/cleanup
```

### Health Check

```bash
curl http://localhost:3000/health
```

## Configuration

### Environment Variables

Create a `.env` file to customize the server behavior:

```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Screenshot Settings
SCREENSHOT_TIMEOUT=30000
FAST_MODE=false
PAGE_TIMEOUT_MS=30000

# Cleanup Settings
CLEANUP_INTERVAL_HOURS=10

# Uploads Directory
UPLOADS_PATH=./uploads

# Advanced Wait Settings
NETWORK_IDLE_TIMEOUT_MS=12000
ANIMATION_TIMEOUT_MS=5000
LAZY_CONTENT_TIMEOUT_MS=12000
STABILITY_TIMEOUT_MS=8000
STABILITY_CHECKS=2
MAX_RETRIES=2
API_WAIT_TIMEOUT_MS=12000

# Watchdog Settings
CAPTURE_WATCHDOG_MS=60000
```

### Performance Tuning

#### Fast Mode

Enable fast mode for quicker screenshots with reduced quality:

```json
{
  "url": "https://example.com",
  "devices": ["desktop"],
  "fastMode": true
}
```

#### Custom Timeouts

Adjust timeouts based on your website's loading characteristics:

```bash
# For slow-loading sites
PAGE_TIMEOUT_MS=60000
NETWORK_IDLE_TIMEOUT_MS=20000

# For fast sites
PAGE_TIMEOUT_MS=15000
NETWORK_IDLE_TIMEOUT_MS=5000
```

## Architecture

### Project Structure

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

### Key Components

#### BrowserManager

- **Single Instance**: Reuses one Chromium browser for all requests
- **Context Isolation**: Creates separate contexts for each device
- **Resource Management**: Automatic cleanup and memory management

#### ScreenshotService

- **Smart Waiting**: Waits for content, animations, and API calls
- **Lazy Loading**: Triggers lazy-loaded content and images
- **Error Handling**: Comprehensive retry logic and error recovery

#### CleanupService

- **Scheduled Cleanup**: Runs every 12 hours automatically
- **Manual Triggers**: On-demand cleanup via API
- **Smart Detection**: Uses both filename parsing and file modification time

## Security Features

### Built-in Security

- **Helmet.js**: Comprehensive security headers including CSP
- **Rate Limiting**: 1000 requests per 15-minute window per IP
- **CORS**: Configurable cross-origin resource sharing
- **Input Validation**: URL and parameter sanitization
- **Path Traversal Protection**: Prevents directory traversal attacks
- **File Type Validation**: Only PNG files allowed for uploads

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
```

## Performance Features

### Optimization Strategies

- **Browser Reuse**: Single Chromium instance for all requests
- **Parallel Processing**: Concurrent screenshot capture across devices
- **Smart Waiting**: Intelligent content detection and loading strategies
- **Memory Management**: Automatic context cleanup after requests
- **File Caching**: Proper cache headers for uploaded images
- **Request Deduplication**: Removes duplicate devices from requests

### Performance Monitoring

- **Request Tracking**: Unique request IDs for debugging
- **Response Times**: Detailed logging of request duration
- **Memory Usage**: Browser process monitoring
- **Error Tracking**: Comprehensive error logging and reporting

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads

# Set proper permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: "3.8"

services:
  screenshot-server:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
      - ./.env:/app/.env
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Process Management

### PM2 (Recommended for Production)

#### Installation

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

#### Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "screenshot-server",
      script: "app.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "development",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_file: "./logs/combined.log",
      time: true,
      max_memory_restart: "1G",
      node_args: "--max-old-space-size=4096",
    },
  ],
};
```

#### Usage

```bash
# Start application
pm2 start ecosystem.config.js

# Start in production mode
pm2 start ecosystem.config.js --env production

# Monitor application
pm2 monit

# View logs
pm2 logs screenshot-server

# Restart application
pm2 restart screenshot-server

# Stop application
pm2 stop screenshot-server

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## Nginx Configuration

### Basic Configuration

Create `/etc/nginx/sites-available/screenshot-server`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=screenshot:10m rate=10r/s;
    limit_req zone=screenshot burst=20 nodelay;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static files caching
    location /uploads/ {
        proxy_pass http://localhost:3000;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
}
```

## Development

### Available Scripts

```bash
# Start production server
npm start

# Start development server (auto-restart)
npm run dev

# Install Playwright browsers
npm run install-browsers

# Quick health check
npm run health

# Clean all screenshots
npm run clean
```

### Development Tips

1. **Use Fast Mode**: Enable `fastMode: true` for quicker development iterations
2. **Monitor Logs**: Check console output for detailed request information
3. **Test Selectors**: Use browser dev tools to verify CSS selectors before API calls
4. **Health Checks**: Use `/health` endpoint to monitor server status

## Troubleshooting

### Common Issues

#### Browser Installation Problems

```bash
# Reinstall browser binaries
npm run install-browsers

# Check browser installation
npx playwright install --dry-run chromium
```

#### Memory Issues

- Increase Node.js memory limit: `node --max-old-space-size=4096 app.js`
- Monitor browser processes with `htop` or Task Manager
- Adjust concurrent request limits

#### Permission Issues

- Ensure uploads directory is writable: `chmod 755 uploads/`
- Check file system permissions
- Verify browser can access system resources

#### Performance Issues

- Monitor memory usage with system tools
- Check `uploads/` directory disk usage
- Review rate limiting configuration

### Error Codes

| Code               | Description                           | Solution                                           |
| ------------------ | ------------------------------------- | -------------------------------------------------- |
| `MISSING_URL`      | URL parameter required                | Provide valid URL in request body                  |
| `INVALID_DEVICES`  | Invalid device type                   | Use valid devices: mobile, tablet, laptop, desktop |
| `MISSING_SELECTOR` | Selector required for section capture | Provide CSS selector for section screenshots       |
| `INVALID_SELECTOR` | Invalid CSS selector format           | Use proper CSS selector syntax                     |
| `CAPTURE_TIMEOUT`  | Screenshot capture timed out          | Increase timeout or check website accessibility    |
| `BROWSER_ERROR`    | Browser service unavailable           | Check browser installation and restart server      |

## Monitoring & Logging

### Request Logging

Every request is logged with:

- Unique request ID
- HTTP method and URL
- Client IP address
- Response status code
- Processing duration

### Health Monitoring

- Server uptime tracking
- Browser connection status
- Memory usage monitoring
- Error rate tracking

### Cleanup Monitoring

- Automatic cleanup schedule
- Manual cleanup triggers
- File deletion statistics
- Error tracking and reporting

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require("axios");

async function captureScreenshot(url, devices) {
  try {
    const response = await axios.post("http://localhost:3000/capture", {
      url,
      devices,
      fastMode: false,
    });

    console.log("Screenshots:", response.data.screenshots);
    return response.data;
  } catch (error) {
    console.error("Error:", error.response.data);
    throw error;
  }
}

// Usage
captureScreenshot("https://example.com", ["mobile", "desktop"]);
```

### Python

```python
import requests
import json

def capture_screenshot(url, devices):
    response = requests.post('http://localhost:3000/capture',
        json={
            'url': url,
            'devices': devices,
            'fastMode': False
        }
    )

    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error: {response.json()}")

# Usage
result = capture_screenshot('https://example.com', ['mobile', 'desktop'])
print(result['screenshots'])
```

### PHP

```php
<?php
function captureScreenshot($url, $devices) {
    $data = json_encode([
        'url' => $url,
        'devices' => $devices,
        'fastMode' => false
    ]);

    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\n",
            'method' => 'POST',
            'content' => $data
        ]
    ];

    $context = stream_context_create($options);
    $result = file_get_contents('http://localhost:3000/capture', false, $context);

    return json_decode($result, true);
}

// Usage
$result = captureScreenshot('https://example.com', ['mobile', 'desktop']);
print_r($result['screenshots']);
?>
```

## Best Practices

### API Usage

1. **Use appropriate timeouts** for your use case
2. **Enable fast mode** for development and testing
3. **Check health endpoint** before making requests
4. **Handle errors gracefully** with proper error codes
5. **Respect rate limits** and implement backoff strategies

### Selector Best Practices

1. **Use data attributes** when available (more reliable)
2. **Test selectors** in browser dev tools first
3. **Avoid complex selectors** when simple ones work
4. **Use specific selectors** to avoid ambiguity
5. **Consider mobile/desktop differences** in element visibility

### Performance Optimization

1. **Use fast mode** for non-critical captures
2. **Batch requests** when possible
3. **Monitor memory usage** in production
4. **Implement caching** for frequently accessed screenshots
5. **Use appropriate device sets** for your needs

### Error Handling

1. **Check response status** before processing
2. **Handle timeout errors** with retry logic
3. **Validate selectors** before making requests
4. **Implement fallback strategies** for critical captures
5. **Monitor error rates** and adjust accordingly

## Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests if applicable
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and patterns
- Add comprehensive error handling
- Include relevant tests
- Update documentation for new features
- Ensure backward compatibility

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Playwright** - For the excellent browser automation framework
- **Express.js** - For the robust web framework
- **Node.js** - For the powerful runtime environment

## Support

- **Documentation**: Visit `http://localhost:3000` for interactive API docs
- **Health Check**: Use `/health` endpoint for server status
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Logs**: Check console output for detailed error information

---

**Ready to capture the web?** Start with a simple screenshot and explore the full power of this production-ready screenshot API!

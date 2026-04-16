# NEON FIFA PRO - Installation & Deployment Guide
## Complete Full-Stack Futuristic AI Football Game

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Local Development](#local-development)
3. [Web Deployment](#web-deployment)
4. [Mobile Deployment](#mobile-deployment)
5. [Desktop Deployment](#desktop-deployment)
6. [Console Deployment](#console-deployment)
7. [Database Setup](#database-setup)
8. [Environment Configuration](#environment-configuration)
9. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Redis 7+
- npm or yarn
- Git

### Installation (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/neon-fifa-pro.git
cd neon-fifa-pro

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Start services with Docker
docker-compose up -d

# 5. Initialize database
npm run migrate

# 6. Start development servers
npm run dev:backend    # Terminal 1 - Backend on :8080
npm run dev:frontend   # Terminal 2 - Frontend on :3000

# 7. Open browser
# Visit http://localhost:3000
```

---

## 💻 Local Development

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start PostgreSQL (if not using Docker)
brew services start postgresql  # macOS
sudo systemctl start postgresql # Linux

# Start Redis
brew services start redis       # macOS
sudo systemctl start redis      # Linux

# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Start development server
npm run dev
```

**Backend runs on:** `http://localhost:8080`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Frontend runs on:** `http://localhost:3000`

### Database Setup

```bash
# Create database
createdb neon_fifa_pro

# Run schema
psql -d neon_fifa_pro -f database-schema.sql

# Or use migration tool
npm run migrate
```

---

## 🌐 Web Deployment

### Option 1: Vercel (Easiest)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod

# Deploy backend (serverless)
cd backend
vercel --prod
```

**Environment Variables in Vercel:**
- Add all `.env` variables in Vercel dashboard
- Set `DATABASE_URL` to your production database

### Option 2: AWS (Production)

#### Backend on EC2 + RDS

```bash
# 1. Launch EC2 instance (Ubuntu 22.04)
ssh -i your-key.pem ubuntu@your-ec2-ip

# 2. Install dependencies
sudo apt update
sudo apt install -y nodejs npm postgresql-client redis-tools nginx

# 3. Clone and setup
git clone https://github.com/yourusername/neon-fifa-pro.git
cd neon-fifa-pro/backend
npm install --production

# 4. Setup environment
nano .env
# Configure with RDS database URL

# 5. Setup PM2 for process management
npm install -g pm2
pm2 start server.js --name neon-fifa-backend
pm2 startup
pm2 save

# 6. Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/neon-fifa

# Add configuration:
server {
    listen 80;
    server_name api.neonfifa.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/neon-fifa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 7. Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.neonfifa.com
```

#### Frontend on S3 + CloudFront

```bash
# 1. Build production bundle
cd frontend
npm run build

# 2. Create S3 bucket
aws s3 mb s3://neonfifa-frontend

# 3. Configure bucket for static hosting
aws s3 website s3://neonfifa-frontend \
    --index-document index.html \
    --error-document index.html

# 4. Upload build files
aws s3 sync dist/ s3://neonfifa-frontend --acl public-read

# 5. Create CloudFront distribution
aws cloudfront create-distribution \
    --origin-domain-name neonfifa-frontend.s3.amazonaws.com

# 6. Configure custom domain and SSL
```

### Option 3: Docker + DigitalOcean

```bash
# 1. Create Droplet (Ubuntu 22.04)
# SSH into droplet

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
git clone https://github.com/yourusername/neon-fifa-pro.git
cd neon-fifa-pro

# 5. Configure environment
cp .env.example .env
nano .env

# 6. Start services
docker-compose up -d

# 7. Setup domain and SSL
# Point domain to droplet IP
# Use Nginx proxy manager or Traefik for SSL
```

---

## 📱 Mobile Deployment

### React Native Setup

```bash
# 1. Initialize React Native project
npx react-native init NeonFifaPro
cd NeonFifaPro

# 2. Install dependencies
npm install @react-native-async-storage/async-storage
npm install react-native-websocket
npm install @react-navigation/native
npm install react-native-gesture-handler
npm install react-native-game-engine

# 3. Copy game logic
cp ../frontend/src/game-3d.jsx ./src/

# 4. Adapt for mobile
# - Replace canvas with react-native-canvas
# - Add touch controls
# - Optimize performance

# 5. Build for iOS
cd ios
pod install
cd ..
npx react-native run-ios

# 6. Build for Android
npx react-native run-android
```

### iOS App Store Deployment

```bash
# 1. Open Xcode
open ios/NeonFifaPro.xcworkspace

# 2. Configure app settings
# - Bundle ID: com.yourcompany.neonfifa
# - Version: 1.0.0
# - Signing: Add your Apple Developer account

# 3. Archive app
# Product > Archive

# 4. Upload to App Store Connect
# Window > Organizer > Upload

# 5. Submit for review in App Store Connect
```

### Android Play Store Deployment

```bash
# 1. Generate signing key
keytool -genkeypair -v -storetype PKCS12 \
  -keystore neon-fifa-key.keystore \
  -alias neon-fifa-key \
  -keyalg RSA -keysize 2048 -validity 10000

# 2. Configure Gradle
# Edit android/app/build.gradle:
android {
    signingConfigs {
        release {
            storeFile file('neon-fifa-key.keystore')
            storePassword 'your-password'
            keyAlias 'neon-fifa-key'
            keyPassword 'your-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}

# 3. Build release APK
cd android
./gradlew assembleRelease

# 4. Build App Bundle (recommended)
./gradlew bundleRelease

# 5. Upload to Play Console
# Go to play.google.com/console
# Create app > Upload bundle
```

### Progressive Web App (PWA)

```bash
# 1. Add service worker
# Create public/sw.js

const CACHE_NAME = 'neon-fifa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

# 2. Add manifest.json
{
  "name": "Neon FIFA Pro",
  "short_name": "Neon FIFA",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0e1a",
  "theme_color": "#00ffff"
}

# 3. Register service worker in index.html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
</script>

# 4. Deploy and users can "Add to Home Screen"
```

---

## 🖥️ Desktop Deployment

### Electron (Windows, macOS, Linux)

```bash
# 1. Install Electron
npm install electron electron-builder --save-dev

# 2. Create main.js
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true
    }
  });

  win.loadURL('http://localhost:3000'); // Dev
  // win.loadFile('dist/index.html'); // Production
}

app.whenReady().then(createWindow);

# 3. Add build config to package.json
{
  "build": {
    "appId": "com.neonfifa.game",
    "productName": "Neon FIFA Pro",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "dist/**/*",
      "main.js"
    ],
    "mac": {
      "category": "public.app-category.games",
      "icon": "build/icon.icns"
    },
    "win": {
      "icon": "build/icon.ico",
      "target": ["nsis"]
    },
    "linux": {
      "icon": "build/icon.png",
      "target": ["AppImage", "deb"]
    }
  }
}

# 4. Build for all platforms
npm run build:electron

# Windows installer
npm run build:electron -- --win

# macOS app
npm run build:electron -- --mac

# Linux AppImage
npm run build:electron -- --linux
```

### Tauri (Lightweight alternative)

```bash
# 1. Install Tauri CLI
cargo install tauri-cli

# 2. Initialize Tauri
npm install @tauri-apps/cli @tauri-apps/api
npm run tauri init

# 3. Build
npm run tauri build

# Output in src-tauri/target/release/
```

---

## 🎮 Console Deployment

### Unity Port (PlayStation, Xbox, Switch)

```bash
# 1. Install Unity Hub
# Download from unity.com

# 2. Create new Unity project (3D)

# 3. Import game logic
# - Convert JavaScript to C#
# - Use Unity's Canvas for 2D
# - Use Unity's 3D engine for enhanced graphics

# 4. Setup for console
# File > Build Settings
# - Select target platform (PS5, Xbox Series, Switch)
# - Requires console SDK from manufacturer

# 5. Build
# - PS5: Requires PlayStation SDK
# - Xbox: Requires GDK (Game Development Kit)
# - Switch: Requires Nintendo SDK

# 6. Submit to platform
# - Sony PlayStation Developer Portal
# - Microsoft Partner Center
# - Nintendo Developer Portal
```

### Unreal Engine Port (High-end graphics)

```bash
# 1. Install Unreal Engine 5
# Download from epicgames.com

# 2. Create new game project
# - Template: Third Person
# - Blueprint or C++

# 3. Implement game logic
# - Use Blueprint for rapid development
# - C++ for performance-critical code

# 4. Package for console
# File > Package Project > PlayStation 5
# File > Package Project > Xbox Series X|S
```

---

## 🗄️ Database Setup

### PostgreSQL Installation

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb neon_fifa_pro
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb neon_fifa_pro
```

**Windows:**
```bash
# Download installer from postgresql.org
# Run installer
# Use pgAdmin to create database
```

### Database Migration

```bash
# Run initial schema
psql -d neon_fifa_pro -f database-schema.sql

# Or use migration tool
npm install -g db-migrate db-migrate-pg
db-migrate up
```

### Backup & Restore

```bash
# Backup
pg_dump neon_fifa_pro > backup.sql

# Restore
psql neon_fifa_pro < backup.sql
```

---

## ⚙️ Environment Configuration

### Production Environment Variables

```bash
# API
NODE_ENV=production
PORT=8080
API_URL=https://api.neonfifa.com

# Database (Use managed service in production)
DATABASE_URL=postgresql://user:pass@db-host:5432/neon_fifa_pro

# Redis (Use Redis Cloud or AWS ElastiCache)
REDIS_URL=redis://redis-host:6379

# Security
JWT_SECRET=generate-strong-random-secret-here
CORS_ORIGIN=https://neonfifa.com,https://www.neonfifa.com

# CDN for assets
CDN_URL=https://cdn.neonfifa.com

# Analytics
GOOGLE_ANALYTICS_ID=UA-XXXXXXXX-X

# Payment
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
```

---

## 🔧 Troubleshooting

### Common Issues

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL
```

**Issue: WebSocket connection failed**
```bash
# Check firewall
sudo ufw allow 8080

# Check nginx websocket config
# Add to location block:
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Issue: Build failed**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist .cache
npm run build
```

**Issue: High latency in multiplayer**
```bash
# Use Redis for session storage
# Enable WebSocket compression
# Deploy to regions closer to users
# Use CDN for static assets
```

---

## 📊 Performance Optimization

### Frontend
```bash
# Code splitting
npm install @loadable/component

# Image optimization
npm install sharp
npm install next-optimized-images

# Bundle analysis
npm run build -- --analyze
```

### Backend
```bash
# Enable compression
npm install compression

# Database connection pooling (already configured)

# Redis caching for frequent queries

# Use PM2 cluster mode
pm2 start server.js -i max
```

---

## 🚢 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
      
      - name: Deploy to production
        run: |
          # Your deployment script
          ssh deploy@server 'cd /app && git pull && npm install && pm2 restart all'
```

---

## 📱 Mobile Build Commands

### iOS
```bash
# Development build
npx react-native run-ios

# Release build
npx react-native run-ios --configuration Release

# Specific device
npx react-native run-ios --device "Your iPhone"
```

### Android
```bash
# Development build
npx react-native run-android

# Release build
cd android
./gradlew assembleRelease

# Install release APK
adb install app/build/outputs/apk/release/app-release.apk
```

---

## 🎯 Next Steps

1. **Security**: Add rate limiting, input validation, SQL injection prevention
2. **Monitoring**: Setup Sentry, New Relic, or DataDog
3. **Scaling**: Use Kubernetes for orchestration, load balancers
4. **Features**: Add tournaments, achievements, social features
5. **Monetization**: In-app purchases, battle passes, cosmetics

---

## 📚 Resources

- [Node.js Documentation](https://nodejs.org/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Docker Documentation](https://docs.docker.com)

---

## 🆘 Support

- Email: support@neonfifa.com
- Discord: discord.gg/neonfifa
- GitHub Issues: github.com/yourusername/neon-fifa-pro/issues

---

**Built with ❤️ by the Neon FIFA Pro Team**

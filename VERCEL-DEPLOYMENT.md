# VERCEL DEPLOYMENT GUIDE
## Deploy Neon FIFA Pro with Products Page

---

## 🚀 Quick Deploy (5 Minutes)

### Prerequisites
- GitHub account
- Vercel account (free: https://vercel.com/signup)
- Code pushed to GitHub repository

### One-Click Deploy

```bash
# 1. Push your code to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/neon-fifa-pro.git
git push -u origin main

# 2. Visit Vercel and import
# Go to: https://vercel.com/new
# Click "Import Git Repository"
# Select your neon-fifa-pro repo
# Click "Deploy"
```

**Done!** Your game is live at: `https://neon-fifa-pro.vercel.app`

---

## 📁 Project Structure for Vercel

```
neon-fifa-pro/
├── public/
│   ├── index.html              # Main game page
│   ├── products.html           # Products/Download page
│   ├── download.html           # Direct download page
│   └── assets/
│       ├── images/
│       ├── models/
│       └── sounds/
│
├── src/
│   ├── game-3d.jsx            # Main game component
│   ├── products-page.jsx      # Products page component
│   ├── components/
│   └── utils/
│
├── api/
│   ├── auth/
│   │   ├── login.js          # Serverless login
│   │   └── register.js       # Serverless register
│   ├── player/
│   │   └── profile.js        # Player data
│   └── teams/
│       └── index.js          # Teams API
│
├── vercel.json                # Vercel configuration
├── package.json
└── vite.config.js
```

---

## ⚙️ Configuration Files

### 1. vercel.json (Already Provided)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "dist" }
    }
  ],
  "routes": [
    {
      "src": "/products",
      "dest": "/products.html"
    },
    {
      "src": "/download",
      "dest": "/download.html"
    },
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

### 2. package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "vercel-build": "vite build"
  }
}
```

### 3. vite.config.js

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: 'index.html',
        products: 'products.html',
        download: 'download.html'
      }
    }
  },
  server: {
    port: 3000
  }
});
```

---

## 🌐 Setting Up Products Page

### Create Products HTML Page

**File: public/products.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neon FIFA Pro - Products & Downloads</title>
  <meta name="description" content="Download Neon FIFA Pro for Web, Mobile, Desktop, and Console. Play anywhere, anytime.">
  
  <!-- SEO -->
  <meta property="og:title" content="Neon FIFA Pro - Products & Downloads">
  <meta property="og:description" content="The future of football gaming on all platforms">
  <meta property="og:image" content="/assets/og-image.jpg">
  
  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  
  <script type="module" src="/src/products-entry.jsx"></script>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

### Create Products Entry Point

**File: src/products-entry.jsx**

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import ProductsPage from './products-page';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ProductsPage />
  </React.StrictMode>
);
```

---

## 🔐 Environment Variables

### Add to Vercel Dashboard

1. Go to: `https://vercel.com/your-username/neon-fifa-pro/settings/environment-variables`

2. Add these variables:

```bash
# API
VITE_API_URL=https://neon-fifa-api.vercel.app
VITE_WS_URL=wss://neon-fifa-api.vercel.app

# Database (Use Vercel Postgres or external)
DATABASE_URL=postgresql://user:password@host:5432/database

# Redis (Use Upstash Redis)
REDIS_URL=redis://default:password@host:6379

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this

# Football Data API (Optional - for real teams)
FOOTBALL_DATA_API_KEY=your-api-key-here

# Analytics
VITE_GA_ID=G-XXXXXXXXXX

# Feature Flags
VITE_ENABLE_MULTIPLAYER=true
VITE_ENABLE_MOBILE_APP=false
VITE_ENABLE_DESKTOP_APP=false
```

---

## 📱 Backend API Setup (Separate Deployment)

### Option 1: Vercel Serverless Functions

**File: api/teams/index.js**

```javascript
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Your teams logic
  const teams = await getTeams();
  
  res.status(200).json({ teams });
}
```

### Option 2: Separate Backend (Recommended)

Deploy backend separately on:
- **Railway** (easiest): https://railway.app
- **Render**: https://render.com
- **Fly.io**: https://fly.io

**Railway Deployment:**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL
railway add postgresql

# 5. Add Redis
railway add redis

# 6. Deploy
railway up

# 7. Get URL
railway domain
```

---

## 🗄️ Database Setup

### Option 1: Vercel Postgres

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add Postgres
vercel postgres create

# Run migrations
vercel postgres exec < database-schema.sql
```

### Option 2: Railway PostgreSQL

```bash
# Already included when you add PostgreSQL on Railway
# Just run migrations:
railway run psql < database-schema.sql
```

### Option 3: Supabase (Free Tier)

1. Go to https://supabase.com
2. Create new project
3. Get connection string
4. Add to Vercel env vars
5. Run migrations via Supabase dashboard

---

## 🎨 Custom Domain Setup

### Add Custom Domain

1. **Buy Domain** (Namecheap, GoDaddy, Google Domains)

2. **Add to Vercel:**
   - Go to project settings
   - Click "Domains"
   - Add: `neonfifapro.com`
   - Add: `www.neonfifapro.com`

3. **Update DNS:**
   
   **A Record:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```
   
   **CNAME Record:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Wait for SSL** (automatic, 24-48 hours)

---

## 📊 Analytics Setup

### Google Analytics

**File: public/index.html**

```html
<head>
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</head>
```

### Vercel Analytics (Built-in)

```bash
npm install @vercel/analytics

# In your main component:
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <YourGame />
      <Analytics />
    </>
  );
}
```

---

## 🚀 Deployment Workflow

### Automatic Deployments

Vercel automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push origin main

# Vercel automatically:
# 1. Detects push
# 2. Builds project
# 3. Deploys to production
# 4. Updates neonfifapro.com
```

### Preview Deployments

Every pull request gets a preview URL:

```bash
git checkout -b new-feature
git add .
git commit -m "Work in progress"
git push origin new-feature

# Create PR on GitHub
# Vercel creates: https://neon-fifa-pro-git-new-feature.vercel.app
```

---

## 🎯 Products Page Features

Your products page (already created) includes:

### ✅ Platform Selection
- Web Browser
- Mobile Apps (iOS/Android)
- Desktop (Windows/Mac/Linux)
- Game Consoles (PS5/Xbox/Switch)

### ✅ Download Buttons
- Platform-specific downloads
- "Coming Soon" badges
- Direct download links

### ✅ System Requirements
- Per-platform specs
- Clear compatibility info

### ✅ Feature Highlights
- What makes your game special
- Platform-specific features

### ✅ SEO Optimized
- Meta tags
- Open Graph tags
- Structured data

---

## 📱 Mobile App Download Flow

### iOS Download Setup

**File: public/download/ios**

Create redirect page:

```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=https://apps.apple.com/app/your-app-id">
  <title>Download for iOS</title>
</head>
<body>
  <p>Redirecting to App Store...</p>
  <p>If not redirected, <a href="https://apps.apple.com/app/your-app-id">click here</a></p>
</body>
</html>
```

### Android Download Setup

```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=https://play.google.com/store/apps/details?id=com.neonfifa.game">
  <title>Download for Android</title>
</head>
<body>
  <p>Redirecting to Google Play...</p>
</body>
</html>
```

### Direct APK Download (Beta Testing)

```javascript
// In products page
const downloadApk = () => {
  const link = document.createElement('a');
  link.href = '/downloads/neon-fifa-pro.apk';
  link.download = 'neon-fifa-pro.apk';
  link.click();
};
```

---

## 🔍 SEO Optimization

### sitemap.xml

**File: public/sitemap.xml**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://neonfifapro.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://neonfifapro.com/products</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://neonfifapro.com/download</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://neonfifapro.com/play</loc>
    <priority>1.0</priority>
  </url>
</urlset>
```

### robots.txt

**File: public/robots.txt**

```
User-agent: *
Allow: /
Sitemap: https://neonfifapro.com/sitemap.xml
```

---

## 📈 Performance Optimization

### Enable Vercel Features

1. **Edge Functions** - Faster response times
2. **Image Optimization** - Automatic WebP conversion
3. **Automatic Minification** - Smaller bundles
4. **Gzip/Brotli** - Compression
5. **CDN** - Global distribution

### Code Splitting

```javascript
// Lazy load heavy components
const Game3D = lazy(() => import('./game-3d'));
const ProductsPage = lazy(() => import('./products-page'));

<Suspense fallback={<Loading />}>
  <Game3D />
</Suspense>
```

---

## 🧪 Testing Before Launch

### Local Testing

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Run local dev server
vercel dev

# 3. Test routes:
# http://localhost:3000
# http://localhost:3000/products
# http://localhost:3000/download
# http://localhost:3000/api/teams
```

### Preview Deployment

```bash
# Deploy to preview URL
vercel

# Gets unique URL like:
# https://neon-fifa-pro-abc123.vercel.app

# Test thoroughly before production
```

### Production Deployment

```bash
# Deploy to production
vercel --prod

# Or push to main branch (auto-deploy)
git push origin main
```

---

## ✅ Post-Deployment Checklist

- [ ] Website loads at custom domain
- [ ] Products page accessible at /products
- [ ] Download links work (or show "Coming Soon")
- [ ] API endpoints responding
- [ ] Database connected
- [ ] Environment variables set
- [ ] SSL certificate active (https://)
- [ ] Analytics tracking
- [ ] Sitemap submitted to Google
- [ ] Mobile responsive
- [ ] Game playable
- [ ] Multiplayer connecting (if enabled)

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Check Vercel build logs
vercel logs

# Common issues:
# 1. Missing dependencies -> npm install
# 2. Environment variables -> Check Vercel dashboard
# 3. Build script -> Verify package.json
```

### 404 on Routes

```bash
# Ensure vercel.json has correct routes
# Check file paths match exactly
# Verify build output in dist/
```

### API Not Working

```bash
# Check CORS headers
# Verify environment variables
# Test API endpoint directly
# Check function logs
```

---

## 🎉 You're Live!

Your game is now deployed with:

✅ Professional products page  
✅ Platform-specific downloads  
✅ Auto-scaling infrastructure  
✅ Global CDN  
✅ SSL certificates  
✅ Automatic deployments  

**Share your game:**  
`https://neonfifapro.com`

---

**Questions?** Check Vercel docs: https://vercel.com/docs

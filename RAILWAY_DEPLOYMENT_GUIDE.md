# 🚂 Railway Deployment Guide — Rubens Auto Detail Platform

**Platform:** Railway.app
**Best For:** Fast deployment, excellent developer experience, generous free tier
**Estimated Setup Time:** 20-30 minutes

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Deploy Strapi Backend](#deploy-strapi-backend)
3. [Deploy Next.js Frontend](#deploy-nextjs-frontend)
4. [Configure Custom Domain](#configure-custom-domain)
5. [Create Admin Account for Client](#create-admin-account-for-client)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Troubleshooting](#troubleshooting)
8. [Pricing](#pricing)

---

## ✅ Prerequisites

Before starting, make sure you have:

- [ ] GitHub account
- [ ] Railway account (sign up at [railway.app](https://railway.app))
- [ ] Your code pushed to GitHub repository
- [ ] Domain name purchased (optional, for custom domain)
- [ ] All API keys ready (Stripe, Google Maps, Resend, etc.)

---

## 🎯 Part 1: Deploy Strapi Backend

### Step 1: Create New Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your GitHub
4. Click **"New Project"** button (top right)
5. Select **"Deploy from GitHub repo"**
6. Find and select your repository: `Rubens Auto detail platfomr`
7. Railway will ask: **"What would you like to deploy?"**
   - ⚠️ **Important:** Your repo has both `frontend` and `backend` folders
   - Railway can only deploy one at a time
   - We'll deploy backend first

### Step 2: Configure Backend Service

1. After selecting repo, Railway shows **"Configure"** screen
2. Set **Root Directory:**
   ```
   backend
   ```
   *(This tells Railway to only deploy the backend folder)*

3. Click **"Add variables"** (we'll set environment variables later)
4. Click **"Deploy"**

Railway will now:
- ✅ Detect it's a Strapi/Node.js project
- ✅ Install dependencies (`npm install`)
- ✅ Build the project (`npm run build`)
- ✅ Start the server (`npm run start`)

**Wait 2-3 minutes** for deployment to complete.

### Step 3: Add PostgreSQL Database

Strapi needs a database. Railway makes this super easy:

1. In your Railway project dashboard, click **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway creates a PostgreSQL database instantly
3. Click on the **PostgreSQL service** (purple icon)
4. Go to **"Connect"** tab
5. Copy the **"Postgres Connection URL"** (looks like `postgresql://user:pass@host:5432/db`)

### Step 4: Link Database to Backend

Railway automatically creates environment variables when you add a database:

1. Click on your **backend service** (not the database)
2. Go to **"Variables"** tab
3. You'll see Railway auto-generated database variables:
   - `PGHOST`
   - `PGPORT`
   - `PGUSER`
   - `PGPASSWORD`
   - `PGDATABASE`
   - `DATABASE_URL` *(most important - full connection string)*

### Step 5: Add Environment Variables

Now add all your other environment variables:

1. Still in **"Variables"** tab
2. Click **"Raw Editor"** (top right, easier to paste everything)
3. Copy and paste these variables:

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
HOST=0.0.0.0
PORT=${{PORT}}

# Strapi Secrets (copy from your local backend/.env)
APP_KEYS=8FLaG9JQFH1dWASiz0jiHQ==,4nAafVHxWc3i9hqeulCevA==,HR2JG0HFeYFtRXZ6jPz8rA==,DKhQpnBai/D4PNxZ8MKOBw==
API_TOKEN_SALT=c7/vmwK1g/+rjCmvpXK88A==
ADMIN_JWT_SECRET=fsrdEKtatQrAGen+rxlEhg==
TRANSFER_TOKEN_SALT=1ZQfVdWd7ZUWtKVE+851RA==
ENCRYPTION_KEY=MZvr+Fl1BA6FncNny92Kjg==
JWT_SECRET=l8IuoMxzZgdlL6xjj0xGhg==

# Database (Railway auto-provides DATABASE_URL)
DATABASE_CLIENT=postgres
DATABASE_SSL=false

# Stripe Configuration (Get from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CONNECT_CLIENT_ID_HERE
PLATFORM_FEE_PERCENTAGE=15

# Frontend URL (we'll update this after deploying frontend)
FRONTEND_URL=https://your-frontend.vercel.app

# Google Translate API
GOOGLE_TRANSLATE_API_KEY=AIzaSyAvpvwv_x-vEVm4iBvmSc1CiR_wgH9Xcs0

# Email Notifications (Resend)
RESEND_API_KEY=re_V5VUmVWy_DKnF76VwirEpFqpzSfismXN2
FROM_EMAIL=onboarding@resend.dev
SUPPORT_EMAIL=support@rubensautodetail.com

# Supabase Storage
SUPABASE_API_URL=https://ihrxhuyjhdesgadpowus.supabase.co
SUPABASE_API_KEY=sbp_855cc20c9c1a9cd6824c4386201df60e6c3a4b97
SUPABASE_BUCKET=strapi-uploads
```

4. Click **"Save"** or **"Update Variables"**
5. Railway will **automatically redeploy** with new environment variables

### Step 6: Get Your Backend URL

1. After deployment completes (2-3 min), click on your **backend service**
2. Go to **"Settings"** tab
3. Scroll to **"Domains"** section
4. You'll see something like:
   ```
   https://rubens-auto-detail-backend-production.up.railway.app
   ```
5. **Copy this URL** — you'll need it for:
   - Accessing Strapi admin panel
   - Configuring frontend to connect to backend

### Step 7: Test Backend Deployment

1. Open your backend URL in browser:
   ```
   https://your-backend.up.railway.app
   ```
   You should see:
   ```json
   {
     "data": {
       "status": "ok"
     }
   }
   ```

2. Access Strapi admin panel:
   ```
   https://your-backend.up.railway.app/admin
   ```
   You should see the **"Create your first administrator"** screen ✅

### Step 8: Run Database Migrations (If Needed)

If your Strapi admin shows errors or collections are missing:

1. Go to Railway project → **backend service** → **"Deployments"** tab
2. Click on the latest deployment
3. Click **"View Logs"**
4. Look for migration errors

**To manually run migrations:**
1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```
2. Link to your project:
   ```bash
   railway login
   railway link
   ```
3. Run migrations:
   ```bash
   railway run npm run strapi -- migrate
   ```

---

## 🌐 Part 2: Deploy Next.js Frontend

### Step 1: Create Frontend Service in Railway

**Option A: Add to Existing Project (Recommended)**
1. In your Railway project dashboard, click **"New"** → **"GitHub Repo"**
2. Select the **same repository** again
3. Railway asks: **"What would you like to deploy?"**
4. Set **Root Directory:**
   ```
   frontend
   ```
5. Click **"Deploy"**

**Option B: Create Separate Project**
1. Create new Railway project
2. Deploy from GitHub repo
3. Set root directory to `frontend`

### Step 2: Add Frontend Environment Variables

1. Click on **frontend service** → **"Variables"** tab
2. Click **"Raw Editor"**
3. Paste these variables:

```bash
# Next.js
NODE_ENV=production
NEXT_PUBLIC_DEFAULT_LANG=en

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://ihrxhuyjhdesgadpowus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_8gWSWksG23E3in30-Buoyg_SULYJdUm

# Strapi Backend (UPDATE THIS with your Railway backend URL)
NEXT_PUBLIC_STRAPI_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app

# Strapi API Token (generate this in Strapi admin after Step 3)
NEXT_PUBLIC_STRAPI_API_TOKEN=your-strapi-api-token-here
STRAPI_API_TOKEN=your-strapi-api-token-here

# Stripe Publishable Key (from Stripe dashboard)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Google Maps API Key (from Google Cloud Console)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy_YOUR_REAL_KEY_HERE
```

4. Click **"Update Variables"**
5. Railway redeploys frontend automatically

### Step 3: Get Frontend URL

1. After deployment completes, go to **Settings** → **Domains**
2. Copy your frontend URL:
   ```
   https://rubens-auto-detail-frontend.up.railway.app
   ```

### Step 4: Update Backend FRONTEND_URL

1. Go back to **backend service** → **Variables**
2. Update `FRONTEND_URL`:
   ```bash
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
3. Save (backend will redeploy)

### Step 5: Test Frontend

1. Visit your frontend URL
2. Test the booking flow
3. Check browser console for errors

---

## 🌍 Part 3: Configure Custom Domain (Optional)

### For Backend (Strapi Admin)

1. Buy domain: `rubensautodetail.com` (Namecheap, GoDaddy, etc.)
2. In Railway:
   - Go to **backend service** → **Settings** → **Domains**
   - Click **"Custom Domain"**
   - Enter: `api.rubensautodetail.com` or `admin.rubensautodetail.com`
   - Railway shows DNS instructions
3. In your domain registrar (Namecheap, etc.):
   - Go to DNS settings
   - Add **CNAME record:**
     ```
     Type: CNAME
     Host: api (or admin)
     Value: your-backend.up.railway.app
     TTL: Automatic
     ```
4. Wait 5-30 minutes for DNS propagation
5. Railway automatically provisions **SSL certificate** (free)

**Admin panel now accessible at:** `https://api.rubensautodetail.com/admin` ✅

### For Frontend

**Better Option:** Deploy frontend to **Vercel** (optimized for Next.js)

But if you want Railway:
1. Go to **frontend service** → **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter: `rubensautodetail.com` or `www.rubensautodetail.com`
4. Add DNS records in your domain registrar:
   ```
   Type: CNAME
   Host: @ (or www)
   Value: your-frontend.up.railway.app
   ```

**Frontend now accessible at:** `https://rubensautodetail.com` ✅

---

## 👤 Part 4: Create Admin Account for Client

### Step 1: Access Strapi Admin Panel

1. Go to your backend URL:
   ```
   https://your-backend.up.railway.app/admin
   ```
   (or `https://api.rubensautodetail.com/admin` if you set up custom domain)

### Step 2: Create First Administrator

1. You'll see **"Welcome to Strapi"** screen
2. Fill in the form:
   - **First name:** Client's first name (e.g., "Ruben")
   - **Last name:** Client's last name (e.g., "Garcia")
   - **Email:** Client's email (e.g., `owner@rubensautodetail.com`)
   - **Password:** Generate strong password (use 1Password or LastPass)
     - Example: `Rb#9mK$2nL@5pQ8w` (16+ characters)
   - **Confirm Password:** Repeat password
3. Click **"Let's start"**

### Step 3: Enable Two-Factor Authentication

1. After login, click on your profile (bottom left)
2. Go to **"Profile"** → **"Two-Factor Authentication"**
3. Click **"Enable 2FA"**
4. Scan QR code with Google Authenticator or Authy
5. Enter 6-digit code to confirm
6. Save recovery codes in safe place

### Step 4: Send Credentials to Client (Secure Method)

**Option A: Use Password Manager (Recommended)**
1. Save credentials in **1Password** or **LastPass**
2. Share secure link with client
3. Link expires after 7 days or first view

**Option B: Email + SMS (Less Secure)**
1. Email client the admin panel URL + their email
2. SMS them the password separately
3. Ask them to change password on first login

**Template Email:**
```
Subject: Your Rubens Auto Detail Admin Panel Access

Hi [Client Name],

Your content management system is ready! Here's how to access it:

Admin Panel URL: https://api.rubensautodetail.com/admin
Email: owner@rubensautodetail.com
Password: [sent separately via SMS]

Instructions:
1. Visit the URL above
2. Log in with your email and password
3. Change your password immediately (Profile → Settings → Change Password)
4. Enable Two-Factor Authentication for security (Profile → Two-Factor Authentication)

What you can do:
✅ Add/edit services and pricing
✅ Upload service images
✅ View and manage bookings
✅ Approve contractor applications
✅ Manage service zones (ZIP codes)

I've attached a quick video tutorial showing you how to use the admin panel.

Let me know if you have any questions!

Best,
Omar
```

---

## 📝 Part 5: Environment Variables Reference

### Backend (Railway)

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | `production` | ✅ | Environment |
| `HOST` | `0.0.0.0` | ✅ | Server host |
| `PORT` | `${{PORT}}` | ✅ | Railway auto-assigns |
| `DATABASE_URL` | `postgresql://...` | ✅ | Railway auto-provides |
| `APP_KEYS` | `key1,key2,key3` | ✅ | Strapi secrets |
| `STRIPE_SECRET_KEY` | `sk_test_...` | ✅ | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ✅ | Stripe webhooks |
| `RESEND_API_KEY` | `re_...` | ✅ | Email notifications |
| `GOOGLE_TRANSLATE_API_KEY` | `AIza...` | ⚠️ | Auto-translation |
| `FRONTEND_URL` | `https://...` | ✅ | CORS/redirects |

### Frontend (Railway or Vercel)

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `NEXT_PUBLIC_STRAPI_URL` | `https://api...` | ✅ | Backend URL |
| `NEXT_PUBLIC_STRAPI_API_TOKEN` | `token123` | ✅ | Strapi API token |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | ✅ | Stripe public key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIza...` | ✅ | Google Maps |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...` | ✅ | Supabase auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | ✅ | Supabase auth |

---

## 🐛 Troubleshooting

### Issue 1: "Application failed to respond"

**Cause:** Strapi isn't starting properly

**Fix:**
1. Check logs: Railway project → backend service → **"Deployments"** → **"View Logs"**
2. Look for errors like:
   - `Error: Missing APP_KEYS` → Add APP_KEYS to environment variables
   - `Database connection failed` → Check DATABASE_URL is set
   - `Port already in use` → Railway should auto-assign port

### Issue 2: Admin panel shows "An error occurred"

**Cause:** Database not migrated

**Fix:**
```bash
railway login
railway link
railway run npm run strapi -- migrate
```

### Issue 3: Frontend can't connect to backend

**Cause:** CORS error or wrong `NEXT_PUBLIC_STRAPI_URL`

**Fix:**
1. Check browser console for error:
   ```
   Access to fetch at 'https://backend...' from origin 'https://frontend...'
   has been blocked by CORS policy
   ```
2. Update `backend/config/middlewares.ts`:
   ```typescript
   export default [
     'strapi::errors',
     {
       name: 'strapi::security',
       config: {
         contentSecurityPolicy: {
           useDefaults: true,
           directives: {
             'connect-src': ["'self'", 'https:'],
             'img-src': ["'self'", 'data:', 'blob:', 'https:'],
             'media-src': ["'self'", 'data:', 'blob:', 'https:'],
             upgradeInsecureRequests: null,
           },
         },
       },
     },
     {
       name: 'strapi::cors',
       config: {
         enabled: true,
         origin: ['https://your-frontend.up.railway.app', 'https://rubensautodetail.com'],
       },
     },
     // ... other middlewares
   ];
   ```
3. Commit and push changes
4. Railway auto-redeploys

### Issue 4: Images not uploading

**Cause:** Railway has **ephemeral filesystem** (files deleted on redeploy)

**Fix:** Use **Supabase Storage** (already configured in your project)
1. Uploads go to Supabase bucket `strapi-uploads`
2. Check `backend/config/plugins.ts` has Supabase upload provider
3. Verify `SUPABASE_API_URL` and `SUPABASE_API_KEY` are set

### Issue 5: Build fails with "Out of memory"

**Cause:** Railway free tier has memory limits

**Fix:**
1. Upgrade to Railway **Developer Plan** ($5/month)
2. Or optimize Strapi build:
   ```bash
   # In backend/package.json
   "scripts": {
     "build": "NODE_OPTIONS='--max-old-space-size=2048' strapi build"
   }
   ```

---

## 💰 Pricing

### Railway Free Tier ("Trial Plan")
- **$5 free credit per month**
- Usage-based pricing after free credit:
  - CPU: ~$0.000231/minute
  - RAM: ~$0.000231/GB-minute
  - **Typical cost for this project:** $5-15/month
- No credit card required for trial

### Railway Developer Plan
- **$5/month** base fee
- Includes **$5 usage credit**
- Better for production apps
- Priority support

### Estimated Monthly Cost
| Service | Free Tier | Developer Plan |
|---------|-----------|----------------|
| Backend (Strapi) | $5-10 | Included in $5 |
| Database (PostgreSQL) | Included | Included |
| Frontend (Next.js) | $3-5 | Included in $5 |
| **Total** | **$8-15** | **$5-10** |

**Recommendation:** Start with free tier, upgrade to Developer plan when ready for production.

### Cost Optimization Tips
1. **Deploy frontend to Vercel** (free, optimized for Next.js)
2. **Only run backend on Railway** (saves ~$3-5/month)
3. **Use Railway for staging, upgrade for production**

---

## ✅ Deployment Checklist

- [ ] Railway account created
- [ ] Backend deployed to Railway
- [ ] PostgreSQL database added and linked
- [ ] All backend environment variables set
- [ ] Backend URL tested (`/admin` loads)
- [ ] Admin account created for client
- [ ] Two-Factor Authentication enabled
- [ ] Frontend deployed (Railway or Vercel)
- [ ] Frontend environment variables set
- [ ] `NEXT_PUBLIC_STRAPI_URL` points to backend
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (auto by Railway)
- [ ] Client credentials sent securely
- [ ] Monitoring set up (Railway Metrics + Sentry)
- [ ] Backups enabled for database

---

## 🎯 Next Steps

1. ✅ **Test the Full Flow**
   - Create a test booking on production
   - Verify payment works
   - Check email notifications

2. ✅ **Train Your Client**
   - Record Loom video showing how to use Strapi admin
   - Create written guide for common tasks
   - Schedule 30-min onboarding call

3. ✅ **Set Up Monitoring**
   - Enable Railway Metrics (built-in)
   - Add Sentry for error tracking
   - Set up UptimeRobot for uptime monitoring

4. ✅ **Enable Backups**
   - Railway Pro includes automated backups
   - Or set up manual backups via `pg_dump`

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Strapi Deployment Docs](https://docs.strapi.io/dev-docs/deployment)
- [Railway Community Discord](https://discord.gg/railway)
- [Railway Status Page](https://status.railway.app)

---

**Deployment completed?** Check off Task 3.13 in `PRODUCTION_READINESS_TASKS.md` ✅

**Need help?** Contact Railway support or DM on Twitter [@Railway](https://twitter.com/Railway)

---

**Created:** February 17, 2026
**Last Updated:** February 17, 2026
**Author:** Omar (for Rubens Auto Detail Platform)

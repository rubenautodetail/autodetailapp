# 🎨 Render Deployment Guide — Rubens Auto Detail Platform

**Platform:** Render.com
**Best For:** Simple deployment, free tier with PostgreSQL, great for MVPs
**Estimated Setup Time:** 25-35 minutes

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
- [ ] Render account (sign up at [render.com](https://render.com))
- [ ] Your code pushed to GitHub repository
- [ ] Domain name purchased (optional, for custom domain)
- [ ] All API keys ready (Stripe, Google Maps, Resend, etc.)

---

## 🎯 Part 1: Deploy Strapi Backend

### Step 1: Create Render Account & New Web Service

1. Go to [render.com](https://render.com)
2. Click **"Get Started"** → **"Sign in with GitHub"**
3. Authorize Render to access your GitHub repositories
4. Click **"New +"** (top right) → **"Web Service"**
5. Click **"Connect account"** if this is your first time

### Step 2: Select Repository

1. Find your repository: `Rubens Auto detail platfomr`
2. Click **"Connect"**
3. Render shows configuration screen

### Step 3: Configure Backend Service

Fill in the configuration form:

| Field | Value |
|-------|-------|
| **Name** | `rubens-backend` (or any name you prefer) |
| **Region** | `Oregon (US West)` or closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` ⚠️ **Important!** |
| **Runtime** | `Node` (auto-detected) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | `Free` (for now) |

⚠️ **Critical:** Set **Root Directory** to `backend` so Render only deploys the backend folder!

### Step 4: Add Environment Variables

Scroll down to **"Environment Variables"** section:

Click **"Add Environment Variable"** and add these one by one:

```bash
# Node Environment
NODE_ENV=production

# Server Configuration
HOST=0.0.0.0
PORT=10000

# Strapi Secrets (copy from your local backend/.env)
APP_KEYS=8FLaG9JQFH1dWASiz0jiHQ==,4nAafVHxWc3i9hqeulCevA==,HR2JG0HFeYFtRXZ6jPz8rA==,DKhQpnBai/D4PNxZ8MKOBw==
API_TOKEN_SALT=c7/vmwK1g/+rjCmvpXK88A==
ADMIN_JWT_SECRET=fsrdEKtatQrAGen+rxlEhg==
TRANSFER_TOKEN_SALT=1ZQfVdWd7ZUWtKVE+851RA==
ENCRYPTION_KEY=MZvr+Fl1BA6FncNny92Kjg==
JWT_SECRET=l8IuoMxzZgdlL6xjj0xGhg==

# Database (we'll add this in Step 5 after creating database)
DATABASE_CLIENT=postgres
DATABASE_SSL=false

# Stripe Configuration (Get from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
STRIPE_CONNECT_CLIENT_ID=ca_YOUR_CONNECT_CLIENT_ID_HERE
PLATFORM_FEE_PERCENTAGE=15

# Frontend URL (we'll update after deploying frontend)
FRONTEND_URL=https://your-frontend.onrender.com

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

**Pro Tip:** Click **"Add from .env"** button and paste all variables at once!

### Step 5: Create PostgreSQL Database

Before clicking "Create Web Service", we need a database:

1. In a **new tab**, go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in the form:
   | Field | Value |
   |-------|-------|
   | **Name** | `rubens-database` |
   | **Database** | `rubens_db` |
   | **User** | `rubens_user` (auto-filled) |
   | **Region** | Same as your backend (Oregon) |
   | **PostgreSQL Version** | `16` (latest) |
   | **Instance Type** | `Free` |

4. Click **"Create Database"**
5. Wait 1-2 minutes for database to provision

### Step 6: Link Database to Backend

1. After database is created, click on it to open details
2. Scroll down to **"Connections"** section
3. Copy the **"Internal Database URL"** (starts with `postgresql://`)
   ```
   postgresql://rubens_user:password@hostname/rubens_db
   ```

4. Go back to your **backend web service configuration** tab
5. Add new environment variable:
   ```
   DATABASE_URL=postgresql://rubens_user:password@hostname/rubens_db
   ```
   (paste the Internal Database URL you just copied)

### Step 7: Deploy Backend

1. Scroll to bottom of backend configuration
2. Click **"Create Web Service"**
3. Render will now:
   - ✅ Clone your repository
   - ✅ Install dependencies (`npm install`)
   - ✅ Build Strapi (`npm run build`)
   - ✅ Start server (`npm run start`)

**Wait 5-7 minutes** for first deployment. Watch the logs in real-time.

### Step 8: Get Your Backend URL

1. After deployment succeeds (green checkmark ✅), look at top of page
2. You'll see your backend URL:
   ```
   https://rubens-backend.onrender.com
   ```
3. **Copy this URL** — you'll need it for:
   - Accessing Strapi admin panel
   - Configuring frontend

### Step 9: Test Backend

1. Visit your backend URL:
   ```
   https://rubens-backend.onrender.com
   ```
   You should see:
   ```json
   {
     "data": {
       "status": "ok"
     }
   }
   ```

2. Access Strapi admin:
   ```
   https://rubens-backend.onrender.com/admin
   ```
   You should see **"Create your first administrator"** screen ✅

⚠️ **Note:** Render free tier **spins down after 15 minutes of inactivity**. First request after spin-down takes 30-60 seconds. Upgrade to paid tier for always-on.

---

## 🌐 Part 2: Deploy Next.js Frontend

### Step 1: Create Frontend Web Service

1. Go to [render.com/dashboard](https://render.com/dashboard)
2. Click **"New +"** → **"Web Service"**
3. Select your **same repository** again
4. Click **"Connect"**

### Step 2: Configure Frontend Service

Fill in the form:

| Field | Value |
|-------|-------|
| **Name** | `rubens-frontend` |
| **Region** | Same as backend (Oregon) |
| **Branch** | `main` |
| **Root Directory** | `frontend` ⚠️ **Important!** |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | `Free` |

### Step 3: Add Frontend Environment Variables

Add these environment variables:

```bash
# Next.js
NODE_ENV=production
NEXT_PUBLIC_DEFAULT_LANG=en
PORT=10000

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://ihrxhuyjhdesgadpowus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_8gWSWksG23E3in30-Buoyg_SULYJdUm

# Strapi Backend (UPDATE with your Render backend URL)
NEXT_PUBLIC_STRAPI_URL=https://rubens-backend.onrender.com
NEXT_PUBLIC_API_URL=https://rubens-backend.onrender.com

# Strapi API Token (generate in Strapi admin after creating admin account)
NEXT_PUBLIC_STRAPI_API_TOKEN=your-token-will-go-here
STRAPI_API_TOKEN=your-token-will-go-here

# Stripe Publishable Key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy_YOUR_REAL_KEY_HERE
```

### Step 4: Deploy Frontend

1. Click **"Create Web Service"**
2. Wait 5-7 minutes for deployment
3. After success, copy your frontend URL:
   ```
   https://rubens-frontend.onrender.com
   ```

### Step 5: Update Backend FRONTEND_URL

1. Go to your **backend service** → **"Environment"** tab
2. Edit `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://rubens-frontend.onrender.com
   ```
3. Click **"Save Changes"**
4. Backend will auto-redeploy

### Step 6: Update CORS Configuration

Update `backend/config/middlewares.ts` to allow your frontend:

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
      origin: [
        'https://rubens-frontend.onrender.com',
        'https://rubensautodetail.com', // Add custom domain here
      ],
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
```

Commit and push to GitHub. Render auto-deploys on git push.

---

## 🌍 Part 3: Configure Custom Domain

### For Backend (Strapi Admin)

1. Go to your **backend service** → **"Settings"** tab
2. Scroll to **"Custom Domain"** section
3. Click **"Add Custom Domain"**
4. Enter your subdomain:
   ```
   api.rubensautodetail.com
   ```
   or
   ```
   admin.rubensautodetail.com
   ```
5. Render shows DNS instructions

### DNS Configuration (Your Domain Registrar)

1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Find **DNS Management** or **Advanced DNS**
3. Add a **CNAME record:**
   ```
   Type: CNAME
   Host: api (or admin)
   Value: rubens-backend.onrender.com
   TTL: Automatic or 3600
   ```
4. Save changes

### Verify Domain

1. Wait 5-30 minutes for DNS propagation (check with [dnschecker.org](https://dnschecker.org))
2. In Render, click **"Verify DNS"**
3. After verification, Render provisions **free SSL certificate** (auto)
4. ✅ Your admin panel is now at: `https://api.rubensautodetail.com/admin`

### For Frontend

**Recommended:** Deploy frontend to **Vercel** instead (optimized for Next.js, better performance)

But if you want Render:
1. Go to **frontend service** → **"Settings"** → **"Custom Domain"**
2. Add domain: `rubensautodetail.com` or `www.rubensautodetail.com`
3. Add CNAME record in your DNS:
   ```
   Type: CNAME
   Host: @ (or www)
   Value: rubens-frontend.onrender.com
   ```
4. Verify and wait for SSL

---

## 👤 Part 4: Create Admin Account for Client

### Step 1: Access Strapi Admin Panel

1. Go to your backend URL:
   ```
   https://rubens-backend.onrender.com/admin
   ```
   (or custom domain: `https://api.rubensautodetail.com/admin`)

2. ⚠️ **If it takes 30-60 seconds to load:** This is normal on Render free tier (service was sleeping)

### Step 2: Create First Administrator

1. Fill in the **"Welcome to Strapi"** form:
   - **First name:** Ruben (client's first name)
   - **Last name:** Garcia (client's last name)
   - **Email:** `owner@rubensautodetail.com` (client's email)
   - **Password:** Generate strong password (16+ characters)
     - Use password generator: [1password.com/password-generator](https://1password.com/password-generator)
     - Example: `Tr$9pL#2nK@8wQ5m`
   - **Confirm Password:** Repeat
2. Click **"Let's start"**

### Step 3: Generate API Token for Frontend

Frontend needs an API token to fetch data:

1. After logging in, go to **Settings** (left sidebar, bottom)
2. Click **"API Tokens"** (under Global Settings)
3. Click **"Create new API Token"**
4. Fill in:
   - **Name:** `Frontend Production Token`
   - **Description:** `Read-only token for frontend API calls`
   - **Token duration:** `Unlimited`
   - **Token type:** `Read-only` ⚠️ **Important for security**
5. Click **"Save"**
6. **Copy the token** (looks like: `a1b2c3d4e5f6g7h8i9j0...`)
7. ⚠️ **Save it now** — you can't see it again!

### Step 4: Add API Token to Frontend

1. Go to **frontend service** in Render → **"Environment"** tab
2. Edit these two variables:
   ```
   NEXT_PUBLIC_STRAPI_API_TOKEN=paste_token_here
   STRAPI_API_TOKEN=paste_token_here
   ```
3. Click **"Save Changes"**
4. Frontend will auto-redeploy

### Step 5: Enable Two-Factor Authentication

1. In Strapi admin, click your profile (bottom left)
2. Go to **"Profile"** → **"Two-Factor Authentication"**
3. Click **"Enable 2FA"**
4. Scan QR code with **Google Authenticator** or **Authy** app
5. Enter 6-digit code to confirm
6. **Save recovery codes** in a safe place (show to client)

### Step 6: Send Credentials to Client

**Secure Method (Recommended):**
Use a password manager like 1Password or LastPass to share credentials securely.

**Template Email:**
```
Subject: Your Rubens Auto Detail Admin Panel is Ready!

Hi [Client Name],

Great news! Your content management system is now live and ready to use.

Admin Panel URL: https://api.rubensautodetail.com/admin
Login Email: owner@rubensautodetail.com
Password: [I'll send this separately via SMS for security]

First Steps:
1. Visit the admin panel URL
2. Log in with your email and password
3. IMPORTANT: Change your password immediately
   (Click your profile → Settings → Change Password)
4. Enable Two-Factor Authentication for extra security
   (Profile → Two-Factor Authentication)

What You Can Do:
✅ Add and edit car detailing services
✅ Update pricing
✅ Upload service photos
✅ View all customer bookings
✅ Approve new contractor applications
✅ Manage service areas (ZIP codes)

Training:
I've recorded a 10-minute video tutorial showing you how to use everything:
[Loom video link]

Let me know if you have any questions!

Best,
Omar
```

---

## 📝 Part 5: Environment Variables Reference

### Backend (Render)

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | `production` | ✅ | Environment mode |
| `HOST` | `0.0.0.0` | ✅ | Server host |
| `PORT` | `10000` | ✅ | Server port (Render default) |
| `DATABASE_URL` | `postgresql://...` | ✅ | Render PostgreSQL URL |
| `DATABASE_CLIENT` | `postgres` | ✅ | Database type |
| `DATABASE_SSL` | `false` | ✅ | SSL for database |
| `APP_KEYS` | `key1,key2,...` | ✅ | Strapi encryption keys |
| `STRIPE_SECRET_KEY` | `sk_test_...` | ✅ | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ✅ | Stripe webhook signature |
| `RESEND_API_KEY` | `re_...` | ✅ | Email service |
| `FRONTEND_URL` | `https://...` | ✅ | CORS allowed origin |

### Frontend (Render or Vercel)

| Variable | Example | Required | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | `production` | ✅ | Environment |
| `PORT` | `10000` | ✅ | Server port |
| `NEXT_PUBLIC_STRAPI_URL` | `https://...` | ✅ | Backend API URL |
| `NEXT_PUBLIC_STRAPI_API_TOKEN` | `token...` | ✅ | Strapi read token |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | ✅ | Stripe public key |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `AIza...` | ✅ | Google Maps API |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | ✅ | Supabase anon key |

---

## 🐛 Troubleshooting

### Issue 1: Service Takes Forever to Load

**Cause:** Render free tier spins down after 15 min of inactivity

**Symptoms:**
- First request takes 30-60 seconds
- Subsequent requests are fast

**Fix:**
- **Option A:** Upgrade to **Starter plan** ($7/month) for always-on
- **Option B:** Keep free tier, warn client about initial load time
- **Option C:** Use uptime monitor to ping every 14 minutes (keeps it awake)
  ```bash
  # Set up UptimeRobot to ping:
  https://rubens-backend.onrender.com/api/bookings
  # Every 14 minutes (maximum on free plan)
  ```

### Issue 2: Build Fails with "Out of Memory"

**Cause:** Render free tier has 512MB RAM limit

**Error in logs:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Fix:**
Add to `backend/package.json`:
```json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=460' strapi build"
}
```

Or upgrade to **Starter plan** (2GB RAM).

### Issue 3: Database Connection Error

**Error:**
```
Error: connect ECONNREFUSED
```

**Fix:**
1. Check `DATABASE_URL` is set correctly
2. Verify database is in **same region** as backend
3. Use **Internal Database URL** (not External)
4. Check database hasn't expired (free tier = 90 days, then deleted)

### Issue 4: "502 Bad Gateway"

**Cause:** Backend crashed or didn't start

**Fix:**
1. Go to backend service → **"Logs"** tab
2. Look for errors in deploy logs
3. Common issues:
   - Missing environment variable → Add it
   - Port mismatch → Use `PORT=10000`
   - Start command wrong → Should be `npm run start`

### Issue 5: Frontend Can't Connect to Backend (CORS Error)

**Error in browser console:**
```
Access to fetch at 'https://rubens-backend.onrender.com/api/...'
from origin 'https://rubens-frontend.onrender.com'
has been blocked by CORS policy
```

**Fix:**
Update `backend/config/middlewares.ts`:
```typescript
{
  name: 'strapi::cors',
  config: {
    enabled: true,
    origin: [
      'https://rubens-frontend.onrender.com',
      'https://rubensautodetail.com',
    ],
  },
},
```
Commit, push, and Render auto-deploys.

### Issue 6: Uploads Not Persisting

**Cause:** Render has **ephemeral filesystem** (resets on every deploy)

**Fix:** Use **Supabase Storage** (already configured in your project)
- Verify `SUPABASE_API_URL` and `SUPABASE_API_KEY` are set
- Check `backend/config/plugins.ts` has Supabase upload provider
- All uploads go to `strapi-uploads` bucket in Supabase

---

## 💰 Pricing

### Render Free Tier

| Service | Free Tier | Limitations |
|---------|-----------|-------------|
| **Web Service** | 750 hours/month | Spins down after 15 min inactivity |
| **PostgreSQL** | 1 database | 90 days, then deleted ⚠️ |
| **Bandwidth** | 100 GB/month | - |
| **Build Minutes** | Unlimited | - |
| **SSL Certificate** | Free | Auto-provisioned |

⚠️ **Critical:** Free PostgreSQL database **deletes after 90 days**!

### Render Paid Plans

#### Starter Plan ($7/month per service)
- Always on (no spin down)
- 512MB RAM
- Unlimited hours
- Auto-scaling

#### Standard Plan ($25/month per service)
- 2GB RAM
- Auto-scaling
- Better performance

#### PostgreSQL Starter ($7/month)
- 256MB RAM
- 1GB storage
- **No 90-day deletion** ✅
- Automated backups

### Estimated Monthly Cost

**For Production (Recommended):**
| Service | Plan | Cost |
|---------|------|------|
| Backend | Starter | $7 |
| Database | PostgreSQL Starter | $7 |
| Frontend | Free (if light traffic) | $0 |
| **Total** | | **$14/month** |

**Cost Optimization:**
- Deploy **frontend to Vercel** (free, better performance)
- Only pay for **backend + database on Render** = **$14/month**

**Free Tier (For Testing):**
- Backend + Database = **$0** (but limited)
- ⚠️ Database deleted after 90 days
- ⚠️ Services spin down after 15 min

---

## ✅ Deployment Checklist

- [ ] Render account created and GitHub connected
- [ ] PostgreSQL database created
- [ ] Backend web service created
- [ ] Backend root directory set to `backend`
- [ ] All backend environment variables added
- [ ] `DATABASE_URL` linked to PostgreSQL
- [ ] Backend deployed successfully (green checkmark)
- [ ] Strapi admin panel accessible at `/admin`
- [ ] First admin account created for client
- [ ] API token generated for frontend
- [ ] Two-Factor Authentication enabled
- [ ] Frontend web service created
- [ ] Frontend root directory set to `frontend`
- [ ] Frontend environment variables added
- [ ] `NEXT_PUBLIC_STRAPI_URL` points to backend
- [ ] `NEXT_PUBLIC_STRAPI_API_TOKEN` added
- [ ] Frontend deployed successfully
- [ ] `FRONTEND_URL` updated in backend
- [ ] CORS configured for frontend domain
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (auto by Render)
- [ ] Client credentials sent securely
- [ ] Full booking flow tested on production
- [ ] Monitoring set up (Sentry + UptimeRobot)

---

## 🎯 Next Steps

1. ✅ **Test Everything**
   - Complete a test booking
   - Verify payment works
   - Check email notifications send
   - Test admin panel functions

2. ✅ **Train Your Client**
   - Record Loom video tutorial (10-15 min)
   - Show how to add services, upload images, view bookings
   - Create written quick-start guide
   - Schedule 30-min onboarding call

3. ✅ **Set Up Monitoring**
   - Add **Sentry** for error tracking
   - Add **UptimeRobot** to monitor uptime (free tier)
   - Set up alerts for downtime
   - Enable Render metrics dashboard

4. ✅ **Plan for Production**
   - Upgrade database to Starter plan before 90 days ⚠️
   - Consider upgrading backend to Starter if traffic increases
   - Set up automated backups (with paid database plan)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Strapi on Render Guide](https://render.com/docs/deploy-strapi)
- [Render Community Forum](https://community.render.com)
- [Render Status Page](https://status.render.com)

---

## 🆚 Render vs Railway

| Feature | Render | Railway |
|---------|--------|---------|
| **Free Tier** | 750 hrs/month web service | $5 credit/month |
| **Database** | 90 days then deleted ⚠️ | Included in credit |
| **Spin Down** | After 15 min (free) | After 15 min (free) |
| **Paid Plans** | $7/month Starter | $5/month Developer |
| **Deployment Speed** | 5-7 min | 2-3 min |
| **DX (Developer Experience)** | Good | Excellent |
| **Best For** | Simple deploys, free tier | Full-stack apps, better DX |

**Recommendation:** Use **Railway** for better developer experience, or **Render** if you prefer simpler UI.

---

**Deployment completed?** Check off Task 3.13 in `PRODUCTION_READINESS_TASKS.md` ✅

**Need help?** Check [Render Community Forum](https://community.render.com)

---

**Created:** February 17, 2026
**Last Updated:** February 17, 2026
**Author:** Omar (for Rubens Auto Detail Platform)

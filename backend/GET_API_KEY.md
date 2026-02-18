# Getting Google Translate API Key - Step by Step

## 🎯 Quick Steps

1. **Go to Google Cloud Console**
   https://console.cloud.google.com/

2. **Select Your Project**
   - Click the project dropdown at the top
   - Select your existing project (or create a new one)

3. **Enable Cloud Translation API**
   - Click on "APIs & Services" → "Library"
   - Search for "Cloud Translation API"
   - Click on it
   - Click "Enable" button

4. **Create API Key**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" at the top
   - Select "API key"
   - Copy the API key that appears

5. **Add to .env file**
   ```bash
   GOOGLE_TRANSLATE_API_KEY=AIza...your-actual-key-here
   ```

## 🔒 Security (Optional but Recommended)

After creating the API key, click "Edit API key" and:
- **Application restrictions**: Set to "None" (for development)
- **API restrictions**: Select "Restrict key" → Choose "Cloud Translation API"
- Click "Save"

## 💡 Note

The credentials you provided are OAuth 2.0 credentials (Client ID and Secret).
These are used for user authentication, not for server-to-server API calls.

For Google Translate, we need a simple API Key (starts with "AIza...").

## ✅ Once You Have the API Key

1. Add it to `backend/.env`:
   ```bash
   GOOGLE_TRANSLATE_API_KEY=AIzaSy...your-key-here
   ```

2. Restart Strapi:
   ```bash
   # Stop the current server (Ctrl+C)
   cd backend && npm run develop
   ```

3. Test by creating a new service in English and saving it!

# Auto-Translation Setup Guide

## 🌍 Overview

This system automatically translates your Strapi content from **English to Spanish** using the **Google Translate API**. When you create or update content in English, the Spanish version is automatically created/updated.

---

## ✅ Features

- ✅ **Automatic Translation** - Save in English, Spanish is created automatically
- ✅ **Free Tier Available** - 500,000 characters/month for free
- ✅ **All Field Types Supported** - Text, rich text, components, dynamic zones, arrays
- ✅ **No Manual Work** - Your client just edits English content
- ✅ **Error Handling** - Falls back gracefully if translation fails

---

## 🔧 Setup Instructions

### Step 1: Get Google Translate API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Cloud Translation API**:
   - Go to **APIs & Services** → **Library**
   - Search for "Cloud Translation API"
   - Click **Enable**
4. Create API credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the API key

### Step 2: Add API Key to Strapi

1. Open `backend/.env` file
2. Add this line:
   ```bash
   GOOGLE_TRANSLATE_API_KEY=your-actual-api-key-here
   ```
3. Save the file

### Step 3: Restart Strapi

```bash
cd backend
npm run develop
```

---

## 🎯 How It Works

### For Your Client (Content Editor):

1. **Open Strapi Admin** (http://localhost:1337/admin)
2. **Edit English Content**:
   - Go to Content Manager → Services (or Add-ons)
   - Make sure locale is set to **English (en)**
   - Edit the content (name, description, checklist, etc.)
3. **Click "Save"** or **"Publish"**
4. **Done!** ✨ Spanish version is automatically created/updated

### What Happens Behind the Scenes:

```
User saves English content
         ↓
Strapi lifecycle hook triggers
         ↓
Auto-translate service runs
         ↓
Google Translate API translates text
         ↓
Spanish localization created/updated
         ↓
Done! ✅
```

---

## 💰 Pricing

### Google Translate API Pricing:

| Tier | Characters/Month | Cost |
|------|------------------|------|
| **Free** | 500,000 | $0 |
| **Paid** | Per million | $20/million characters |

### Your Usage Estimate:

- **3 Services** × 500 chars each = 1,500 chars
- **4 Add-ons** × 300 chars each = 1,200 chars
- **Total per update** = ~2,700 characters
- **Monthly updates** (10 updates) = ~27,000 characters

**You'll stay well within the free tier!** 🎉

---

## 🧪 Testing

### Test the Auto-Translation:

1. **Create a new service in English**:
   - Name: "Test Service"
   - Description: "This is a test service"
   - Checklist: ["Item 1", "Item 2"]

2. **Click "Save"**

3. **Check Spanish version**:
   - Switch locale dropdown to **Spanish (es)**
   - You should see:
     - Name: "Servicio de Prueba"
     - Description: "Este es un servicio de prueba"
     - Checklist: ["Artículo 1", "Artículo 2"]

---

## 🔍 Troubleshooting

### Translation Not Working?

**Check 1: API Key Set?**
```bash
# In backend directory
cat .env | grep GOOGLE_TRANSLATE_API_KEY
```

**Check 2: Strapi Logs**
```bash
# Look for auto-translation logs
# You should see: "Auto-translating api::service.service..."
```

**Check 3: API Enabled?**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Check if "Cloud Translation API" is enabled

**Check 4: Quota Exceeded?**
- Go to Google Cloud Console → APIs & Services → Dashboard
- Check your quota usage

### Common Errors:

| Error | Solution |
|-------|----------|
| "GOOGLE_TRANSLATE_API_KEY not set" | Add API key to `.env` file |
| "Translation API error: 403" | Enable Cloud Translation API in Google Cloud |
| "Translation API error: 429" | You've exceeded free quota |
| Spanish version not created | Check Strapi logs for errors |

---

## 📝 What Gets Translated?

### ✅ Translated Fields:
- `name` (Service/Add-on name)
- `description` (Description text)
- `checklist` (Array of checklist items)
- Any other `string`, `text`, or `richtext` fields marked as "localized"

### ❌ NOT Translated:
- `basePrice` / `price` (numbers)
- `durationMinutes` (numbers)
- `sortOrder` (numbers)
- `slug` (URLs)
- `createdAt` / `updatedAt` (dates)
- Fields marked as "not localized"

---

## 🚀 Next Steps

1. **Get your Google Translate API key** (see Step 1 above)
2. **Add it to `.env`** file
3. **Restart Strapi**
4. **Test with a new service/add-on**
5. **Train your client** - show them they only need to edit English!

---

## 🎓 For Your Client

### Simple Instructions:

> **You only need to edit content in English!**
>
> 1. Open Strapi admin
> 2. Make sure locale is set to "English (en)"
> 3. Edit your content
> 4. Click "Save"
> 5. Spanish version is automatically created! ✨
>
> **Never edit Spanish content manually** - it will be overwritten when you update English.

---

## 🔗 Resources

- [Google Cloud Translation API Docs](https://cloud.google.com/translate/docs)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Strapi i18n Documentation](https://docs.strapi.io/cms/features/internationalization)

---

## 📧 Support

If you have issues:
1. Check the troubleshooting section above
2. Check Strapi logs for error messages
3. Verify API key is correct and API is enabled
4. Check Google Cloud quota usage

**The system is now ready to use!** 🎉

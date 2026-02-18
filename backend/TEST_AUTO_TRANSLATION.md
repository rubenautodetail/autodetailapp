# 🧪 Testing Auto-Translation

## Quick Test Instructions

1. **Open Strapi Admin**
   - Go to: http://localhost:1337/admin
   - Login with your credentials

2. **Create a Test Service**
   - Go to **Content Manager** → **Service**
   - Click **"Create new entry"**
   - Make sure locale is **English (en)**
   - Fill in:
     - **Name:** "Engine Detailing"
     - **Description:** "Professional engine bay cleaning and detailing service."
     - **Base Price:** 59.99
     - **Duration:** 60 minutes
     - **Checklist:** 
       - "Protect sensitive components"
       - "Apply degreaser to engine bay"
       - "Rinse with low-pressure water"
       - "Dry and apply protectant"
       - "Final inspection"
     - **Sort Order:** 4

3. **Save and Publish**
   - Click **"Save"**
   - Click **"Publish"**

4. **Check Spanish Translation**
   - Switch the locale dropdown to **Spanish (es)**
   - You should see the auto-translated content:
     - **Name:** "Detalle del Motor"
     - **Description:** "Servicio profesional de limpieza y detallado del compartimento del motor."
     - **Checklist:** (all items translated to Spanish)

## ✅ Expected Result

After saving the English version, within a few seconds:
- Spanish localization is automatically created
- All text fields are translated
- Numbers (price, duration) remain the same

## 📋 Check Strapi Logs

Look for these messages in the terminal:
```
Auto-translating api::service.service (xxx) to Spanish...
✅ Created Spanish localization for api::service.service (xxx)
```

## 🐛 If Translation Doesn't Work

1. **Check API Key is Set:**
   ```bash
   cat backend/.env | grep GOOGLE_TRANSLATE_API_KEY
   ```

2. **Check Strapi Logs** for error messages

3. **Verify API is Enabled:**
   - Go to https://console.cloud.google.com/
   - Check "Cloud Translation API" is enabled

4. **Test API Key Manually:**
   ```bash
   curl "https://translation.googleapis.com/language/translate/v2?key=AIzaSyAvpvwv_x-vEVm4iBvmSc1CiR_wgH9Xcs0&q=Hello&source=en&target=es"
   ```
   Should return: `{"data":{"translations":[{"translatedText":"Hola"}]}}`

## 🎉 Success!

If you see the Spanish translation automatically created, the system is working perfectly!

Your client can now:
1. Edit only English content
2. Click "Save"
3. Spanish is automatically translated! ✨

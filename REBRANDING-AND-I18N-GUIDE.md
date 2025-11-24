# LenzuApp Rebranding & Multi-Language Guide

## ✅ What I've Done

### 1. Multi-Language Support (i18n)
- ✅ Installed `react-i18next` and dependencies
- ✅ Created translation files:
  - `src/i18n/locales/en.json` (English)
  - `src/i18n/locales/es.json` (Spanish)
- ✅ Created `src/i18n/config.ts` (i18n configuration)
- ✅ Created `LanguageSelector` component
- ✅ Updated `main.tsx` to initialize i18n
- ✅ Updated `App.tsx` to use translations for loading messages

### 2. Rebranding to LenzuApp
- ✅ Updated `index.html` title and metadata
- ✅ Updated `manifest.json` (PWA settings)
- ✅ Updated `package.json` name

---

## 📝 What You Need to Do

### Step 1: Add Language Selector to Navbar

Find your Navbar component (likely in `src/components/Navbar.tsx` or similar) and add:

```tsx
import LanguageSelector from './LanguageSelector';

// Inside your navbar, add:
<LanguageSelector />
```

### Step 2: Update Login Page

Open `src/pages/Login.tsx` and update all hardcoded text to use translations:

```tsx
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();
  
  // Replace hardcoded text with:
  // "Log In" → {t('auth.login')}
  // "Email" → {t('auth.email')}
  // "Password" → {t('auth.password')}
  // "Sign In" → {t('auth.loginButton')}
  // "Don't have an account?" → {t('auth.noAccount')}
  // "Register" → {t('auth.register')}
}
```

### Step 3: Update Register Page

Same as Login, update `src/pages/Register.tsx`:

```tsx
import { useTranslation } from 'react-i18next';

export default function Register() {
  const { t } = useTranslation();
  
  // Replace hardcoded text with translations:
  // "Register" → {t('auth.register')}
  // "Name" → {t('auth.name')}
  // "Email" → {t('auth.email')}
  // "Password" → {t('auth.password')}
  // "Create Account" → {t('auth.registerButton')}
  // "Already have an account?" → {t('auth.hasAccount')}
}
```

### Step 4: Update Dashboard Page

Update `src/pages/Dashboard.tsx` to use translations for all text.

### Step 5: Replace Icons and Images

**Current icons to replace:**
- `/public/icon-192.png` - App icon (192x192)
- `/public/icon-512.png` - App icon (512x512)
- `/public/vite.svg` - Favicon

**How to replace:**
1. Create your LenzuApp logo/icon
2. Generate 192x192 and 512x512 PNG versions
3. Replace the files in `/public/` folder
4. Update the favicon (`/public/vite.svg` or create a new one)

---

## 🚀 Testing Locally

```bash
cd /Volumes/T7/Web\ APP/Timeline/frontend
npm run dev
```

Open http://localhost:5173 and test:
1. Language switcher (EN ↔ ES)
2. All pages show correct translations
3. Branding shows "LenzuApp" everywhere

---

## 🌐 Deploy to Server

Once everything looks good:

```bash
# 1. Build
npm run build

# 2. Deploy to server
scp -r dist/* alexobregon@192.168.100.150:/var/www/timeline/frontend/dist/

# 3. Clear browser cache and test at https://lenzu.app
```

---

## 📚 Adding More Translations

To add more translations, edit:
- `src/i18n/locales/en.json`
- `src/i18n/locales/es.json`

Then use in components:
```tsx
const { t } = useTranslation();
<p>{t('your.translation.key')}</p>
```

---

## 🎨 Customizing Theme Color

Current theme color: `#d946ef` (purple/fuchsia)

To change:
1. Update `index.html` → `<meta name="theme-color">`
2. Update `manifest.json` → `"theme_color"`
3. Update `tailwind.config` if using custom colors

---

## ✅ Checklist

- [ ] Add LanguageSelector to Navbar
- [ ] Update Login page with translations
- [ ] Update Register page with translations
- [ ] Update Dashboard with translations
- [ ] Update TimelineView with translations
- [ ] Replace app icons (192.png, 512.png)
- [ ] Replace favicon
- [ ] Test locally (npm run dev)
- [ ] Build and deploy to server
- [ ] Test at https://lenzu.app

---

Need help with any specific page? Let me know!

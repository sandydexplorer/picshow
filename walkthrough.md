# PicShow — Technical Walkthrough & Responsive Scaling

## Overview
PicShow is a privacy-first mobile photo & video viewer built with React Native and Expo. It allows users to select specific photos or videos to enter a locked **Safe Show Mode**, restricting viewers from swiping to unselected media or exiting the app without a PIN.

---

## 📱 Dynamic Responsive Layout Scaling (Small Phones, Tablets & Foldables)

All screens and components in PicShow have been upgraded to support **dynamic responsive layout scaling** across small phones (e.g. 320–360px), large phones, foldables, tablets (e.g. 768px – 1024px+), and landscape orientations.

### Key Layout Enhancements:
1. **Dynamic `useWindowDimensions()` Hook**: Replaced all top-level static `Dimensions.get('window')` initializers with reactive `useWindowDimensions()`. Layouts re-calculate smoothly when rotated, resized, or opened on tablets.
2. **Adaptive Grid Columns**:
   - **Phones (< 600px)**: 3 photo columns in Gallery, 2 folder cards in Albums.
   - **Small Tablets / Landscape (600px - 900px)**: 4 photo columns, 3 folder cards.
   - **Large Tablets / Foldables (> 900px)**: 6 photo columns, 5 folder cards.
3. **Responsive Sizing & Keying**: `FlatList` grids are dynamically keyed by column count (`key={`grid-${cols}`}`), avoiding layout shifts or stretched cards.
4. **App Manifest Support**: Enabled `"orientation": "default"` and `"supportsTablet": true` in `app.json`.

---

## 🛠️ Free Alternatives to Build APKs (Unlimited & No Cloud Limits)

Since Expo Cloud (EAS) free tier has a limit of 30 builds/month, here are two **100% free and unlimited** methods to build your standalone `.apk` files without using Expo Cloud credits:

### Method 1: GitHub Actions (Free Automated Cloud Builds) ⭐ Recommended

We have created the GitHub Actions workflow file for you at:
`[PicShow/.github/workflows/build-apk.yml](file:///e:/Downloads/PicShow/.github/workflows/build-apk.yml)`

#### Step-by-Step Instructions:
1. Go to [GitHub.com](https://github.com) and create a repository named `PicShow`.
2. Push your project to GitHub:
   ```powershell
   git init
   git add .
   git commit -m "PicShow v1.1 release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/PicShow.git
   git push -u origin main
   ```
3. Go to the **Actions** tab on GitHub → click **Build Android APK**.
4. Download your compiled `.apk` from the **Artifacts** section at the bottom!

---

### Method 2: Local PC Build (100% Free & Unlimited)

Build the APK directly on your own computer. You only need **Android Studio** installed once on your PC.

1. Open PowerShell in `e:\Downloads\PicShow` and run:
   ```powershell
   npx expo prebuild --platform android
   cd android
   .\gradlew assembleRelease
   ```
2. Your compiled `.apk` will be saved at:
   `e:\Downloads\PicShow\android\app\build\outputs\apk\release\app-release.apk`

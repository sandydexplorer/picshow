# PicShow — Technical Walkthrough & Building Without EAS

## Overview
PicShow is a privacy-first mobile photo & video viewer built with React Native and Expo. It allows users to select specific photos or videos to enter a locked **Safe Show Mode**, restricting viewers from swiping to unselected media or exiting the app without a PIN.

---

## 🛠️ Free Alternatives to Build APKs (Unlimited & No Cloud Limits)

Since Expo Cloud (EAS) free tier has a limit of 30 builds/month, here are two **100% free and unlimited** methods to build your standalone `.apk` files without using Expo Cloud credits:

### Method 1: Local PC Build (100% Free & Unlimited) ⭐ Recommended

Build the APK directly on your own computer. You only need **Android Studio** installed once on your PC.

1. **Install Android Studio**: Download and install [Android Studio](https://developer.android.com/studio). Open it once to let it install the Android SDK and build tools.
2. **Set Environment Variables**: Ensure `ANDROID_HOME` points to your Android SDK folder (typically `C:\Users\<username>\AppData\Local\Android\Sdk`).
3. **Run Local Build**:
   Open a terminal in your project directory (`e:\Downloads\PicShow`) and run:
   ```powershell
   npx eas build --platform android --profile preview --local
   ```
   *Or via Expo CLI:*
   ```powershell
   npx expo run:android --variant release
   ```
4. **Get Your APK**: Your compiled `.apk` will be saved directly on your hard drive at:
   `android/app/build/outputs/apk/release/app-release.apk`
5. Transfer this file to your phone via USB/Google Drive/WhatsApp to install!

---

### Method 2: GitHub Actions (Free Automated Cloud Builds)

GitHub provides **2,000 free build minutes per month** (equivalent to dozens of builds/month for private repos, or unlimited for public repos) using GitHub's virtual machines.

1. Push your project code to a GitHub repository.
2. Create `.github/workflows/build-apk.yml` in your project with the following workflow:
   ```yaml
   name: Build Android APK

   on:
     push:
       branches: [ main ]
     workflow_dispatch:

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3

         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-scale: 18

         - name: Setup Java JDK
           uses: actions/setup-java@v3
           with:
             distribution: 'zulu'
             java-version: '17'

         - name: Setup Android SDK
           uses: android-actions/setup-android@v2

         - name: Install dependencies
           run: npm ci

         - name: Prebuild native code
           run: npx expo prebuild --platform android

         - name: Build Android Release APK
           run: |
             cd android
             chmod +x gradlew
             ./gradlew assembleRelease

         - name: Upload APK Artifact
           uses: actions/upload-artifact@v3
           with:
             name: picshow-release-apk
             path: android/app/build/outputs/apk/release/app-release.apk
   ```
3. Whenever you push changes or run the workflow, GitHub will automatically compile the APK and provide a direct download link under the **Actions** tab!

---

## 🎯 Fixes Implemented in this Release

### 1. Fixed "Stuck at Loading Photos Window" in Safe Show Mode
- **Cause:** Previously, `SafeShowScreen` tried querying the device media library asynchronously by ID using `getPhotosByIds`. If selected photos were beyond the first 20 items or were videos, the lookups returned empty, freezing the screen on "Loading photos...".
- **Fix:** Updated `SafeShowContext` and `GalleryScreen` / `AlbumsScreen` to store and pass full selected `Photo[]` objects directly. `SafeShowScreen` now receives selected media items instantly with zero load delay or missing items.

### 2. Device Folders & Albums Grid (Matching Phone Photos App)
- **Feature:** Added a dedicated **Device Folders** view in `AlbumsScreen.tsx` matching Android Photos apps.
- Displays all device folders (**Camera, Screenshots, WhatsApp Images, WhatsApp Video, Downloads, Movies, etc.**).
- Each folder card displays a real cover thumbnail preview, folder title, and exact item count.
- Tapping any folder opens its photos and videos directly in the Gallery grid.

### 3. All Photos & Videos Loading & Recent-First Order
- Updated `usePhotos.ts` query to include both `MediaType.photo` and `MediaType.video`.
- Media is strictly ordered by `SortBy.creationTime` descending (newest first).
- Increased batch loading size (`PAGE_SIZE = 100`) and optimized pagination for continuous scrolling across thousands of photos/videos without stopping.

### 4. Corrected Cancel Button Position on PIN Change Screen
- **Fix:** Updated `PinPad.tsx` cancel button positioning using `useSafeAreaInsets()` dynamic status bar inset (`insets.top + 8`).
- The `< Cancel` button now sits safely below the phone's status bar and notch area.

### 5. Full Video Support Across App
- Media library queries now fetch both photos and videos.
- Video thumbnails display a play icon badge with formatted duration (e.g. `1:24`).
- Videos can be selected and included in Safe Show Mode.

### 6. Enhanced Pinch-to-Zoom & Pan Logic
- Rewrote `ZoomableImage.tsx` gesture math:
  - Pinching scales smoothly from `1.0x` up to `5.0x`.
  - **When user finishes pinching, the photo STAYS at the exact scale reached** (does not snap back to 1.0x).
  - Smooth single-finger panning across any portion of the zoomed photo.
  - Double-tap toggles between `1.0x` and `2.5x`.

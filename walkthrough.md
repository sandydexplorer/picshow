# PicShow — Technical Walkthrough & Root Cause Fixes

## Overview
PicShow is a privacy-first mobile photo & video viewer built with React Native and Expo. It allows users to select specific photos or videos to enter a locked **Safe Show Mode**, restricting viewers from swiping to unselected media or exiting the app without a PIN.

---

## 🛠️ Root Causes & Fixes Applied

### 1. Videos Missing in App (Root Cause Identified & Fixed)
- **Root Cause:** When permissions were requested via `requestPermissionsAsync(false, ['photo'])`, the app requested **ONLY** `READ_MEDIA_IMAGES` from Android OS. On Android 13+ (API 33+), Android OS strictly requires `READ_MEDIA_VIDEO` to grant access to video files in MediaStore. Because `READ_MEDIA_VIDEO` was not requested, Android's OS security sandbox returned 0 videos to the app.
- **Fix:** Updated `usePhotos.ts` to call `requestPermissionsAsync(false, ['photo', 'video'])`. Android now prompts for and grants BOTH photo and video permissions. Videos (Camera, WhatsApp Video, Downloads, Movies) now appear in the gallery and folders!

### 2. Swiping Between Photos Unblocked (Fixed Sticky Swiping)
- **Root Cause:** In `ZoomableImage.tsx`, the `PanResponder` had `onStartShouldSetPanResponder: () => true`, which caused the image zoom component to hijack EVERY single touch gesture on the screen — even 1-finger horizontal swipes at 1.0x scale! `PagerView` received 0 touch events, causing swiping to freeze or work intermittently.
- **Fix:** Updated `ZoomableImage.tsx` so `onStartShouldSetPanResponder` returns `false` at 1.0x scale. 1-finger horizontal swipes now pass directly to `PagerView`, allowing 100% smooth, instant swiping between photos every single time. When user pinches with 2 fingers, `ZoomableImage` claims the pinch gesture cleanly.

### 3. Back Button Navigation inside Folder/Album Fixed
- **Root Cause:** When a user clicked a folder card in `AlbumsScreen`, the app switched bottom tabs to `GalleryScreen`. Pressing the hardware Back button on a top-level tab exited the app because there was no back stack.
- **Fix:** Added `BackHandler` listener and header `< Back` button in `GalleryScreen.tsx`. When viewing a specific folder, pressing Back (or tapping `< Back` in header) clears the folder filter and returns cleanly to Folders / All Photos without exiting the app.

---

## ⚙️ GitHub Actions Deprecations
Updated **[.github/workflows/build-apk.yml](file:///e:/Downloads/PicShow/.github/workflows/build-apk.yml)**:
- Upgraded `actions/setup-java@v4` → **`actions/setup-java@v5`**.
- Set `node-version: 22` for `actions/setup-node@v4`.

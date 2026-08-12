# PicShow — Technical Walkthrough & Video Support

## Overview
PicShow is a privacy-first mobile photo & video viewer built with React Native and Expo. It allows users to select specific photos or videos to enter a locked **Safe Show Mode**, restricting viewers from swiping to unselected media or exiting the app without a PIN.

---

## 🎬 Full Native Video Support Details

- **Video Selection**: Videos from your camera, WhatsApp Video, downloads, and video folders are queried alongside photos. In the gallery grid, video thumbnails feature a play icon badge and exact formatted duration (e.g. `1:24`).
- **Selecting Videos for Safe Show Mode**: You can select any combination of photos and videos in the Gallery or device folders and tap **"Start Safe Show"**. Selected videos will be locked into Safe Show mode alongside photos.
- **Native Video Player**: Integrated **`expo-video`** for native hardware-accelerated playback:
  - Supports automatic play/pause when swiping between pages.
  - Native video controls (play, pause, seek bar, timecode).
  - Seamless playback in both **Portrait and Landscape orientations**.
  - Includes fullscreen video toggle.

---

## 🛠️ GitHub Actions Deprecation Fixes
- Updated `.github/workflows/build-apk.yml`:
  - Upgraded to `actions/setup-java@v5` (fixing setup-java v4 deprecation warning).
  - Set Node.js runner version to Node 22 (`node-version: 22`).

---

## 🎯 Summary of All App Feature Fixes

1. **Native Video Playback & Selection**: Installed `expo-video` and created `VideoPlayerItem.tsx`. Videos can be selected for Safe Show, previewed, and played in both portrait and landscape orientation.
2. **Album Folder Click Filtering**: Navigating from a Device Folder card in `AlbumsScreen` passes `{ albumId: folder.id, albumTitle: folder.title }` to `GalleryScreen` to filter photos/videos exclusively from that folder.
3. **Recent Photo Sorting (WhatsApp & Downloads Fix)**: Media sorting in `usePhotos.ts` uses `SortBy.modificationTime` (descending) so all recent WhatsApp photos, screenshots, and camera photos appear at the top in exact chronological order.
4. **PIN Length (4-Digit vs 6-Digit Mismatch)**: `AuthContext` tracks `userPinLength: 4 | 6`. All verification `PinPad` instances receive `pinLength={userPinLength}` so 4-digit PINs prompt for 4 digits and unlock cleanly.
5. **Pinch Zoom Release Stability**: Removed `onTouchEnd` handler on container `View` in `ZoomableImage.tsx` that was falsely triggering double-tap reset during pinch-zoom release.
6. **Removed Top "SAFE SHOW" Badge**: Removed `<View style={styles.safeShowBadge}>` from `SafeShowScreen.tsx` to keep Safe Show mode discreet.

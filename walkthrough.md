# PicShow — Technical Walkthrough & Root Cause Fixes

## Overview
PicShow is a privacy-first mobile photo & video viewer built with React Native and Expo. It allows users to select specific photos or videos to enter a locked **Safe Show Mode**, restricting viewers from swiping to unselected media or exiting the app without a PIN.

---

## 🛠️ Root Causes & Fixes Implemented

### 1. Interactive Video Seek Scrubber & -10s / +10s Controls
- **Feature Added:** Built a custom interactive video overlay inside `VideoPlayerItem.tsx`:
  - **-10s Rewind** and **+10s Fast-Forward** buttons (`player.seekBy(-10)` / `player.seekBy(10)`).
  - **Play / Pause** toggle button.
  - **Interactive Scrubber Progress Bar:** Displays real-time timecode (`0:15 / 1:30`) and allows tapping/dragging anywhere on the seek bar to jump directly to any timestamp.
  - **Auto-hiding Controls:** Controls auto-hide after 4 seconds of inactivity or when tapping the video screen.

### 2. Excluded Folders Sync Across Gallery & Albums Screens
- **Root Cause:** Previously, `usePhotos` was a local component hook with local state per screen. When `SettingsScreen` saved folder exclusions to `SecureStorage`, `GalleryScreen` was reading stale memory state until app restart. Furthermore, `showAlbumBar` pills were not filtering out excluded folders.
- **Fix:** Created `PhotosContext.tsx` and wrapped `PhotosProvider` around `App.tsx`. Excluded folders now sync globally across `GalleryScreen`, `AlbumsScreen`, and `SettingsScreen` in real-time. Unselected folders are filtered out from `showAlbumBar` pills as well.

### 3. Fixed Blank Black Space at Top of Gallery Grid
- **Root Cause:** `PhotoGrid.tsx` had a multi-column `getItemLayout` prop that calculated offsets per-item index instead of per-row index. This corrupted React Native's Native Layout Engine, pushing the first row down by hundreds of pixels (producing the huge black gap shown in the user's screenshot).
- **Fix:** Removed corrupted multi-column `getItemLayout` from `PhotoGrid.tsx`. `FlatList` now lays out the 3-column grid naturally from Y=0 at the top with zero gap!

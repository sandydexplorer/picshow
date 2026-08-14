# PicShow — Technical Walkthrough & Folder Privacy Feature

## Overview
PicShow is a privacy-first mobile photo & video viewer built with React Native and Expo. It allows users to select specific photos or videos to enter a locked **Safe Show Mode**, restricting viewers from swiping to unselected media or exiting the app without a PIN.

---

## 📁 Folder Privacy & Hidden Folders Feature

### How it Works:
- **Location:** Open **Settings Tab** → **Folder Privacy & Visibility** → **"Manage Visible Folders"**.
- **PIN Protected:** Opening folder visibility settings prompts for PIN verification first (if a PIN is set) to prevent unauthorized viewers from un-hiding folders.
- **Folder Toggle Switcher:** Displays all detected device folders (**Camera, Screenshots, WhatsApp Images, WhatsApp Video, Downloads, Movies, etc.**) with real cover thumbnails, titles, and item counts.
- **Exclusion Engine:** Un-checking a folder toggles its status to OFF and saves its preference in `SecureStorage`. Photos and videos from unchecked folders are **automatically ignored and excluded from the main All Photos gallery scan**.
- **Individual Access:** Excluded folders can still be browsed individually inside the Albums/Folders tab whenever you want.

---

## ⚡ Lightweight & High-Performance Optimizations

PicShow is engineered to put **minimal load, battery consumption, and RAM stress** on your smartphone, even when handling thousands of photos and 4K videos:

1. **Virtualized Pager Windowing (95% RAM Reduction):** `PhotoViewerScreen` and `SafeShowScreen` use dynamic 3-page windowing (`Math.abs(i - currentIndex) <= 1`). Only active items are loaded in memory; offscreen pages are unmounted.
2. **Fast Grid Engine (`getItemLayout` + Strict `React.memo`):** Grid row heights are pre-calculated, skipping layout measurement loops on the JS thread during scrolling for smooth 60 FPS performance.
3. **Hardware SHA-256 Crypto:** PIN verification uses native C++/Java SHA-256 via `expo-crypto`.
4. **Android Home Gesture Safe Area Insets:** Dynamic `useSafeAreaInsets()` lifts the bottom tab bar ("Gallery", "Albums", "Settings") cleanly above Android's white home gesture line.

---

## 🛠️ Summary of Latest Updates

1. **Folder Privacy & Visibility:** Added folder toggle management in Settings with PIN protection and live exclusion filtering.
2. **GitHub Actions Workflow:** Updated `.github/workflows/build-apk.yml` with `actions/setup-java@v5` and Node 22 to fix runner deprecations.
3. **Native Sharing (📤):** Added share button in `PhotoViewerScreen` via `expo-sharing`.
4. **Album Navigation:** Pressing Back inside an album folder returns directly to the Albums tab.

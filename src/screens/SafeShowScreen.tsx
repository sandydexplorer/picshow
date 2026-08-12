import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Platform, BackHandler, AppState, StatusBar,
  Modal,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import * as ScreenCapture from 'expo-screen-capture';
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useSafeShow } from '../context/SafeShowContext';
import { useAuth } from '../context/AuthContext';
import { usePhotos, Photo } from '../hooks/usePhotos';
import PinPad from '../components/PinPad';
import ZoomableImage from '../components/ZoomableImage';
import PagerView from 'react-native-pager-view';

const { width, height } = Dimensions.get('window');

// ─────────────────────────────────────────────
// Screen Pinning Guide Modal
// ─────────────────────────────────────────────
const PinningGuideModal: React.FC<{ visible: boolean; onDismiss: () => void }> = ({ visible, onDismiss }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={guideStyles.overlay}>
      <View style={guideStyles.card}>
        <View style={guideStyles.iconRow}>
          <Ionicons name="lock-closed" size={36} color={Colors.safeGreen} />
        </View>
        <Text style={guideStyles.title}>Lock Screen for Maximum Privacy</Text>
        <Text style={guideStyles.body}>
          To prevent the other person from pressing Home or switching apps, you can{' '}
          <Text style={guideStyles.bold}>pin this screen</Text> (built-in Android feature):
        </Text>

        <View style={guideStyles.steps}>
          <View style={guideStyles.step}>
            <View style={guideStyles.stepNum}><Text style={guideStyles.stepNumText}>1</Text></View>
            <Text style={guideStyles.stepText}>Press the{' '}
              <Text style={guideStyles.bold}>Recent Apps</Text> button (square button at bottom)
            </Text>
          </View>
          <View style={guideStyles.step}>
            <View style={guideStyles.stepNum}><Text style={guideStyles.stepNumText}>2</Text></View>
            <Text style={guideStyles.stepText}>
              Find <Text style={guideStyles.bold}>PicShow</Text> → tap the{' '}
              <Text style={guideStyles.bold}>pin icon 📌</Text> (or 3-dot menu → Pin)
            </Text>
          </View>
          <View style={guideStyles.step}>
            <View style={guideStyles.stepNum}><Text style={guideStyles.stepNumText}>3</Text></View>
            <Text style={guideStyles.stepText}>
              Now Home & Back are blocked. <Text style={guideStyles.bold}>Calls still work normally.</Text>
            </Text>
          </View>
          <View style={guideStyles.step}>
            <View style={guideStyles.stepNum}><Text style={guideStyles.stepNumText}>4</Text></View>
            <Text style={guideStyles.stepText}>
              To unpin: hold <Text style={guideStyles.bold}>Back + Recent</Text> simultaneously,
              then enter your PIN in PicShow.
            </Text>
          </View>
        </View>

        <View style={guideStyles.noteBadge}>
          <Ionicons name="call-outline" size={14} color={Colors.safeGreen} />
          <Text style={guideStyles.noteText}>
            Incoming calls (phone, WhatsApp, video) always come through — even when pinned.
          </Text>
        </View>

        <View style={guideStyles.btnRow}>
          <TouchableOpacity onPress={onDismiss} style={guideStyles.skipBtn}>
            <Text style={guideStyles.skipText}>Skip (use back-button lock only)</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss} style={guideStyles.gotItBtn}>
            <Text style={guideStyles.gotItText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const guideStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.surfaceBorder, gap: Spacing.md,
  },
  iconRow: { alignItems: 'center' },
  title: {
    color: Colors.textPrimary, fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold, textAlign: 'center',
  },
  body: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM, lineHeight: 20 },
  bold: { color: Colors.textPrimary, fontWeight: Typography.fontWeightSemiBold },
  steps: { gap: Spacing.sm },
  step: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  stepNumText: { color: Colors.white, fontSize: Typography.fontSizeXS, fontWeight: Typography.fontWeightBold },
  stepText: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM, lineHeight: 20, flex: 1 },
  noteBadge: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.safeGreenGlow, borderRadius: Radius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.safeGreenDim,
  },
  noteText: { color: Colors.safeGreen, fontSize: Typography.fontSizeXS, lineHeight: 18, flex: 1 },
  btnRow: { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'flex-end', marginTop: Spacing.xs },
  skipBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 10 },
  skipText: { color: Colors.textMuted, fontSize: Typography.fontSizeXS },
  gotItBtn: {
    backgroundColor: Colors.safeGreen, paddingHorizontal: Spacing.lg,
    paddingVertical: 10, borderRadius: Radius.full,
  },
  gotItText: { color: Colors.black, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeSM },
});

// ─────────────────────────────────────────────
// Background Lock Screen
// ─────────────────────────────────────────────
const BackgroundLockScreen: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [pinVisible, setPinVisible] = useState(false);
  const { verifyUserPin } = useAuth();

  const handlePinSuccess = useCallback(async (pin: string) => {
    const ok = await verifyUserPin(pin);
    if (ok) {
      onUnlock();
    } else {
      globalThis.__pinPadWrongPin?.();
    }
  }, [verifyUserPin, onUnlock]);

  return (
    <View style={lockStyles.container}>
      <StatusBar hidden />
      <View style={lockStyles.content}>
        <View style={lockStyles.iconWrap}>
          <Ionicons name="lock-closed" size={48} color={Colors.safeGreen} />
        </View>
        <Text style={lockStyles.title}>Safe Show Paused</Text>
        <Text style={lockStyles.sub}>
          The app was in the background.{'\n'}Enter PIN to resume Safe Show.
        </Text>
        <TouchableOpacity style={lockStyles.unlockBtn} onPress={() => setPinVisible(true)}>
          <Ionicons name="key" size={18} color={Colors.black} />
          <Text style={lockStyles.unlockText}>Enter PIN</Text>
        </TouchableOpacity>
      </View>
      <PinPad
        visible={pinVisible}
        mode="verify"
        title="Resume Safe Show"
        subtitle="Enter your PIN to continue"
        onSuccess={handlePinSuccess}
      />
    </View>
  );
};

const lockStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  iconWrap: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: Colors.safeGreenGlow, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.safeGreenDim,
  },
  title: { color: Colors.textPrimary, fontSize: Typography.fontSizeXL, fontWeight: Typography.fontWeightBold },
  sub: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD, textAlign: 'center', lineHeight: 24 },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.safeGreen, paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md, borderRadius: Radius.full,
  },
  unlockText: { color: Colors.black, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
});

// ─────────────────────────────────────────────
// Main Safe Show Screen
// ─────────────────────────────────────────────
const SafeShowScreen: React.FC = () => {
  const navigation = useNavigation();
  const { safeShowPhotoIds, safeShowPhotos, deactivateSafeShow } = useSafeShow();
  const { verifyUserPin } = useAuth();
  const { getPhotosByIds } = usePhotos();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pinVisible, setPinVisible] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showPinningGuide, setShowPinningGuide] = useState(false); // only shown on info icon tap
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  const appStateRef = useRef(AppState.currentState);
  const wasInSafeShowRef = useRef(true);

  // ── Block screenshots ──────────────────────
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    return () => { ScreenCapture.allowScreenCaptureAsync(); };
  }, []);

  // ── Load photos ───────────────────────────
  useEffect(() => {
    if (safeShowPhotos && safeShowPhotos.length > 0) {
      setPhotos(safeShowPhotos);
    } else if (safeShowPhotoIds && safeShowPhotoIds.length > 0) {
      getPhotosByIds(safeShowPhotoIds).then(setPhotos);
    }
  }, [safeShowPhotos, safeShowPhotoIds, getPhotosByIds]);

  // ── Block hardware back → show PIN ────────
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!pinVisible) setPinVisible(true);
      return true; // prevent default
    });
    return () => sub.remove();
  }, [pinVisible]);

  // ── App background detection ──────────────
  // When app goes to background during Safe Show → show lock screen on return
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (
        (prev === 'active' || prev === 'inactive') &&
        nextState === 'background'
      ) {
        // App went to background (Home button, call, etc.)
        // We track this but don't immediately lock (allow calls to happen)
        wasInSafeShowRef.current = true;
      }

      if (
        prev === 'background' &&
        (nextState === 'active' || nextState === 'inactive') &&
        wasInSafeShowRef.current
      ) {
        // App returned from background → show background lock screen
        setIsBackgrounded(true);
        wasInSafeShowRef.current = false;
      }
    });
    return () => sub.remove();
  }, []);

  // ── Auto-hide controls ────────────────────
  useEffect(() => {
    const t = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(t);
  }, [currentIndex, showControls]);

  // ── PIN verify to EXIT Safe Show ──────────
  const handleExitPinSuccess = useCallback(async (pin: string) => {
    const ok = await verifyUserPin(pin);
    if (ok) {
      setPinVisible(false);
      deactivateSafeShow();
      navigation.goBack();
    } else {
      globalThis.__pinPadWrongPin?.();
    }
  }, [verifyUserPin, deactivateSafeShow, navigation]);

  const toggleControls = () => setShowControls(v => !v);

  // ── Background lock screen ─────────────────
  if (isBackgrounded) {
    return (
      <BackgroundLockScreen onUnlock={() => setIsBackgrounded(false)} />
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading photos…</Text>
      </View>
    );
  }

  const current = photos[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Screen Pinning guide — shown once when Safe Show starts */}
      <PinningGuideModal
        visible={showPinningGuide}
        onDismiss={() => setShowPinningGuide(false)}
      />

      {/* Photo pager — scroll disabled when zoomed */}
      <PagerView
        style={styles.pager}
        initialPage={0}
        scrollEnabled={!isZoomed}
        onPageSelected={e => {
          setCurrentIndex(e.nativeEvent.position);
          setShowControls(true);
          setIsZoomed(false);
        }}
      >
        {photos.map((photo) => (
          <View
            key={photo.id}
            style={styles.page}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={StyleSheet.absoluteFill}
              onPress={() => { if (!isZoomed) setShowControls(v => !v); }}
            />
            <ZoomableImage
              uri={photo.uri}
              onZoomChange={zoomed => {
                setIsZoomed(zoomed);
                if (zoomed) setShowControls(false);
              }}
            />
          </View>
        ))}
      </PagerView>

      {/* Top bar */}
      {showControls && (
        <View style={styles.topBar}>
          <View style={styles.safeShowBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.safeGreen} />
            <Text style={styles.safeShowLabel}>SAFE SHOW</Text>
          </View>
          <Text style={styles.counter}>{currentIndex + 1} / {photos.length}</Text>
          <TouchableOpacity onPress={() => setPinVisible(true)} style={styles.exitBtn}>
            <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} />
            <Text style={styles.exitText}>Exit</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom bar */}
      {showControls && (
        <View style={styles.bottomBar}>
          <Text style={styles.filename} numberOfLines={1}>{current?.filename}</Text>
          {/* Navigation dots */}
          {photos.length <= 12 && (
            <View style={styles.dotRow}>
              {photos.map((_, i) => (
                <View key={i} style={[styles.navDot, i === currentIndex && styles.navDotActive]} />
              ))}
            </View>
          )}
          {/* Lock hint */}
          <TouchableOpacity onPress={() => setShowPinningGuide(true)} style={styles.lockHintBtn}>
            <Ionicons name="help-circle-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.lockHintText}>How to fully lock screen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PIN Exit Gate */}
      <PinPad
        visible={pinVisible}
        mode="verify"
        title="Enter PIN to Exit"
        subtitle="Safe Show mode is active"
        onSuccess={handleExitPinSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  loading: {
    flex: 1, backgroundColor: Colors.black,
    justifyContent: 'center', alignItems: 'center',
  },
  loadingText: { color: Colors.textSecondary, fontSize: Typography.fontSizeMD },
  pager: { flex: 1 },
  page: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  photo: { width, height },
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  safeShowBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.safeGreenGlow,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.safeGreenDim,
  },
  safeShowLabel: {
    color: Colors.safeGreen, fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightBold, letterSpacing: 1,
  },
  counter: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM },
  exitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.1)',
  },
  exitText: { color: Colors.textSecondary, fontSize: Typography.fontSizeSM },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.md,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center', gap: Spacing.xs,
  },
  filename: { color: Colors.textSecondary, fontSize: Typography.fontSizeXS, maxWidth: '80%' },
  dotRow: { flexDirection: 'row', gap: 6 },
  navDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  navDotActive: { backgroundColor: Colors.safeGreen, width: 18 },
  lockHintBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.6 },
  lockHintText: { color: Colors.textMuted, fontSize: Typography.fontSizeXS },
});

export default SafeShowScreen;

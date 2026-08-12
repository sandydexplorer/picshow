import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, Alert, ScrollView, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import PinPad from '../components/PinPad';

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { verifyUserPin, setUpPin } = useAuth();

  const [pinModalMode, setPinModalMode] = useState<'verify_old' | 'set_new' | null>(null);
  const [screenshotBlock, setScreenshotBlock] = useState(true);
  const [bgLock, setBgLock] = useState(true);

  const handleChangePinPress = () => setPinModalMode('verify_old');

  const handlePinSuccess = useCallback(async (pin: string) => {
    if (pinModalMode === 'verify_old') {
      const ok = await verifyUserPin(pin);
      if (ok) {
        setPinModalMode('set_new');
      } else {
        globalThis.__pinPadWrongPin?.();
      }
    } else if (pinModalMode === 'set_new') {
      await setUpPin(pin);
      setPinModalMode(null);
      Alert.alert('PIN Updated', 'Your PIN has been changed successfully.');
    }
  }, [pinModalMode, verifyUserPin, setUpPin]);

  const SettingRow = ({ icon, iconColor = Colors.primary, label, sub, onPress, rightEl, destructive = false }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={[styles.rowIcon, { backgroundColor: destructive ? 'rgba(255,77,106,0.15)' : Colors.primaryGlow }]}>
        <Ionicons name={icon} size={20} color={destructive ? Colors.danger : iconColor} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, destructive && { color: Colors.danger }]}>{label}</Text>
        {sub && <Text style={styles.rowSub}>{sub}</Text>}
      </View>
      {rightEl ?? (onPress && <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />)}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* HOW TO USE */}
        <Text style={styles.sectionTitle}>How to Use</Text>
        <View style={styles.section}>
          <View style={styles.howToCard}>
            {[
              { icon: 'hand-left-outline', step: '1', text: 'Long-press any photo in Gallery to enter Select mode' },
              { icon: 'checkmark-circle-outline', step: '2', text: 'Tap photos to select all the ones you want to show' },
              { icon: 'shield-checkmark-outline', step: '3', text: 'Tap "Safe Show" — only selected photos will be visible' },
              { icon: 'lock-closed-outline', step: '4', text: 'Hand phone to the other person. They can only see those photos' },
              { icon: 'keypad-outline', step: '5', text: 'When done, tap Exit and enter your PIN to leave Safe Show' },
              { icon: 'bookmark-outline', step: '6', text: 'Save frequently used sets as Safe Albums in the Albums tab' },
            ].map(item => (
              <View key={item.step} style={styles.howToRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{item.step}</Text>
                </View>
                <View style={styles.stepIconWrap}>
                  <Ionicons name={item.icon as any} size={18} color={Colors.primary} />
                </View>
                <Text style={styles.howToText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Pinning tip */}
          <View style={styles.tipCard}>
            <Ionicons name="information-circle" size={18} color={Colors.safeGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Extra Lock: Screen Pinning</Text>
              <Text style={styles.tipText}>
                When Safe Show starts, tap the <Text style={{ color: Colors.textPrimary }}>ⓘ</Text> icon at the bottom to learn how to pin the screen — this blocks the Home button too, while still allowing incoming calls.
              </Text>
            </View>
          </View>
        </View>

        {/* SECURITY */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.section}>
          <SettingRow
            icon="key-outline"
            label="Change PIN"
            sub="Update your Safe Show exit PIN"
            onPress={handleChangePinPress}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="camera-outline"
            label="Block Screenshots"
            sub="Prevent screen capture in Safe Show mode"
            rightEl={
              <Switch
                value={screenshotBlock}
                onValueChange={setScreenshotBlock}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.safeGreenDim }}
                thumbColor={screenshotBlock ? Colors.safeGreen : Colors.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="phone-portrait-outline"
            label="Lock on Background"
            sub="Require PIN if app goes to background during Safe Show"
            rightEl={
              <Switch
                value={bgLock}
                onValueChange={setBgLock}
                trackColor={{ false: Colors.surfaceBorder, true: Colors.safeGreenDim }}
                thumbColor={bgLock ? Colors.safeGreen : Colors.textMuted}
              />
            }
          />
        </View>

        {/* ABOUT */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.section}>
          <SettingRow
            icon="information-circle-outline"
            label="App Version"
            sub="1.0.0 — PicShow"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="shield-checkmark-outline"
            label="Privacy"
            sub="All photos stay on your device. Nothing is uploaded anywhere."
            iconColor={Colors.safeGreen}
          />
        </View>

        <View style={styles.footer}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.primaryDim} />
          <Text style={styles.footerText}>PicShow — Show what you want, hide what you don't</Text>
        </View>
      </ScrollView>

      {/* Change PIN — step 1: verify current PIN */}
      {pinModalMode === 'verify_old' && (
        <PinPad
          visible
          mode="verify"
          title="Enter Current PIN"
          subtitle="Verify your identity before changing PIN"
          onSuccess={handlePinSuccess}
          onCancel={() => setPinModalMode(null)}
        />
      )}
      {/* Change PIN — step 2: set new PIN */}
      {pinModalMode === 'set_new' && (
        <PinPad
          visible
          mode="setup"
          title="Set New PIN"
          subtitle="Choose your new PIN"
          allowLengthChange
          onSuccess={handlePinSuccess}
          onCancel={() => setPinModalMode(null)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    color: Colors.textPrimary, fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
  },
  scroll: { padding: Spacing.md, paddingBottom: 100 },
  sectionTitle: {
    color: Colors.textMuted, fontSize: Typography.fontSizeXS,
    fontWeight: Typography.fontWeightSemiBold,
    letterSpacing: 1, textTransform: 'uppercase',
    marginTop: Spacing.md, marginBottom: Spacing.xs, marginLeft: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg, borderWidth: 1,
    borderColor: Colors.surfaceBorder, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.md, gap: Spacing.md,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: Radius.sm,
    justifyContent: 'center', alignItems: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    color: Colors.textPrimary, fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
  rowSub: { color: Colors.textSecondary, fontSize: Typography.fontSizeXS, marginTop: 2 },
  divider: {
    height: 1, backgroundColor: Colors.surfaceBorder,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  howToCard: { padding: Spacing.md, gap: Spacing.md },
  howToRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  stepBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
    flexShrink: 0, marginTop: 1,
  },
  stepNum: { color: Colors.white, fontSize: 11, fontWeight: Typography.fontWeightBold },
  stepIconWrap: { flexShrink: 0, marginTop: 1 },
  howToText: {
    color: Colors.textSecondary, fontSize: Typography.fontSizeSM,
    lineHeight: 20, flex: 1,
  },
  tipCard: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.safeGreenGlow,
    borderTopWidth: 1, borderTopColor: Colors.safeGreenDim,
    padding: Spacing.md,
  },
  tipTitle: {
    color: Colors.safeGreen, fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold, marginBottom: 3,
  },
  tipText: { color: Colors.textSecondary, fontSize: Typography.fontSizeXS, lineHeight: 18 },
  footer: { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl, opacity: 0.5 },
  footerText: { color: Colors.textSecondary, fontSize: Typography.fontSizeXS, textAlign: 'center' },
});

export default SettingsScreen;

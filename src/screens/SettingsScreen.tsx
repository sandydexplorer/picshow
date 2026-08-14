import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, Alert, ScrollView, Modal, FlatList, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { usePhotos, DeviceAlbum } from '../hooks/usePhotos';
import PinPad from '../components/PinPad';

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { verifyUserPin, setUpPin, userPinLength, hasPinSet } = useAuth();
  const { albums, loadAlbums, excludedFolderIds, toggleFolderVisibility } = usePhotos();

  const [pinModalMode, setPinModalMode] = useState<'verify_old' | 'set_new' | 'verify_folders' | null>(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [screenshotBlock, setScreenshotBlock] = useState(true);
  const [bgLock, setBgLock] = useState(true);

  useEffect(() => {
    loadAlbums();
  }, []);

  const handleChangePinPress = () => setPinModalMode('verify_old');

  const handleFolderSettingsPress = () => {
    if (hasPinSet) {
      setPinModalMode('verify_folders');
    } else {
      setShowFolderModal(true);
    }
  };

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
    } else if (pinModalMode === 'verify_folders') {
      const ok = await verifyUserPin(pin);
      if (ok) {
        setPinModalMode(null);
        setShowFolderModal(true);
      } else {
        globalThis.__pinPadWrongPin?.();
      }
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

        {/* FOLDER PRIVACY & VISIBILITY */}
        <Text style={styles.sectionTitle}>Folder Privacy & Visibility</Text>
        <View style={styles.section}>
          <SettingRow
            icon="folder-open-outline"
            label="Manage Visible Folders"
            sub={
              excludedFolderIds.size > 0
                ? `${excludedFolderIds.size} folder${excludedFolderIds.size > 1 ? 's' : ''} hidden from All Photos scan`
                : 'All device folders visible in All Photos'
            }
            onPress={handleFolderSettingsPress}
          />
        </View>

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
            sub="1.1.0 — PicShow"
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
          pinLength={userPinLength}
          title="Enter Current PIN"
          subtitle="Verify your identity before changing PIN"
          onSuccess={handlePinSuccess}
          onCancel={() => setPinModalMode(null)}
        />
      )}
      {/* Verify PIN before managing folders */}
      {pinModalMode === 'verify_folders' && (
        <PinPad
          visible
          mode="verify"
          pinLength={userPinLength}
          title="Enter PIN"
          subtitle="Verify identity to manage hidden folders"
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

      {/* Folder Visibility Modal */}
      <Modal visible={showFolderModal} animationType="slide" transparent>
        <View style={styles.folderModalOverlay}>
          <View style={[styles.folderModalCard, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.folderModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.folderModalTitle}>Folder Privacy & Visibility</Text>
                <Text style={styles.folderModalSub}>
                  Toggle OFF folders you do not want to see in All Photos.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowFolderModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {albums.length === 0 ? (
              <View style={styles.folderModalEmpty}>
                <Ionicons name="folder-open-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.folderModalEmptyText}>No device folders detected</Text>
              </View>
            ) : (
              <FlatList
                data={albums}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.folderList}
                renderItem={({ item }: { item: DeviceAlbum }) => {
                  const isVisible = !excludedFolderIds.has(item.id);
                  return (
                    <View style={styles.folderRow}>
                      {item.coverUri ? (
                        <Image source={{ uri: item.coverUri }} style={styles.folderThumb} resizeMode="cover" />
                      ) : (
                        <View style={[styles.folderThumb, styles.folderThumbPlaceholder]}>
                          <Ionicons name="folder-outline" size={20} color={Colors.textMuted} />
                        </View>
                      )}
                      <View style={styles.folderInfo}>
                        <Text style={styles.folderTitle} numberOfLines={1}>{item.title}</Text>
                        <Text style={styles.folderCount}>{item.assetCount} items</Text>
                      </View>
                      <Switch
                        value={isVisible}
                        onValueChange={() => toggleFolderVisibility(item.id)}
                        trackColor={{ false: Colors.surfaceBorder, true: Colors.safeGreenDim }}
                        thumbColor={isVisible ? Colors.safeGreen : Colors.textMuted}
                      />
                    </View>
                  );
                }}
              />
            )}

            <TouchableOpacity style={styles.doneBtn} onPress={() => setShowFolderModal(false)}>
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    width: 36, height: 36, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    color: Colors.textPrimary, fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightMedium,
  },
  rowSub: { color: Colors.textMuted, fontSize: Typography.fontSizeXS, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.surfaceBorder, marginLeft: 64 },

  howToCard: { padding: Spacing.md, gap: Spacing.sm },
  howToRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepBadge: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  stepIconWrap: { width: 24, alignItems: 'center' },
  howToText: { flex: 1, color: Colors.textSecondary, fontSize: Typography.fontSizeXS, lineHeight: 18 },

  tipCard: {
    flexDirection: 'row', padding: Spacing.md,
    gap: Spacing.sm, backgroundColor: Colors.safeGreenGlow,
  },
  tipTitle: { color: Colors.safeGreen, fontSize: Typography.fontSizeXS, fontWeight: '700' },
  tipText: { color: Colors.textSecondary, fontSize: Typography.fontSizeXS, marginTop: 2, lineHeight: 16 },

  footer: { alignItems: 'center', marginTop: Spacing.xl, gap: Spacing.xs },
  footerText: { color: Colors.textMuted, fontSize: Typography.fontSizeXS, textAlign: 'center' },

  folderModalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  folderModalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg, maxHeight: '85%',
    borderTopWidth: 1, borderColor: Colors.surfaceBorder,
  },
  folderModalHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  folderModalTitle: {
    color: Colors.textPrimary, fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
  folderModalSub: {
    color: Colors.textMuted, fontSize: Typography.fontSizeXS, marginTop: 2,
  },
  closeBtn: { padding: 4 },
  folderList: { paddingVertical: Spacing.xs, gap: Spacing.sm },
  folderRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: 8, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: Colors.surfaceBorder,
  },
  folderThumb: { width: 44, height: 44, borderRadius: Radius.md },
  folderThumbPlaceholder: {
    backgroundColor: Colors.surface,
    justifyContent: 'center', alignItems: 'center',
  },
  folderInfo: { flex: 1 },
  folderTitle: { color: Colors.textPrimary, fontSize: Typography.fontSizeMD, fontWeight: Typography.fontWeightMedium },
  folderCount: { color: Colors.textMuted, fontSize: Typography.fontSizeXS, marginTop: 2 },
  folderModalEmpty: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm },
  folderModalEmptyText: { color: Colors.textMuted, fontSize: Typography.fontSizeSM },
  doneBtn: {
    backgroundColor: Colors.primary, paddingVertical: Spacing.md,
    borderRadius: Radius.lg, alignItems: 'center', marginTop: Spacing.md,
  },
  doneBtnText: { color: Colors.white, fontWeight: Typography.fontWeightBold, fontSize: Typography.fontSizeMD },
});

export default SettingsScreen;

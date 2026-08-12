import React, { useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, TextInput, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useSafeShow } from '../context/SafeShowContext';

interface Props {
  selectedCount: number;
  onStartSafeShow: () => void;
  onCancel: () => void;
  onSaveAlbum: () => void;
}

const SafeShowBanner: React.FC<Props> = ({ selectedCount, onStartSafeShow, onCancel, onSaveAlbum }) => {
  const slideAnim = useRef(new Animated.Value(1)).current;

  const pulse = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 1.04, duration: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Animated.View style={[styles.banner, { transform: [{ scale: slideAnim }] }]}>
      <View style={styles.left}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
          <Ionicons name="close" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{selectedCount}</Text>
        </View>
        <Text style={styles.selectedLabel}>
          {selectedCount === 1 ? 'photo selected' : 'photos selected'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onSaveAlbum} style={styles.albumBtn}>
          <Ionicons name="bookmark-outline" size={18} color={Colors.primary} />
          <Text style={styles.albumBtnText}>Save Album</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onStartSafeShow}
          style={[styles.startBtn, selectedCount === 0 && styles.startBtnDisabled]}
          disabled={selectedCount === 0}
        >
          <Ionicons name="shield-checkmark" size={18} color={Colors.black} />
          <Text style={styles.startBtnText}>Safe Show</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cancelBtn: {
    padding: 4,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    minWidth: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    color: Colors.white,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
  selectedLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  albumBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  albumBtnText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightSemiBold,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.safeGreen,
  },
  startBtnDisabled: {
    opacity: 0.4,
  },
  startBtnText: {
    color: Colors.black,
    fontSize: Typography.fontSizeSM,
    fontWeight: Typography.fontWeightBold,
  },
});

export default SafeShowBanner;

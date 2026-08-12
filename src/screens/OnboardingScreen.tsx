import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import PinPad from '../components/PinPad';

const OnboardingScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { setUpPin } = useAuth();
  const [showPinSetup, setShowPinSetup] = useState(false);

  const features = [
    { icon: 'images-outline', title: 'All Your Photos', desc: 'Access every photo on your device, organized beautifully.' },
    { icon: 'shield-checkmark-outline', title: 'Safe Show Mode', desc: 'Select photos, activate Safe Show — only those photos are visible.' },
    { icon: 'lock-closed-outline', title: 'PIN Protected', desc: 'A secret PIN is required to exit Safe Show mode. You stay in control.' },
    { icon: 'bookmark-outline', title: 'Safe Albums', desc: 'Save collections like "Wedding" or "Kids" for quick one-tap sharing.' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={styles.logoCircle}>
          <Ionicons name="shield-checkmark" size={48} color={Colors.safeGreen} />
        </View>
        <Text style={styles.appName}>PicShow</Text>
        <Text style={styles.tagline}>Show what you want, hide what you don't</Text>
      </View>

      {/* Features */}
      <View style={styles.features}>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={22} color={Colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <Text style={styles.ctaHint}>You'll set a PIN to protect Safe Show mode.</Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={() => setShowPinSetup(true)}>
          <Text style={styles.ctaBtnText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.black} />
        </TouchableOpacity>
      </View>

      <PinPad
        visible={showPinSetup}
        mode="setup"
        title="Set your Safe Show PIN"
        subtitle="You'll need this to exit Safe Show mode"
        onSuccess={async (pin) => {
          await setUpPin(pin);
          setShowPinSetup(false);
        }}
        onCancel={() => setShowPinSetup(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  logoArea: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.sm,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.safeGreenGlow,
    borderWidth: 1,
    borderColor: Colors.safeGreenDim,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  appName: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeDisplay,
    fontWeight: Typography.fontWeightExtraBold,
    letterSpacing: -0.5,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
    textAlign: 'center',
  },
  features: {
    gap: Spacing.lg,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeMD,
    fontWeight: Typography.fontWeightSemiBold,
  },
  featureDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
    lineHeight: 20,
  },
  cta: {
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  ctaHint: {
    color: Colors.textMuted,
    fontSize: Typography.fontSizeXS,
    textAlign: 'center',
  },
  ctaBtn: {
    backgroundColor: Colors.safeGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },
  ctaBtnText: {
    color: Colors.black,
    fontSize: Typography.fontSizeLG,
    fontWeight: Typography.fontWeightBold,
  },
});

export default OnboardingScreen;

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Modal, Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../theme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type PinLength = 4 | 6;

interface Props {
  visible: boolean;
  mode: 'setup' | 'verify' | 'change';
  onSuccess: (pin: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  pinLength?: PinLength;
  allowLengthChange?: boolean; // show 4/6 toggle in setup mode
}

const PinPad: React.FC<Props> = ({
  visible, mode, onSuccess, onCancel,
  title, subtitle, pinLength = 6, allowLengthChange = false,
}) => {
  const insets = useSafeAreaInsets();
  const [currentLength, setCurrentLength] = useState<PinLength>(pinLength);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setError('');
      setCurrentLength(pinLength);
    }
  }, [visible, pinLength]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (locked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(t => {
          if (t <= 1) { setLocked(false); setAttempts(0); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [locked, lockTimer]);

  const shake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const handleWrongPin = useCallback(() => {
    shake();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setPin('');
    if (newAttempts >= 5) {
      setLocked(true);
      setLockTimer(30);
      setError('Too many attempts. Wait 30 seconds.');
    } else {
      setError(`Incorrect PIN. ${5 - newAttempts} attempt${5 - newAttempts !== 1 ? 's' : ''} remaining.`);
    }
  }, [attempts, shake]);

  useEffect(() => {
    if (visible && mode === 'verify') {
      globalThis.__pinPadWrongPin = handleWrongPin;
    }
    return () => { delete globalThis.__pinPadWrongPin; };
  }, [visible, mode, handleWrongPin]);

  const handleDigit = useCallback((digit: string) => {
    if (locked) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = step === 'confirm' ? confirmPin : pin;
    if (current.length >= currentLength) return;
    const next = current + digit;

    if (step === 'enter') {
      setPin(next);
      if (next.length === currentLength) {
        if (mode === 'setup' || mode === 'change') {
          setTimeout(() => { setStep('confirm'); setError(''); }, 200);
        } else {
          setTimeout(() => onSuccess(next), 200);
        }
      }
    } else {
      setConfirmPin(next);
      if (next.length === currentLength) {
        if (next === pin) {
          setTimeout(() => onSuccess(next), 200);
        } else {
          setError('PINs do not match. Try again.');
          shake();
          setTimeout(() => { setConfirmPin(''); setPin(''); setStep('enter'); setError(''); }, 800);
        }
      }
    }
  }, [locked, step, pin, confirmPin, mode, currentLength, onSuccess, shake]);

  const handleBackspace = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'confirm') {
      setConfirmPin(p => p.slice(0, -1));
    } else {
      setPin(p => p.slice(0, -1));
    }
  }, [step]);

  const handleLengthToggle = (len: PinLength) => {
    setCurrentLength(len);
    setPin('');
    setConfirmPin('');
    setError('');
    setStep('enter');
  };

  const currentPin = step === 'confirm' ? confirmPin : pin;
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  const getTitle = () => {
    if (title) return title;
    if (mode === 'setup') return step === 'enter' ? 'Set your PIN' : 'Confirm PIN';
    if (mode === 'change') return step === 'enter' ? 'New PIN' : 'Confirm new PIN';
    return 'Enter PIN to exit';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={styles.container}>
        {/* Cancel button — always shown when onCancel is provided */}
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={[styles.cancelBtn, { top: Math.max(insets.top + 8, 44) }]}>
            <Ionicons name="chevron-back" size={22} color={Colors.primary} />
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={40} color={Colors.safeGreen} />
          </View>
          <Text style={styles.title}>{getTitle()}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {locked && <Text style={styles.lockText}>🔒 Locked for {lockTimer}s</Text>}
        </View>

        {/* 4 / 6 digit toggle — only in setup mode */}
        {(mode === 'setup' || allowLengthChange) && step === 'enter' && (
          <View style={styles.lengthToggle}>
            <Text style={styles.lengthLabel}>PIN length:</Text>
            {([4, 6] as PinLength[]).map(len => (
              <TouchableOpacity
                key={len}
                style={[styles.lengthBtn, currentLength === len && styles.lengthBtnActive]}
                onPress={() => handleLengthToggle(len)}
              >
                <Text style={[styles.lengthBtnText, currentLength === len && styles.lengthBtnTextActive]}>
                  {len} digits
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Dots */}
        <Animated.View style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}>
          {Array.from({ length: currentLength }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < currentPin.length ? styles.dotFilled : styles.dotEmpty,
              ]}
            />
          ))}
        </Animated.View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {keys.map((key, i) => {
            if (key === '') return <View key={i} style={styles.keyEmpty} />;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.key, locked && styles.keyDisabled]}
                onPress={() => key === '⌫' ? handleBackspace() : handleDigit(key)}
                activeOpacity={0.7}
              >
                <Text style={key === '⌫' ? styles.keyBackspace : styles.keyText}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  cancelBtn: {
    position: 'absolute',
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 8,
    zIndex: 20,
  },
  cancelText: {
    color: Colors.primary,
    fontSize: Typography.fontSizeMD,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.safeGreenGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightBold,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.fontSizeSM,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  lockText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeMD,
    marginTop: Spacing.sm,
  },
  lengthToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  lengthLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
  },
  lengthBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  lengthBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryGlow,
  },
  lengthBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeSM,
  },
  lengthBtnTextActive: {
    color: Colors.primary,
    fontWeight: Typography.fontWeightSemiBold,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dotFilled: {
    backgroundColor: Colors.safeGreen,
  },
  dotEmpty: {
    backgroundColor: Colors.surfaceBorder,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    maxWidth: 280,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyEmpty: {
    width: 76,
    height: 76,
  },
  keyDisabled: {
    opacity: 0.3,
  },
  keyText: {
    color: Colors.textPrimary,
    fontSize: Typography.fontSizeXL,
    fontWeight: Typography.fontWeightMedium,
  },
  keyBackspace: {
    color: Colors.textSecondary,
    fontSize: Typography.fontSizeLG,
  },
});

export default PinPad;

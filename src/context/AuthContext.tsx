import React, { createContext, useContext, useState, useCallback } from 'react';
import { SecureStorage } from '../utils/secureStorage';
import { hashPin, verifyPin } from '../utils/pinHash';

interface AuthContextType {
  isOnboarded: boolean;
  hasPinSet: boolean;
  userPinLength: 4 | 6;
  setUpPin: (pin: string) => Promise<void>;
  verifyUserPin: (pin: string) => Promise<boolean>;
  checkOnboarded: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [userPinLength, setUserPinLength] = useState<4 | 6>(6);

  const checkOnboarded = useCallback(async () => {
    const onboarded = await SecureStorage.get(SecureStorage.keys.ONBOARDED);
    const pinHash = await SecureStorage.get(SecureStorage.keys.PIN_HASH);
    const storedLen = await SecureStorage.get(SecureStorage.keys.PIN_LENGTH);
    setIsOnboarded(onboarded === 'true');
    setHasPinSet(!!pinHash);
    if (storedLen === '4') setUserPinLength(4);
    else if (storedLen === '6') setUserPinLength(6);
  }, []);

  const setUpPin = useCallback(async (pin: string) => {
    const hash = hashPin(pin);
    const len: 4 | 6 = pin.length === 4 ? 4 : 6;
    await SecureStorage.set(SecureStorage.keys.PIN_HASH, hash);
    await SecureStorage.set(SecureStorage.keys.PIN_LENGTH, len.toString());
    await SecureStorage.set(SecureStorage.keys.ONBOARDED, 'true');
    setUserPinLength(len);
    setHasPinSet(true);
    setIsOnboarded(true);
  }, []);

  const verifyUserPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = await SecureStorage.get(SecureStorage.keys.PIN_HASH);
    if (!storedHash) return false;
    return verifyPin(pin, storedHash);
  }, []);

  return (
    <AuthContext.Provider value={{
      isOnboarded, hasPinSet, userPinLength,
      setUpPin, verifyUserPin, checkOnboarded
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

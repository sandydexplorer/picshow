import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { SecureStorage } from '../utils/secureStorage';
import { hashPin, verifyPin } from '../utils/pinHash';

interface AuthContextType {
  isOnboarded: boolean;
  hasPinSet: boolean;
  setUpPin: (pin: string) => Promise<void>;
  verifyUserPin: (pin: string) => Promise<boolean>;
  checkOnboarded: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);

  const checkOnboarded = useCallback(async () => {
    const onboarded = await SecureStorage.get(SecureStorage.keys.ONBOARDED);
    const pinHash = await SecureStorage.get(SecureStorage.keys.PIN_HASH);
    setIsOnboarded(onboarded === 'true');
    setHasPinSet(!!pinHash);
  }, []);

  const setUpPin = useCallback(async (pin: string) => {
    const hash = hashPin(pin);
    await SecureStorage.set(SecureStorage.keys.PIN_HASH, hash);
    await SecureStorage.set(SecureStorage.keys.ONBOARDED, 'true');
    setHasPinSet(true);
    setIsOnboarded(true);
  }, []);

  const verifyUserPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedHash = await SecureStorage.get(SecureStorage.keys.PIN_HASH);
    if (!storedHash) return false;
    return verifyPin(pin, storedHash);
  }, []);

  return (
    <AuthContext.Provider value={{ isOnboarded, hasPinSet, setUpPin, verifyUserPin, checkOnboarded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

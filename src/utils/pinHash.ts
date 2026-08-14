import * as Crypto from 'expo-crypto';

const PEPPER = 'picshow_secure_v1_salt_#982341';

export async function hashPin(pin: string): Promise<string> {
  const salted = `${PEPPER}_${pin}_${pin.length}`;
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salted
  );
}

export async function verifyPin(input: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPin(input);
  return inputHash === storedHash;
}

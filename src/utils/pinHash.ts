// Simple hash using a fold of character codes — lightweight, no native crypto needed
// For production, replace with a proper SHA-256 via expo-crypto
export function hashPin(pin: string): string {
  let hash = 5381;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) + hash + pin.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit int
  }
  // Add a fixed salt and encode
  const salted = `picshow_${Math.abs(hash).toString(16)}_${pin.length}`;
  let hash2 = 0;
  for (let i = 0; i < salted.length; i++) {
    hash2 = (hash2 << 5) - hash2 + salted.charCodeAt(i);
    hash2 = hash2 & hash2;
  }
  return Math.abs(hash2).toString(16).padStart(16, '0');
}

export function verifyPin(input: string, storedHash: string): boolean {
  return hashPin(input) === storedHash;
}

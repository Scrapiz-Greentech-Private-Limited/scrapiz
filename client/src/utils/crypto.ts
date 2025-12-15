import * as Crypto from 'expo-crypto';

/**
 * Result of nonce generation containing both raw and hashed values.
 */
export interface NonceResult {
  /** Raw nonce as hex string - sent to backend for verification */
  rawNonce: string;
  /** SHA256 hash of raw nonce - sent to Apple during Sign-In */
  nonceHash: string;
}

/**
 * Generate a cryptographically secure random nonce for Apple Sign-In.
 * 
 * The nonce flow works as follows:
 * 1. Generate 32 random bytes and convert to hex string (rawNonce)
 * 2. Compute SHA256 hash of rawNonce (nonceHash)
 * 3. Send nonceHash to Apple during Sign-In request
 * 4. Send rawNonce to backend for verification
 * 5. Backend verifies SHA256(rawNonce) === token.nonce claim
 * 
 * This prevents replay attacks by ensuring each authentication
 * request uses a unique, verifiable nonce.
 * 
 * @returns Object containing raw nonce and its SHA256 hash
 */
export async function generateNonce(): Promise<NonceResult> {
  // Generate 32 random bytes and convert to hex string
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const rawNonce = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // SHA256 hash the nonce for Apple
  const nonceHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  return { rawNonce, nonceHash };
}

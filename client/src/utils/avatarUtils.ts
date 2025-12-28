import * as Crypto from 'expo-crypto';

/**
 * Avatar configuration interface for DiceBear avatar settings.
 */
export interface AvatarConfig {
  avatarProvider: string | null;
  avatarStyle: string | null;
  avatarSeed: string | null;
}

/**
 * Avatar style definition with id, display name, and localization key.
 */
export interface AvatarStyleDefinition {
  id: string;
  name: string;
  nameKey: string;
}

/**
 * Supported DiceBear avatar styles.
 * Each style has an id (used in API), display name, and localization key.
 */
export const AVATAR_STYLES: readonly AvatarStyleDefinition[] = [
  { id: 'avataaars', name: 'Avataaars', nameKey: 'avatar.styles.avataaars' },
  { id: 'pixel-art', name: 'Pixel Art', nameKey: 'avatar.styles.pixelArt' },
  { id: 'bottts', name: 'Bottts', nameKey: 'avatar.styles.bottts' },
  { id: 'lorelei', name: 'Lorelei', nameKey: 'avatar.styles.lorelei' },
  { id: 'adventurer', name: 'Adventurer', nameKey: 'avatar.styles.adventurer' },
  { id: 'fun-emoji', name: 'Fun Emoji', nameKey: 'avatar.styles.funEmoji' },
] as const;

/**
 * Valid avatar style IDs for validation.
 */
export const VALID_AVATAR_STYLE_IDS = AVATAR_STYLES.map((style) => style.id);

/**
 * Generates a DiceBear avatar URL for the given style, seed, and size.
 *
 * @param style - The DiceBear style identifier (e.g., 'avataaars', 'pixel-art')
 * @param seed - The seed string for deterministic avatar generation
 * @param size - The size of the avatar in pixels (default: 128)
 * @returns The complete DiceBear API URL for the avatar
 */
export function generateAvatarUrl(
  style: string,
  seed: string,
  size: number = 128
): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/${style}/png?seed=${encodedSeed}&size=${size}`;
}

/**
 * Generates a random seed for avatar generation using crypto-secure random bytes.
 * The seed format is 'user_' followed by 12 random hex characters.
 *
 * @returns A unique seed string for avatar generation
 */
export async function generateRandomSeed(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(6);
  const hexString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `user_${hexString}`;
}

/**
 * Gets the avatar URL from an avatar configuration object.
 * Returns null if the configuration is invalid or incomplete.
 *
 * @param config - The avatar configuration object
 * @param size - The size of the avatar in pixels (default: 128)
 * @returns The DiceBear avatar URL or null if configuration is invalid
 */
export function getAvatarUrlFromConfig(
  config: AvatarConfig,
  size: number = 128
): string | null {
  if (
    config.avatarProvider === 'dicebear' &&
    config.avatarStyle &&
    config.avatarSeed
  ) {
    return generateAvatarUrl(config.avatarStyle, config.avatarSeed, size);
  }
  return null;
}

/**
 * Validates if a given style is a valid DiceBear avatar style.
 *
 * @param style - The style string to validate
 * @returns True if the style is valid, false otherwise
 */
export function isValidAvatarStyle(style: string | null | undefined): boolean {
  if (!style) return false;
  return VALID_AVATAR_STYLE_IDS.includes(style);
}

/**
 * User profile data relevant for avatar display.
 * This interface represents the subset of user data needed for avatar resolution.
 */
export interface UserAvatarData {
  profile_image?: string | null;
  avatar_provider?: string | null;
  avatar_style?: string | null;
  avatar_seed?: string | null;
}

/**
 * Result of avatar source resolution.
 * - If `uri` is provided, display the image from that URI
 * - If `uri` is null, display user initials as fallback
 */
export interface AvatarSource {
  uri: string;
}

/**
 * Determines the avatar source to display based on user data.
 * Implements priority logic: profile_image > DiceBear avatar > initials (null)
 *
 * Priority:
 * 1. If profile_image exists and is non-empty, return it
 * 2. If DiceBear avatar is configured (provider='dicebear', valid style, non-empty seed), return generated URL
 * 3. Otherwise, return null (caller should display initials)
 *
 * @param user - User data containing profile image and avatar configuration
 * @param size - Size of the DiceBear avatar in pixels (default: 128)
 * @returns AvatarSource with uri, or null if initials should be displayed
 *
 * Requirements: 1.4, 1.5, 4.2
 */
export function getAvatarSource(
  user: UserAvatarData,
  size: number = 128
): AvatarSource | null {
  // Priority 1: Check for profile_image (uploaded photo takes priority)
  if (user.profile_image && user.profile_image.trim() !== '') {
    return { uri: user.profile_image };
  }

  // Priority 2: Check for valid DiceBear avatar configuration
  const avatarUrl = getAvatarUrlFromConfig(
    {
      avatarProvider: user.avatar_provider ?? null,
      avatarStyle: user.avatar_style ?? null,
      avatarSeed: user.avatar_seed ?? null,
    },
    size
  );

  if (avatarUrl) {
    return { uri: avatarUrl };
  }

  // Priority 3: Return null to indicate initials should be displayed
  return null;
}

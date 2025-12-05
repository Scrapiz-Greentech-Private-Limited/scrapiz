import { TutorialConfig } from '@/src/store/tutorialStore';

/**
 * Profile Screen Tutorial Configuration
 * Guides users through the Profile screen features
 */
export const profileTutorialConfig: TutorialConfig = {
  screenName: 'profile',
  steps: [
    {
      id: 'profile-edit',
      title: 'Edit Profile',
      description: 'Tap here to update your name, email, phone number, and profile picture.',
      spotlightRadius: 80,
      // targetElement will be set dynamically by the Profile screen
    },
    {
      id: 'profile-addresses',
      title: 'Manage Addresses',
      description: 'Add, edit, or remove your saved addresses for faster pickups.',
      spotlightRadius: 80,
      // targetElement will be set dynamically by the Profile screen
    },
    {
      id: 'profile-referral',
      title: 'Refer Friends',
      description: 'Earn rewards by inviting friends to use Scrapiz. Share your referral code and get benefits!',
      spotlightRadius: 80,
      // targetElement will be set dynamically by the Profile screen
    },
  ],
};

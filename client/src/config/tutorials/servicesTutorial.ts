import { TutorialConfig } from '@/src/store/tutorialStore';

/**
 * Services Screen Tutorial Configuration
 * Guides users through available professional services
 */
export const servicesTutorialConfig: TutorialConfig = {
  screenName: 'services',
  steps: [
    {
      id: 'services-overview',
      title: 'Services Overview',
      description: 'Explore professional services for scrap collection, recycling, and waste management.',
    },
    {
      id: 'services-cards',
      title: 'Service Cards',
      description: 'Each card represents a different service. Tap a card to learn more about what\'s included.',
    },
    {
      id: 'services-details',
      title: 'Service Details',
      description: 'View detailed information about each service, including pricing, duration, and what\'s included.',
    },
    {
      id: 'services-booking',
      title: 'Booking Process',
      description: 'Ready to book? Tap the booking button to schedule a service at your convenience.',
    },
  ],
};


import { TutorialConfig } from '@/src/store/tutorialStore';
import i18n from '@/src/localization/i18n';

/**
 * Home Screen Tutorial Configuration
 * Guides users through the main features of the Home screen
 * Uses i18n for translations
 */
export const getHomeTutorialConfig = (): TutorialConfig => ({
  screenName: 'home',
  steps: [
    {
      id: 'home-location',
      title: i18n.t('tutorial.home.location.title'),
      description: i18n.t('tutorial.home.location.description'),
    },
    {
      id: 'home-search',
      title: i18n.t('tutorial.home.search.title'),
      description: i18n.t('tutorial.home.search.description'),
      // targetElement will be set dynamically by the Home screen
    },
    {
      id: 'home-quick-actions',
      title: i18n.t('tutorial.home.quickActions.title'),
      description: i18n.t('tutorial.home.quickActions.description'),
      // targetElement will be set dynamically by the Home screen
    },
    {
      id: 'home-rates',
      title: i18n.t('tutorial.home.rates.title'),
      description: i18n.t('tutorial.home.rates.description'),
    },
    {
      id: 'home-services',
      title: i18n.t('tutorial.home.services.title'),
      description: i18n.t('tutorial.home.services.description'),
    },
  ],
});

// Backward compatibility - export a static config that gets updated when language changes
export const homeTutorialConfig: TutorialConfig = getHomeTutorialConfig();
export const getProfileTutorialConfig = (): TutorialConfig => ({
  screenName: 'profile',
  steps: [
    {
      id: 'profile-header',
      title: i18n.t('tutorial.profile.header.title'),
      description: i18n.t('tutorial.profile.header.description'),
    },
    {
      id: 'profile-settings',
      title: i18n.t('tutorial.profile.settings.title'),
      description: i18n.t('tutorial.profile.settings.description'),
    },
    {
      id: 'profile-orders',
      title: i18n.t('tutorial.profile.orders.title'),
      description: i18n.t('tutorial.profile.orders.description'),
    },
    {
      id: 'profile-referral',
      title: i18n.t('tutorial.profile.referral.title'),
      description: i18n.t('tutorial.profile.referral.description'),
    },
    {
      id: 'profile-impact',
      title: i18n.t('tutorial.profile.impact.title'),
      description: i18n.t('tutorial.profile.impact.description'),
    },
  ],
});

export const profileTutorialConfig: TutorialConfig = getProfileTutorialConfig();
export const getRatesTutorialConfig = (): TutorialConfig => ({
  screenName: 'rates',
  steps: [
    {
      id: 'rates-disclaimer',
      title: i18n.t('tutorial.rates.disclaimer.title'),
      description: i18n.t('tutorial.rates.disclaimer.description'),
    },
    {
      id: 'rates-category',
      title: i18n.t('tutorial.rates.category.title'),
      description: i18n.t('tutorial.rates.category.description'),
    },
    {
      id: 'rates-items',
      title: i18n.t('tutorial.rates.items.title'),
      description: i18n.t('tutorial.rates.items.description'),
    },
    {
      id: 'rates-price-format',
      title: i18n.t('tutorial.rates.priceFormat.title'),
      description: i18n.t('tutorial.rates.priceFormat.description'),
    },
    {
      id: 'rates-contact',
      title: i18n.t('tutorial.rates.contact.title'),
      description: i18n.t('tutorial.rates.contact.description'),
    },
  ],
});

export const ratesTutorialConfig: TutorialConfig = getRatesTutorialConfig();
export const getSellTutorialConfig = (): TutorialConfig => ({
  screenName: 'sell',
  steps: [
    {
      id: 'sell-step-indicator',
      title: i18n.t('tutorial.sell.stepIndicator.title'),
      description: i18n.t('tutorial.sell.stepIndicator.description'),
    },
    {
      id: 'sell-item-selection',
      title: i18n.t('tutorial.sell.itemSelection.title'),
      description: i18n.t('tutorial.sell.itemSelection.description'),
    },
    {
      id: 'sell-quantity',
      title: i18n.t('tutorial.sell.quantity.title'),
      description: i18n.t('tutorial.sell.quantity.description'),
    },
    {
      id: 'sell-datetime',
      title: i18n.t('tutorial.sell.datetime.title'),
      description: i18n.t('tutorial.sell.datetime.description'),
    },
    {
      id: 'sell-address',
      title: i18n.t('tutorial.sell.address.title'),
      description: i18n.t('tutorial.sell.address.description'),
    },
    {
      id: 'sell-summary',
      title: i18n.t('tutorial.sell.summary.title'),
      description: i18n.t('tutorial.sell.summary.description'),
    },
  ],
});

export const sellTutorialConfig: TutorialConfig = getSellTutorialConfig();

export const getServicesTutorialConfig = (): TutorialConfig => ({
  screenName: 'services',
  steps: [
    {
      id: 'services-overview',
      title: i18n.t('tutorial.services.overview.title'),
      description: i18n.t('tutorial.services.overview.description'),
    },
    {
      id: 'services-cards',
      title: i18n.t('tutorial.services.cards.title'),
      description: i18n.t('tutorial.services.cards.description'),
    },
    {
      id: 'services-details',
      title: i18n.t('tutorial.services.details.title'),
      description: i18n.t('tutorial.services.details.description'),
    },
    {
      id: 'services-booking',
      title: i18n.t('tutorial.services.booking.title'),
      description: i18n.t('tutorial.services.booking.description'),
    },
  ],
});

export const servicesTutorialConfig: TutorialConfig = getServicesTutorialConfig();
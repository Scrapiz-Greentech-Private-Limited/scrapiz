/**
 * Internationalization tests for tutorial configurations
 * Tests that tutorial configs use translations correctly
 */

import i18n from '@/src/localization/i18n';
import {
  getHomeTutorialConfig,
  getProfileTutorialConfig,
  getRatesTutorialConfig,
  getSellTutorialConfig,
  getServicesTutorialConfig,
} from '../homeTutorial';

describe('Tutorial Configurations Internationalization', () => {
  describe('Home Tutorial Config', () => {
    it('should return English translations when language is English', async () => {
      await i18n.changeLanguage('en');
      const config = getHomeTutorialConfig();

      expect(config.screenName).toBe('home');
      expect(config.steps).toHaveLength(5);
      expect(config.steps[0].title).toBe('Location Selector');
      expect(config.steps[0].description).toContain('service location');
    });

    it('should return Hindi translations when language is Hindi', async () => {
      await i18n.changeLanguage('hi');
      const config = getHomeTutorialConfig();

      expect(config.screenName).toBe('home');
      expect(config.steps).toHaveLength(5);
      expect(config.steps[0].title).toBe('स्थान चयनकर्ता');
      expect(config.steps[0].description).toContain('सेवा स्थान');
    });

    it('should return Urdu translations when language is Urdu', async () => {
      await i18n.changeLanguage('ur');
      const config = getHomeTutorialConfig();

      expect(config.screenName).toBe('home');
      expect(config.steps).toHaveLength(5);
      expect(config.steps[0].title).toBe('مقام منتخب کنندہ');
      expect(config.steps[0].description).toContain('سروس');
    });
  });

  describe('Profile Tutorial Config', () => {
    it('should return English translations when language is English', async () => {
      await i18n.changeLanguage('en');
      const config = getProfileTutorialConfig();

      expect(config.screenName).toBe('profile');
      expect(config.steps).toHaveLength(5);
      expect(config.steps[0].title).toBe('Profile Header');
      expect(config.steps[0].description).toContain('profile information');
    });

    it('should return Marathi translations when language is Marathi', async () => {
      await i18n.changeLanguage('mr');
      const config = getProfileTutorialConfig();

      expect(config.screenName).toBe('profile');
      expect(config.steps).toHaveLength(5);
      expect(config.steps[0].title).toBe('प्रोफाइल हेडर');
      expect(config.steps[0].description).toContain('प्रोफाइल');
    });
  });

  describe('Rates Tutorial Config', () => {
    it('should return English translations when language is English', async () => {
      await i18n.changeLanguage('en');
      const config = getRatesTutorialConfig();

      expect(config.screenName).toBe('rates');
      expect(config.steps).toHaveLength(5);
      expect(config.steps[0].title).toBe('Price Disclaimer');
      expect(config.steps[0].description).toContain('estimates');
    });

    it('should return Gujarati translations when language is Gujarati', async () => {
      await i18n.changeLanguage('gu');
      const config = getRatesTutorialConfig();

      expect(config.screenName).toBe('rates');
      expect(config.steps).toHaveLength(5);
      expect(config.steps[0].title).toBe('કિંમત અસ્વીકરણ');
      expect(config.steps[0].description).toContain('અંદાજો');
    });
  });

  describe('Sell Tutorial Config', () => {
    it('should return English translations when language is English', async () => {
      await i18n.changeLanguage('en');
      const config = getSellTutorialConfig();

      expect(config.screenName).toBe('sell');
      expect(config.steps).toHaveLength(6);
      expect(config.steps[0].title).toBe('Step Indicator');
      expect(config.steps[0].description).toContain('progress');
    });

    it('should return Hindi translations when language is Hindi', async () => {
      await i18n.changeLanguage('hi');
      const config = getSellTutorialConfig();

      expect(config.screenName).toBe('sell');
      expect(config.steps).toHaveLength(6);
      expect(config.steps[0].title).toBe('चरण संकेतक');
      expect(config.steps[0].description).toContain('प्रगति');
    });
  });

  describe('Services Tutorial Config', () => {
    it('should return English translations when language is English', async () => {
      await i18n.changeLanguage('en');
      const config = getServicesTutorialConfig();

      expect(config.screenName).toBe('services');
      expect(config.steps).toHaveLength(4);
      expect(config.steps[0].title).toBe('Services Overview');
      expect(config.steps[0].description).toContain('professional services');
    });

    it('should return Urdu translations when language is Urdu', async () => {
      await i18n.changeLanguage('ur');
      const config = getServicesTutorialConfig();

      expect(config.screenName).toBe('services');
      expect(config.steps).toHaveLength(4);
      expect(config.steps[0].title).toBe('خدمات کا جائزہ');
      expect(config.steps[0].description).toContain('خدمات');
    });
  });

  describe('Dynamic language switching', () => {
    it('should update tutorial text when language changes', async () => {
      // Start with English
      await i18n.changeLanguage('en');
      let config = getHomeTutorialConfig();
      expect(config.steps[0].title).toBe('Location Selector');

      // Switch to Hindi
      await i18n.changeLanguage('hi');
      config = getHomeTutorialConfig();
      expect(config.steps[0].title).toBe('स्थान चयनकर्ता');

      // Switch to Gujarati
      await i18n.changeLanguage('gu');
      config = getHomeTutorialConfig();
      expect(config.steps[0].title).toBe('સ્થાન પસંદગીકર્તા');
    });
  });

  describe('All tutorial configs', () => {
    it('should have consistent structure across all languages', async () => {
      const languages = ['en', 'hi', 'mr', 'gu', 'ur'];
      
      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        
        const homeConfig = getHomeTutorialConfig();
        const profileConfig = getProfileTutorialConfig();
        const ratesConfig = getRatesTutorialConfig();
        const sellConfig = getSellTutorialConfig();
        const servicesConfig = getServicesTutorialConfig();

        // Check that all configs have the expected number of steps
        expect(homeConfig.steps).toHaveLength(5);
        expect(profileConfig.steps).toHaveLength(5);
        expect(ratesConfig.steps).toHaveLength(5);
        expect(sellConfig.steps).toHaveLength(6);
        expect(servicesConfig.steps).toHaveLength(4);

        // Check that all steps have required fields
        [homeConfig, profileConfig, ratesConfig, sellConfig, servicesConfig].forEach(config => {
          config.steps.forEach(step => {
            expect(step.id).toBeTruthy();
            expect(step.title).toBeTruthy();
            expect(step.description).toBeTruthy();
            expect(typeof step.title).toBe('string');
            expect(typeof step.description).toBe('string');
          });
        });
      }
    });
  });
});

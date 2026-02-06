import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .init({
    fallbackLng: 'vi',
    
    debug: import.meta.env.DEV,

    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    react: {
      useSuspense: true,
    },
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

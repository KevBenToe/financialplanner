import { useEffect, useState, type ReactNode } from 'react';

import { LanguageContext, type Language } from './language';

const storageKey = 'financial-planner:language';

const getInitialLanguage = (): Language => {
  const savedLanguage = window.localStorage.getItem(storageKey);
  if (savedLanguage === 'de' || savedLanguage === 'en') {
    return savedLanguage;
  }

  return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage }}>{children}</LanguageContext.Provider>;
};
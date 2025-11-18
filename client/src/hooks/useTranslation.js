import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

export const useTranslation = () => {
  const { language } = useLanguage();
  
  const t = (key, params = {}) => {
    let translation = translations[language]?.[key] || translations['pt'][key] || key;
    
    // Suporta interpolação de variáveis como {{count}}
    if (params && typeof translation === 'string') {
      Object.keys(params).forEach(paramKey => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), params[paramKey]);
      });
    }
    
    return translation;
  };

  return { t, language };
};


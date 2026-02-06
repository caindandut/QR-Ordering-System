import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const titleKeyMap = {
  '/': 'titles.home',
  '/order': 'titles.menu',
  '/order/cart': 'titles.cart',
  '/order/status': 'titles.status',
};

export const TitleUpdater = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const titleKey = titleKeyMap[location.pathname] || 'titles.home';
    const title = t(titleKey);
    document.title = title;
  }, [location.pathname, t, i18n.language]);

  return null;
};

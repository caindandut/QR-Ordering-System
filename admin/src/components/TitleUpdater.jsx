import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const titleKeyMap = {
  '/': 'titles.dashboard',
  '/tables': 'titles.tables',
  '/orders': 'titles.orders',
  '/menu': 'titles.menu',
  '/categories': 'titles.categories',
  '/account': 'titles.account',
  '/staff': 'titles.staff',
  '/login': 'titles.login',
};

const TitleUpdater = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const titleKey = titleKeyMap[location.pathname] || 'titles.dashboard';
    const title = t(titleKey);
    document.title = title;
  }, [location.pathname, t, i18n.language]);

  return null;
};

export default TitleUpdater;

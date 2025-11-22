import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Mapping các route với key translation tương ứng
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

export const TitleUpdater = () => {
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Lấy key translation từ map hoặc dùng key mặc định
    const titleKey = titleKeyMap[location.pathname] || 'titles.dashboard';
    const title = t(titleKey);
    document.title = title;
  }, [location.pathname, t, i18n.language]); // Thêm i18n.language để cập nhật khi đổi ngôn ngữ

  return null; // Component này không render gì
};


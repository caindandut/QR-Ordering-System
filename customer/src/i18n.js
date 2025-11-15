import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpApi from 'i18next-http-backend';

i18n
  // 1. Dùng "Xe tải" (http-backend) để tải file dịch
  .use(HttpApi)
  // 2. Dùng "Cầu nối" (react-i18next)
  .use(initReactI18next)
  .init({
    // 3. Ngôn ngữ mặc định
    fallbackLng: 'vi',
    
    // 4. Bật debug (chỉ khi dev) để xem log
    debug: import.meta.env.DEV,

    // 5. Cấu hình cho "Xe tải" (http-backend)
    backend: {
      // Đường dẫn đến file "từ điển"
      loadPath: '/locales/{{lng}}/translation.json',
    },
    
    // 6. Tắt các tính năng không cần thiết của React
    react: {
      useSuspense: true, // 👈 BẮT BUỘC: Dùng Suspense
    },
    
    // 7. (Tùy chọn) Tắt tính năng "phát hiện" ngôn ngữ
    //    (Chúng ta sẽ tự quản lý bằng Nút bấm)
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

export const translateOrderStatus = (statusKey, lang = 'vi') => {
  const translations = {
    vi: {
      PENDING: { text: 'Chờ xử lý', variant: 'secondary' },
      CONFIRMED: { text: 'Đã xác nhận', variant: 'default' },
      COOKING: { text: 'Đang nấu', variant: 'default' },
      PREPARING: { text: 'Đang nấu', variant: 'default' },
      READY: { text: 'Sẵn sàng', variant: 'success' },
      SERVED: { text: 'Đã phục vụ', variant: 'success' },
      PAID: { text: 'Đã thanh toán', variant: 'outline' },
      CANCELLED: { text: 'Đã hủy', variant: 'destructive' },
      DENIED: { text: 'Đã từ chối', variant: 'destructive' },
    },
    jp: {
      PENDING: { text: '保留中', variant: 'secondary' },
      CONFIRMED: { text: '確認済み', variant: 'default' },
      COOKING: { text: '調理中', variant: 'default' },
      PREPARING: { text: '調理中', variant: 'default' },
      READY: { text: '準備完了', variant: 'success' },
      SERVED: { text: '提供済み', variant: 'success' },
      PAID: { text: '支払い済み', variant: 'outline' },
      CANCELLED: { text: 'キャンセル', variant: 'destructive' },
      DENIED: { text: '拒否されました', variant: 'destructive' },
    },
  };

  const langTranslations = translations[lang] || translations['vi'];
  return langTranslations[statusKey] || { text: statusKey, variant: 'outline' };
};

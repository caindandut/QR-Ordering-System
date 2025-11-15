export const translateOrderStatus = (statusKey, lang = 'vi') => {
  if (lang === 'vi') {
    switch (statusKey) {
      case 'PENDING':
        return { text: 'Đang chờ xác nhận', variant: 'secondary' };
      case 'COOKING':
        return { text: 'Bếp đang chuẩn bị', variant: 'default' }; // Màu xanh/đen
      case 'SERVED':
        return { text: 'Đã phục vụ', variant: 'success' }; // (Cần định nghĩa 'success' trong Tailwind)
      case 'PAID':
        return { text: 'Đã thanh toán', variant: 'outline' };
      case 'CANCELLED':
        return { text: 'Đã hủy', variant: 'destructive' }; // Màu đỏ
      default:
        return { text: statusKey, variant: 'outline' };
    }
  }
  // ... (thêm logic tiếng Nhật sau)
};
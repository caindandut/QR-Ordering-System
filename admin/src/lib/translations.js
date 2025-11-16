

export const translateTableStatus = (statusKey, lang = 'vi') => {
  if (lang === 'vi') {
    switch (statusKey) {
      case 'AVAILABLE':
        return 'Trống';
      case 'OCCUPIED':
        return 'Đang có khách';
      case 'RESERVED':
        return 'Đã đặt trước';
      case 'HIDDEN':
        return 'Đã ẩn';
      
      default:
        return statusKey; // Trả về key gốc nếu không tìm thấy
    }
  }
  
  if (lang === 'jp') {
    switch (statusKey) {
      case 'AVAILABLE':
        return '空席'; // (Kūseki - Trống)
      case 'OCCUPIED':
        return '使用中'; // (Shiyō-chū - Đang dùng)
      case 'RESERVED':
        return '予約済み'; // (Yoyaku-zumi - Đã đặt trước)
      case 'HIDDEN':
        return '非表示'; // (Hihyōji - Đã ẩn)
      default:
        return statusKey;
    }
  }
  
  // Default fallback
  return statusKey;
};

export const translateMenuStatus = (statusKey, lang = 'vi') => {
  if (lang === 'vi') {
    switch (statusKey) {
      case 'AVAILABLE':
        return { text: 'Có sẵn', variant: 'default' };
      case 'UNAVAILABLE':
        return { text: 'Hết hàng', variant: 'destructive' };
      case 'HIDDEN':
        return { text: 'Đã ẩn', variant: 'secondary' };
      default:
        return { text: statusKey, variant: 'outline' };
    }
  }
  
  if (lang === 'jp') {
    switch (statusKey) {
      case 'AVAILABLE':
        return { text: '在庫あり', variant: 'default' }; // (Zaiko ari - Có sẵn)
      case 'UNAVAILABLE':
        return { text: '売り切れ', variant: 'destructive' }; // (Urikire - Hết hàng)
      case 'HIDDEN':
        return { text: '非表示', variant: 'secondary' }; // (Hihyōji - Đã ẩn)
      default:
        return { text: statusKey, variant: 'outline' };
    }
  }
  
  // Default fallback
  return { text: statusKey, variant: 'outline' };
};

export const translateOrderStatus = (statusKey, lang = 'vi') => {
  if (lang === 'vi') {
    switch (statusKey) {
      case 'PENDING':
        return { text: 'Chờ xác nhận', variant: 'default' };
      case 'COOKING':
        return { text: 'Đang nấu', variant: 'secondary' };
      case 'SERVED':
        return { text: 'Đã phục vụ', variant: 'default' };
      case 'PAID':
        return { text: 'Đã thanh toán', variant: 'default' };
      case 'CANCELLED':
        return { text: 'Đã hủy', variant: 'destructive' };
      default:
        return { text: statusKey, variant: 'outline' };
    }
  }
  
  if (lang === 'jp') {
    switch (statusKey) {
      case 'PENDING':
        return { text: '確認待ち', variant: 'default' }; // (Kakunin-machi - Chờ xác nhận)
      case 'COOKING':
        return { text: '調理中', variant: 'secondary' }; // (Chōri-chū - Đang nấu)
      case 'SERVED':
        return { text: '提供済み', variant: 'default' }; // (Teikyō-zumi - Đã phục vụ)
      case 'PAID':
        return { text: '支払い済み', variant: 'default' }; // (Shiharai-zumi - Đã thanh toán)
      case 'CANCELLED':
        return { text: 'キャンセル', variant: 'destructive' }; // (Kyanseru - Đã hủy)
      default:
        return { text: statusKey, variant: 'outline' };
    }
  }
  
  // Default fallback
  return { text: statusKey, variant: 'outline' };
};
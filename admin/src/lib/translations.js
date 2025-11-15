

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
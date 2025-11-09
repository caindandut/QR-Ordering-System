

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
      // ... và cứ thế
      default:
        return statusKey;
    }
  }
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
    // ... (logic tiếng Nhật)
  }
};
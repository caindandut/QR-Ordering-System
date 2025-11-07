// src/lib/utils.js (hoặc file tương tự)

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
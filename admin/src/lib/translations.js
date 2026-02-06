
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
        return statusKey;
    }
  }
  
  if (lang === 'jp') {
    switch (statusKey) {
      case 'AVAILABLE':
        return '空席';
      case 'OCCUPIED':
        return '使用中';
      case 'RESERVED':
        return '予約済み';
      case 'HIDDEN':
        return '非表示';
      default:
        return statusKey;
    }
  }
  
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
        return { text: '在庫あり', variant: 'default' };
      case 'UNAVAILABLE':
        return { text: '売り切れ', variant: 'destructive' };
      case 'HIDDEN':
        return { text: '非表示', variant: 'secondary' };
      default:
        return { text: statusKey, variant: 'outline' };
    }
  }
  
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
      case 'DENIED':
        return { text: 'Đã từ chối', variant: 'destructive' };
      default:
        return { text: statusKey, variant: 'outline' };
    }
  }
  
  if (lang === 'jp') {
    switch (statusKey) {
      case 'PENDING':
        return { text: '確認待ち', variant: 'default' };
      case 'COOKING':
        return { text: '調理中', variant: 'secondary' };
      case 'SERVED':
        return { text: '提供済み', variant: 'default' };
      case 'PAID':
        return { text: '支払い済み', variant: 'default' };
      case 'CANCELLED':
        return { text: 'キャンセル', variant: 'destructive' };
      case 'DENIED':
        return { text: '拒否されました', variant: 'destructive' };
      default:
        return { text: statusKey, variant: 'outline' };
    }
  }
  
  return { text: statusKey, variant: 'outline' };
};

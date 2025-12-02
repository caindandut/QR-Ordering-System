import { useState, useEffect } from 'react';
import { useSearchParams, Outlet } from 'react-router-dom'; 
import { useQuery } from '@tanstack/react-query';
import api from '../services/api'; 

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ModeToggle } from '@/components/ModeToggle'; 


const fetchTableDetails = async (tableId) => {
  const response = await api.get(`/api/tables/${tableId}`);
  return response.data; 
};

// Hàm kiểm tra bàn có đơn hàng đang hoạt động không
const checkTableOccupied = async (tableId) => {
  const response = await api.get(`/api/tables/${tableId}/check-occupied`);
  return response.data;
};

export default function OrderGateway() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [searchParams] = useSearchParams();
  const urlTableId = searchParams.get('table_id');

  const tableId = urlTableId || sessionStorage.getItem('table_id');
  
  const initializeSession = () => {
    const storedTableId = sessionStorage.getItem('table_id');
    const storedCustomerName = sessionStorage.getItem('customer_name');

    // 2a. Nếu KHÔNG CÓ table_id trên URL (reload trang con như /order/cart)
    if (!urlTableId) {
      // TRƯỜNG HỢP 1: Người dùng đang trong phiên hợp lệ và reload trang
      // -> Kiểm tra xem có session trong sessionStorage không
      if (storedTableId && storedCustomerName) {
        // Giữ lại phiên hiện tại
        return storedCustomerName;
      }
      // Nếu không có session -> yêu cầu đăng nhập (không nên xảy ra)
      return null;
    }

    // 2b. KIỂM TRA: ID bàn trên URL có khớp với ID bàn trong bộ nhớ không?
    if (urlTableId === storedTableId) {
      // TRƯỜNG HỢP 2: TRÙNG KHỚP (Ví dụ: quét lại QR cùng bàn)
      // -> Đây là phiên HỢP LỆ, giữ lại tên khách hàng.
      return storedCustomerName; 
    }
    
    // 2c. KHÔNG KHỚP (Ví dụ: Quét bàn mới)
    // -> Đây là phiên KHÔNG HỢP LỆ. HỦY PHIÊN CŨ.
    sessionStorage.removeItem('customer_name');
    sessionStorage.removeItem('table_name');
    localStorage.removeItem('cart-storage'); // Xóa giỏ hàng cũ (vẫn dùng localStorage cho giỏ hàng)

    // 2d. Cập nhật ID bàn mới
    sessionStorage.setItem('table_id', urlTableId);
    
    return null; // Buộc người dùng nhập tên mới
  };

  const [customerName, setCustomerName] = useState(initializeSession);
  const [tempName, setTempName] = useState('');
  
  const {
    data: tableData,
    isLoading: isLoadingTable,
    isError: isTableError,
  } = useQuery({
    queryKey: ['table', tableId], 
    queryFn: () => fetchTableDetails(tableId),
    enabled: !!tableId,
  });

  // Kiểm tra bàn có đang được sử dụng không
  const {
    data: occupiedData,
    isLoading: isLoadingOccupied,
  } = useQuery({
    queryKey: ['tableOccupied', tableId],
    queryFn: () => checkTableOccupied(tableId),
    enabled: !!tableId,
  });

  // Khôi phục session nếu đơn hàng là của khách hàng này
  useEffect(() => {
    if (!customerName && occupiedData?.isOccupied) {
      const storedCustomerName = sessionStorage.getItem('customer_name');
      
      // Kiểm tra xem đơn hàng đang occupied có phải của khách hàng này không
      const isMyOrder = storedCustomerName && occupiedData?.orders?.some(
        order => order.customerName === storedCustomerName
      );
      
      // Nếu đơn hàng là của khách hàng này, khôi phục session
      if (isMyOrder && storedCustomerName) {
        setCustomerName(storedCustomerName);
      }
    }
  }, [customerName, occupiedData]);

 useEffect(() => {
    // CHỈ "GHI" (Write) vào Bộ nhớ NẾU nó đến từ URL
    if (urlTableId) { 
      sessionStorage.setItem('table_id', urlTableId);
    }
    
    // Luôn "Sync" tên bàn khi `tableData` thay đổi
    if (tableData) {
      sessionStorage.setItem('table_name', tableData.name);
    }
  }, [urlTableId, tableData]); // 👈 Chỉ "theo dõi" 2 biến này

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName) {
      // Kiểm tra xem tên nhập vào có trùng với tên trong đơn hàng đang occupied không
      const isMyOrder = occupiedData?.isOccupied && occupiedData?.orders?.some(
        order => order.customerName === tempName
      );
      
      // Nếu bàn đang occupied và tên không trùng, chặn
      if (occupiedData?.isOccupied && !isMyOrder) {
        // Hiển thị thông báo lỗi
        toast({
          title: t('gateway.occupied.title') || 'Bàn đã được sử dụng',
          description: t('gateway.occupied.subtitle', { tableName: tableData?.name }) || 'Bàn này đã có khách hàng khác đặt món',
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
      // Nếu hợp lệ, lưu tên và tiếp tục
      sessionStorage.setItem('customer_name', tempName);
      setCustomerName(tempName);
    }
  };


  if (!tableId) {
    return <div className="p-4 text-red-500">{t('gateway.error_scan_qr')}</div>;
  }
  
  if (isLoadingTable || isLoadingOccupied) {
    return (
      <div className="flex items-center justify-center h-screen gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>{t('gateway.loading_table')}</span>
      </div>
    );
  }
  

  if (isTableError) {
    return <div className="p-4 text-red-500">{t('gateway.error_invalid_qr')}</div>;
  }

  // Kiểm tra xem bàn có đang được sử dụng bởi khách khác không
  // Logic mới: Chỉ chặn nếu bàn đang occupied VÀ đơn hàng KHÔNG phải của khách hàng này
  if (!customerName && occupiedData?.isOccupied) {
    const storedCustomerName = sessionStorage.getItem('customer_name');
    
    // Kiểm tra xem đơn hàng đang occupied có phải của khách hàng này không
    const isMyOrder = storedCustomerName && occupiedData?.orders?.some(
      order => order.customerName === storedCustomerName
    );
    
    // Nếu KHÔNG phải đơn hàng của khách hàng này, chặn
    if (!isMyOrder) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4 relative">
          {/* Nút toggle ngôn ngữ và dark mode ở góc trên bên phải */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <LanguageToggle />
            <ModeToggle />
          </div>
          
          <div className="w-full max-w-md p-8 bg-card shadow-lg rounded-lg border border-border">
            <div className="text-center space-y-4">
              <div className="text-6xl">⚠️</div>
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
                {t('gateway.occupied.title')}
              </h1>
              <p className="text-lg text-muted-foreground">
                {t('gateway.occupied.subtitle', { tableName: tableData?.name })}
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {t('gateway.occupied.hint')}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // Nếu là đơn hàng của khách hàng này, useEffect sẽ khôi phục session
    // và component sẽ re-render với customerName đã được set
  }

  if (!customerName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4 relative">
        {/* Nút toggle ngôn ngữ và dark mode ở góc trên bên phải */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageToggle />
          <ModeToggle />
        </div>
        
        <div className="w-full max-w-md p-8 bg-card shadow-lg rounded-lg border border-border">
          
          {/* Lời chào đã được cập nhật */}
          <h1 className="text-2xl font-bold text-center mb-2 text-card-foreground">
            {t('gateway.welcome')}
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-6">
            {t('gateway.table_info')} <span className="font-bold text-primary">{tableData?.name}</span>
          </p>
          {/* Form này y hệt form trong <Dialog> cũ */}
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('gateway.name_label')}</Label>
              <Input
                id="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              {t('gateway.start_ordering')}
            </Button>
          </form>
        </div>
      </div>
    );
  }
  
  return <Outlet />; 
}
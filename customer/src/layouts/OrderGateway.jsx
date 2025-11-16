import { useState, useEffect } from 'react';
import { useSearchParams, Outlet } from 'react-router-dom'; 
import { useQuery } from '@tanstack/react-query';
import api from '../services/api'; 

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next'; 


const fetchTableDetails = async (tableId) => {
  const response = await api.get(`/api/tables/${tableId}`);
  return response.data; 
};

export default function OrderGateway() {
  const { t } = useTranslation();

  const [searchParams] = useSearchParams();
  const urlTableId = searchParams.get('table_id');

  // const localTableId = localStorage.getItem('table_id');
  // const tableId = urlTableId || localTableId;
  const initializeSession = () => {
    const localTableId = localStorage.getItem('table_id');
    const localCustomerName = localStorage.getItem('customer_name');

    // 2a. KIỂM TRA: ID bàn trên URL có khớp với ID bàn trong bộ nhớ không?
    if (urlTableId && urlTableId === localTableId) {
      // TRƯỜNG HỢP 1: TRÙNG KHỚP (Ví dụ: F5, quay lại trang)
      // -> Đây là phiên HỢP LỆ, giữ lại tên khách hàng.
      return localCustomerName; 
    }
    
    // 2b. KHÔNG KHỚP (Ví dụ: Quét bàn mới, hoặc `urlTableId` là `null`)
    // -> Đây là phiên KHÔNG HỢP LỆ. HỦY PHIÊN CŨ.
    localStorage.removeItem('customer_name');
    localStorage.removeItem('table_name');
    localStorage.removeItem('cart-storage'); // Xóa cả giỏ hàng cũ

    // 2c. Nếu là 1 bàn mới, cập nhật ID bàn
    if (urlTableId) {
      localStorage.setItem('table_id', urlTableId);
    }
    
    return null; // Buộc người dùng nhập tên mới
  };

  const [customerName, setCustomerName] = useState(initializeSession);
  const [tempName, setTempName] = useState('');
  
  const {
    data: tableData,
    isLoading: isLoadingTable,
    isError: isTableError,
  } = useQuery({
    queryKey: ['table', urlTableId], 
    queryFn: () => fetchTableDetails(urlTableId),
    enabled: !!urlTableId,
  });


  useEffect(() => {
    if (tableData) {
      localStorage.setItem('table_name', tableData.name);
    }
  }, [tableData]);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName) {
      localStorage.setItem('customer_name', tempName);
      setCustomerName(tempName);
    }
  };


  if (!urlTableId) {
    return <div className="p-4 text-red-500">{t('gateway.error_scan_qr')}</div>;
  }
  
  if (isLoadingTable) {
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

  if (!customerName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
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
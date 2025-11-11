import { useState, useEffect } from 'react';
import { useSearchParams, Outlet } from 'react-router-dom'; 
import { useQuery } from '@tanstack/react-query';
import api from '../services/api'; 

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react'; 


const fetchTableDetails = async (tableId) => {
  const response = await api.get(`/api/tables/${tableId}`);
  return response.data; 
};

export default function OrderGateway() {

  const [searchParams] = useSearchParams();
  const tableId = searchParams.get('table_id');

  const [customerName, setCustomerName] = useState(
    () => localStorage.getItem('customer_name') || null
  );
  
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


  useEffect(() => {
    if (tableId) {
      localStorage.setItem('table_id', tableId);
      
      if (tableData) {
        localStorage.setItem('table_name', tableData.name);
      }
    }
  }, [tableId, tableData]); 

  // 5. Hàm Submit Form (như cũ)
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName) {
      localStorage.setItem('customer_name', tempName);
      setCustomerName(tempName);
    }
  };


  if (!tableId) {
    return <div className="p-4 text-red-500">Lỗi: Vui lòng quét lại mã QR của bàn.</div>;
  }
  
  if (isLoadingTable) {
    return (
      <div className="flex items-center justify-center h-screen gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Đang tải thông tin bàn...</span>
      </div>
    );
  }
  

  if (isTableError) {
    return <div className="p-4 text-red-500">Lỗi: Mã QR không hợp lệ. Bàn không tồn tại.</div>;
  }

  if (!customerName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
          
          {/* Lời chào đã được cập nhật */}
          <h1 className="text-2xl font-bold text-center mb-2">
            Chào mừng đến nhà hàng
          </h1>
          <p className="text-xl text-center text-gray-700 mb-6">
            Bạn đang ở <span className="font-bold text-blue-600">{tableData?.name}</span>
          </p>
          {/* Form này y hệt form trong <Dialog> cũ */}
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên của bạn</Label>
              <Input
                id="name"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Bắt đầu gọi món
            </Button>
          </form>
        </div>
      </div>
    );
  }
  
  return <Outlet />; 
}
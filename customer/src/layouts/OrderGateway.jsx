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

  const localTableId = localStorage.getItem('table_id');
  const tableId = urlTableId || localTableId;

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
    if (urlTableId) {
      localStorage.setItem('table_id', urlTableId);
      
      if (tableData) {
        localStorage.setItem('table_name', tableData.name);
      }
    }
  }, [urlTableId, tableData]); 

  // 5. Hàm Submit Form (như cũ)
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName) {
      localStorage.setItem('customer_name', tempName);
      setCustomerName(tempName);
    }
  };


  if (!tableId) {
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
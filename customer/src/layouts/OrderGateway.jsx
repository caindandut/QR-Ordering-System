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

    if (!urlTableId) {
      if (storedTableId && storedCustomerName) {
        return storedCustomerName;
      }
      return null;
    }

    if (urlTableId === storedTableId) {
      return storedCustomerName; 
    }
    
    sessionStorage.removeItem('customer_name');
    sessionStorage.removeItem('table_name');
    localStorage.removeItem('cart-storage');

    sessionStorage.setItem('table_id', urlTableId);
    
    return null;
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

  const {
    data: occupiedData,
    isLoading: isLoadingOccupied,
  } = useQuery({
    queryKey: ['tableOccupied', tableId],
    queryFn: () => checkTableOccupied(tableId),
    enabled: !!tableId,
  });

  useEffect(() => {
    if (!customerName && occupiedData?.isOccupied) {
      const storedCustomerName = sessionStorage.getItem('customer_name');
      
      const isMyOrder = storedCustomerName && occupiedData?.orders?.some(
        order => order.customerName === storedCustomerName
      );
      
      if (isMyOrder && storedCustomerName) {
        setCustomerName(storedCustomerName);
      }
    }
  }, [customerName, occupiedData]);

 useEffect(() => {
    if (urlTableId) { 
      sessionStorage.setItem('table_id', urlTableId);
    }
    
    if (tableData) {
      sessionStorage.setItem('table_name', tableData.name);
    }
  }, [urlTableId, tableData]);

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (tempName) {
      const isMyOrder = occupiedData?.isOccupied && occupiedData?.orders?.some(
        order => order.customerName === tempName
      );
      
      if (occupiedData?.isOccupied && !isMyOrder) {
        toast({
          title: t('gateway.occupied.title') || 'Bàn đã được sử dụng',
          description: t('gateway.occupied.subtitle', { tableName: tableData?.name }) || 'Bàn này đã có khách hàng khác đặt món',
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      
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

  if (!customerName && occupiedData?.isOccupied) {
    const storedCustomerName = sessionStorage.getItem('customer_name');
    
    const isMyOrder = storedCustomerName && occupiedData?.orders?.some(
      order => order.customerName === storedCustomerName
    );
    
    if (!isMyOrder) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4 relative">
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
  }

  if (!customerName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4 relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageToggle />
          <ModeToggle />
        </div>
        
        <div className="w-full max-w-md p-8 bg-card shadow-lg rounded-lg border border-border">
          
          <h1 className="text-2xl font-bold text-center mb-2 text-card-foreground">
            {t('gateway.welcome')}
          </h1>
          <p className="text-xl text-center text-muted-foreground mb-6">
            {t('gateway.table_info')} <span className="font-bold text-primary">{tableData?.name}</span>
          </p>
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

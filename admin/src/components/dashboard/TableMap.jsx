import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTables } from '@/services/dashboardService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Utensils, Users, Loader2 } from 'lucide-react';
import TableDetailsModal from './TableDetailsModal';
import { io } from 'socket.io-client';
import { useTranslation } from 'react-i18next';

export default function TableMap() {
  const [selectedTable, setSelectedTable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const { t, i18n } = useTranslation();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
  });

  useEffect(() => {
    if (data) {
      setTables(data);
    }
  }, [data]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000');

    socket.on('tableStatusChanged', () => {
      refetch();
    });

    socket.on('orderStatusChanged', () => {
      refetch();
    });

    return () => {
      socket.disconnect();
    };
  }, [refetch]);

  const handleTableClick = (table) => {
    if (table.status === 'OCCUPIED' && table.currentOrder) {
      setSelectedTable(table);
      setIsModalOpen(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 border-green-500 hover:bg-green-200 dark:bg-green-950/30 dark:border-green-600 dark:hover:bg-green-900/40';
      case 'OCCUPIED':
        return 'bg-red-100 border-red-500 hover:bg-red-200 cursor-pointer dark:bg-red-950/30 dark:border-red-600 dark:hover:bg-red-900/40';
      case 'HIDDEN':
        return 'bg-gray-100 border-gray-400 dark:bg-gray-800/50 dark:border-gray-600';
      default:
        return 'bg-gray-100 border-gray-300 dark:bg-gray-800/50 dark:border-gray-600';
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return 'default';
      case 'OCCUPIED':
        return 'destructive';
      case 'HIDDEN':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return t('dashboard.table_map.status_available');
      case 'OCCUPIED':
        return t('dashboard.table_map.status_occupied');
      case 'HIDDEN':
        return t('dashboard.table_map.status_hidden');
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.table_map.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.table_map.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-500 p-8">
            {t('dashboard.table_map.error')}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            {t('dashboard.table_map.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.table_map.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!tables || tables.length === 0 ? (
            <div className="text-center text-muted-foreground p-8">
              {t('dashboard.table_map.empty')}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`
                    border-2 rounded-lg p-4 transition-all
                    ${getStatusColor(table.status)}
                    ${table.status === 'OCCUPIED' ? 'hover:shadow-md' : ''}
                  `}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                      <Utensils className="h-8 w-8" />
                      {table.status === 'OCCUPIED' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>

                    <div className="font-semibold text-center">
                      {table.name}
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{t('dashboard.table_map.capacity', { count: table.capacity })}</span>
                    </div>

                    <Badge variant={getStatusBadgeVariant(table.status)}>
                      {getStatusLabel(table.status)}
                    </Badge>

                    {table.status === 'OCCUPIED' && table.currentOrder && (
                      <div className="w-full mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                        <div className="text-xs text-center">
                          <div className="font-medium truncate">
                            {table.currentOrder.customerName}
                          </div>
                          <div className="text-muted-foreground">
                            {table.currentOrder.totalAmount.toLocaleString('vi-VN')}đ
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <TableDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        table={selectedTable}
      />
    </>
  );
}

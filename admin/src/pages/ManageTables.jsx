import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api'; 
import { QRCode } from 'react-qrcode-logo';
import { useReactToPrint } from 'react-to-print';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, QrCode, Check, Printer, Copy, Grid3x3, List, MoreHorizontal, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { translateOrderStatus, translateTableStatus } from '@/lib/translations';
import TableForm from '../components/TableForm';
import TableCard from '../components/TableCard';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../hooks/useSocket.js';

const fetchTables = async () => {
  const response = await api.get('/api/tables');
  return response.data;
};

const fetchOrders = async () => {
  const response = await api.get('/api/admin/orders');
  return response.data;
};

const createTable = async (newTable) => {
  const response = await api.post('/api/tables', newTable);
  return response.data;
};

const updateTable = async ({ id, data }) => {
  const response = await api.patch(`/api/tables/${id}`, data);
  return response.data;
};

const deleteTable = async (id) => {
  await api.delete(`/api/tables/${id}`);
};

const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || 'http://localhost:5174';

export default function ManageTablesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableToDelete, setTableToDelete] = useState(null);
  const [qrCodeTable, setQrCodeTable] = useState(null);

  const qrCodeRef = useRef(null);

  const [isCopied, setIsCopied] = useState(false);
  
  const [viewMode, setViewMode] = useState('grid');
  
  const [selectedTable, setSelectedTable] = useState(null);
  
  const queryClient = useQueryClient();
  
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const normalizedLang = lang === 'ja' ? 'jp' : lang;
  const numberLocale = normalizedLang === 'jp' ? 'ja-JP' : 'vi-VN';
  const socket = useSocket();

  const {
    data: tables,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin_orders'],
    queryFn: fetchOrders,
  });

  const addTableMutation = useMutation({
    mutationFn: createTable,
    
    onSuccess: () => {
      toast({
        title: t('tables_page.success_add_title'),
        description: t('tables_page.success_add_desc'),
        duration: 5000
      });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsDialogOpen(false);
    },
    
    onError: (error) => {
      toast({
        title: t('tables_page.error_title'),
        description: error.response?.data?.message || t('tables_page.error_add_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: updateTable,
    onSuccess: () => {
      toast({ 
        title: t('tables_page.success_update_title'),
        description: t('tables_page.success_update_desc'),
        duration: 5000 
      });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('tables_page.error_title'),
        description: error.response?.data?.message || t('tables_page.error_update_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: deleteTable,
    onSuccess: () => {
      toast({ title: t('tables_page.success_delete_title'), description: t('tables_page.success_delete_desc'), duration: 5000 });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setTableToDelete(null);
    },
    onError: (error) => {
      toast({
        title: t('tables_page.error_title'),
        description: error.response?.data?.message || t('tables_page.error_delete_desc'),
        variant: "destructive",
        duration: 5000,
      });
      setTableToDelete(null);
    },
  });

  const handleOpenAddDialog = () => {
    setEditingTable(null);
    setIsDialogOpen(true);
  };
  
  const handleOpenEditDialog = (table) => {
    setEditingTable(table);
    setIsDialogOpen(true);
  };
  
  const handleFormSubmit = (data) => {
    if (editingTable) {
      updateTableMutation.mutate({ id: editingTable.id, data });
    } else {
      addTableMutation.mutate(data);
    }
  };

  const handleDeleteConfirm = () => {
    if (tableToDelete) {
      deleteTableMutation.mutate(tableToDelete.id);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: qrCodeRef,
    documentTitle: `QR-Ban-${qrCodeTable?.name || 'qr-code'}`,
    onAfterPrint: () => toast({ title: t('tables_page.print_success'), duration: 5000 }),
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = () => {
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
    };

    const handleUpdateOrder = () => {
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
    };

    socket.on('new_order_received', handleNewOrder);
    socket.on('order_updated_for_admin', handleUpdateOrder);

    return () => {
      socket.off('new_order_received', handleNewOrder);
      socket.off('order_updated_for_admin', handleUpdateOrder);
    };
  }, [socket, queryClient]);

  const getOrdersByTable = (tableId) => {
    return orders.filter(order => order.tableId === tableId);
  };

  const handleTableCardClick = (table) => {
    setSelectedTable(table);
  };

  const isTableOccupied = (tableId) => {
    const activeOrders = orders.filter(order => 
      order.tableId === tableId && ['PENDING', 'COOKING', 'SERVED'].includes(order.status)
    );
    return activeOrders.length > 0;
  };

  const getActualTableStatus = (table) => {
    if (table.status === 'HIDDEN') {
      return {
        label: translateTableStatus('HIDDEN', normalizedLang),
        variant: 'secondary',
        className: ''
      };
    }
    
    if (isTableOccupied(table.id)) {
      return {
        label: translateTableStatus('OCCUPIED', normalizedLang),
        variant: 'destructive',
        className: ''
      };
    }
    
    return {
      label: translateTableStatus('AVAILABLE', normalizedLang),
      variant: 'default',
      className: 'bg-green-600 hover:bg-green-700'
    };
  };

  const handleChangeTableStatus = (table, newStatus) => {
    if (isTableOccupied(table.id)) {
      toast({
        title: t('tables_page.status_change_blocked_title'),
        description: t('tables_page.status_change_blocked_desc', { table: table.name }),
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    updateTableMutation.mutate({ 
      id: table.id, 
      data: { status: newStatus } 
    });
  };

  const getTableStats = () => {
    if (!tables || !orders) return { total: 0, available: 0, occupied: 0, hidden: 0 };
    
    const activeOrders = orders.filter(order => 
      ['PENDING', 'COOKING', 'SERVED'].includes(order.status)
    );
    const occupiedTableIds = new Set(activeOrders.map(order => order.tableId));
    
    return {
      total: tables.length,
      available: tables.filter(t => t.status !== 'HIDDEN' && !occupiedTableIds.has(t.id)).length,
      occupied: tables.filter(t => occupiedTableIds.has(t.id)).length,
      hidden: tables.filter(t => t.status === 'HIDDEN').length,
    };
  };

  const stats = getTableStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (isError) {
    return <div>{t('tables_page.error', { message: error.message })}</div>;
  }

  const qrUrl = qrCodeTable 
    ? `${CUSTOMER_APP_URL}/order?table_id=${qrCodeTable.id}`
    : '';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">{t('tables_page.title')}</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center border border-border rounded-lg p-1 bg-background">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Button onClick={handleOpenAddDialog} className="flex-1 sm:flex-initial">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('tables_page.add_new')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardHeader className="pb-1.5 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('tables_page.stats.total')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('tables_page.stats.available')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-green-600">{stats.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('tables_page.stats.occupied')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-red-600">{stats.occupied}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1.5 p-3">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('tables_page.stats.hidden')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="text-lg sm:text-xl font-bold text-gray-600">{stats.hidden}</div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? t('tables_page.edit_title') : t('tables_page.add_title')}
            </DialogTitle>

            <DialogDescription>
              {t('tables_page.form_desc')}
            </DialogDescription>

          </DialogHeader>
          <TableForm
            onSubmit={handleFormSubmit}
            isLoading={addTableMutation.isLoading || updateTableMutation.isLoading}
            initialData={editingTable}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!tableToDelete}
        onOpenChange={(open) => !open && setTableToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('tables_page.delete_desc_1')}
              <strong className="mx-1">
                {tableToDelete?.name}
              </strong>. 
              {t('tables_page.delete_desc_2')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={deleteTableMutation.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTableMutation.isLoading ? t('common.deleting') : t('common.confirm_delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!qrCodeTable}
        onOpenChange={(open) => {
          if (!open) {
            setQrCodeTable(null);
            setIsCopied(false);
          }
        }}
      >
        <DialogContent className="max-w-xs p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-center">
              {t('tables_page.qr_title', { name: qrCodeTable?.name })}
            </DialogTitle>

            <DialogDescription className="text-center">
              {t('tables_page.qr_desc')}
            </DialogDescription>
            
          </DialogHeader>
          <div 
           ref={qrCodeRef} className="flex flex-col items-center justify-center p-6 pt-0">
            <h3 className="hidden print:block print:text-black text-2xl font-bold mb-4">
              {qrCodeTable?.name}
            </h3>
             <p className="hidden print:block print:text-black text-sm mb-4">
              {t('tables_page.qr_scan_text')}
            </p>
            <QRCode
              value={qrUrl}
              size={250}
              logoImage="/logo.svg"
              logoWidth={60}
              logoHeight={60}
            />
          </div>
          <div className="p-6 pt-0 flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full"
              disabled={isCopied}
              onClick={async () => {
                if (!qrUrl) return;
                try {
                  await navigator.clipboard.writeText(qrUrl);
                  
                  setIsCopied(true);
                  
                  setTimeout(() => setIsCopied(false), 2000);
                  
                } catch {
                }
              }}
            >
              {isCopied ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              {isCopied ? t('tables_page.copied') : t('tables_page.copy_url')}
            </Button>

            <Button
              onClick={handlePrint}
              className="w-full"
            >
              <Printer className="mr-2 h-4 w-4" />
              {t('tables_page.print_qr')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTable} onOpenChange={(open) => !open && setSelectedTable(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTable ? t('tables_page.details.title', { name: selectedTable.name }) : ''}
            </DialogTitle>
            <DialogDescription>
              {t('tables_page.details.description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {selectedTable && (() => {
              const tableOrders = getOrdersByTable(selectedTable.id);
              const activeOrders = tableOrders.filter(order => 
                ['PENDING', 'COOKING', 'SERVED'].includes(order.status)
              );
              
              if (activeOrders.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>{t('tables_page.details.empty')}</p>
                  </div>
                );
              }
              
              return activeOrders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">
                        {t('tables_page.details.order_label', { id: order.id })}
                      </CardTitle>
                      {(() => {
                        const translatedStatus = translateOrderStatus(order.status, normalizedLang);
                        return (
                          <Badge variant={translatedStatus.variant}>
                            {translatedStatus.text}
                          </Badge>
                        );
                      })()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('tables_page.details.customer')}
                        </span>
                        <span className="font-medium">{order.customerName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('tables_page.details.items')}
                        </span>
                        <span className="font-medium">
                          {t('tables_page.details.items_count', { count: order.details?.length || 0 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('tables_page.details.total')}
                        </span>
                        <span className="font-bold text-lg">
                          {order.totalAmount?.toLocaleString(numberLocale)}đ
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('tables_page.details.time')}
                        </span>
                        <span>{new Date(order.createdAt).toLocaleString(numberLocale)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              orders={getOrdersByTable(table.id)}
              onClick={handleTableCardClick}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-x-auto">
          <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t('tables_page.columns.id')}</TableHead>
              <TableHead>{t('tables_page.table_name')}</TableHead>
              <TableHead>{t('tables_page.capacity')}</TableHead>
              <TableHead>{t('common.status')}</TableHead>
              <TableHead className="text-right">{t('common.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tables.map((table) => (
              <TableRow key={table.id}>
                <TableCell>{table.id}</TableCell>
                <TableCell className="font-medium">{table.name}</TableCell>
                <TableCell>{table.capacity}</TableCell>
                <TableCell>
                  {(() => {
                    const status = getActualTableStatus(table);
                    return (
                      <Badge variant={status.variant} className={status.className}>
                        {status.label}
                      </Badge>
                    );
                  })()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => setQrCodeTable(table)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('tables_page.dropdown.actions')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => handleOpenEditDialog(table)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t('tables_page.dropdown.edit')}
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>{t('tables_page.dropdown.status')}</DropdownMenuLabel>

                        {table.status === 'HIDDEN' && (
                          <DropdownMenuItem 
                            onClick={() => handleChangeTableStatus(table, 'AVAILABLE')}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            {t('tables_page.dropdown.show')}
                          </DropdownMenuItem>
                        )}

                        {table.status !== 'HIDDEN' && (
                          <DropdownMenuItem 
                            onClick={() => handleChangeTableStatus(table, 'HIDDEN')}
                          >
                            <EyeOff className="mr-2 h-4 w-4" />
                            {t('tables_page.dropdown.hide')}
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem 
                          onClick={() => setTableToDelete(table)}
                          className="text-red-500 focus:text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('tables_page.dropdown.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
    </div>
  );
}

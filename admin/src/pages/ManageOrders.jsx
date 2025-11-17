import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useSocket } from '../hooks/useSocket.js';
import { useNotification } from '../context/NotificationContext';
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Import components
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { translateOrderStatus } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { Loader2, MoreHorizontal, ChevronDown, Printer, Eye, Clock, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// --- CÁC HÀM GỌI API ---
const fetchAdminOrders = async () => {
  const response = await api.get('/api/admin/orders');
  return response.data;
};

const fetchTables = async () => {
  const response = await api.get('/api/tables');
  return response.data;
};

const fetchMenuItems = async () => {
  const response = await api.get('/api/menu/all');
  return response.data;
};

const createOrder = async (orderData) => {
  const response = await api.post('/api/admin/orders/create', orderData);
  return response.data;
};

const updateOrderStatus = async ({ orderId, status }) => {
  const response = await api.patch(`/api/admin/orders/${orderId}/status`, { status });
  return response.data;
};

// --- COMPONENT CHÍNH ---
export default function ManageOrdersPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const socket = useSocket();
  const { toast } = useToast();
  const { clearNotifications } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightOrderId = searchParams.get('highlightOrder');
  
  // State cho filters  
  const [statusFilter, setStatusFilter] = useState(highlightOrderId ? "SERVED" : "PENDING");
  const [tableFilter, setTableFilter] = useState("ALL");
  const [highlightedOrder, setHighlightedOrder] = useState(null);
  
  // State cho tạo đơn thủ công
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // [{item_id, quantity}]
  
  // --- LOGIC ĐỌC (READ) ---
  const { data: allOrders, isLoading, isError } = useQuery({
    queryKey: ['admin_orders'],
    queryFn: fetchAdminOrders,
  });

  // Fetch danh sách bàn
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
  });

  // Fetch danh sách món ăn
  const { data: menuItems = [] } = useQuery({
    queryKey: ['menu_items'],
    queryFn: fetchMenuItems,
  });

  // Clear notifications khi vào trang này
  useEffect(() => {
    clearNotifications();
  }, []); // Chỉ chạy một lần khi component mount

  // Highlight order khi có highlightOrderId từ URL
  useEffect(() => {
    if (highlightOrderId && allOrders) {
      const order = allOrders.find(o => o.id === parseInt(highlightOrderId));
      if (order) {
        // Set filter to show the order
        setStatusFilter(order.status);
        setHighlightedOrder(parseInt(highlightOrderId));
        
        // Scroll to order after a short delay
        setTimeout(() => {
          const element = document.getElementById(`order-${highlightOrderId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
        
        // Clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedOrder(null);
          setSearchParams({});
        }, 5000);
      }
    }
  }, [highlightOrderId, allOrders, setSearchParams]);

  // --- LOGIC "NGHE" (SOCKET.IO) ---
  useEffect(() => {
    if (!socket) return; 

    const handleNewOrder = (newOrder) => {
      if (!newOrder || !newOrder.id) {
        console.error('Đơn hàng không hợp lệ:', newOrder);
        return;
      }
      
      // Cập nhật cache ngay lập tức với đơn hàng mới
      queryClient.setQueryData(['admin_orders'], (oldOrders) => {
        if (!oldOrders) return [newOrder];
        // Kiểm tra xem đơn đã tồn tại chưa (tránh duplicate)
        const exists = oldOrders.some(order => order.id === newOrder.id);
        if (exists) {
          // Nếu đã tồn tại, cập nhật
          return oldOrders.map(order => 
            order.id === newOrder.id ? newOrder : order
          );
        }
        // Nếu chưa tồn tại, thêm vào đầu danh sách
        return [newOrder, ...oldOrders];
      });
      
      // Hiển thị toast notification
      toast({
        title: "Có đơn hàng mới!",
        description: `Bàn ${newOrder.table?.name || 'N/A'} - ${newOrder.customerName || 'N/A'}`,
        duration: 5000,
      });
    };
    
    const handleUpdateOrder = (updatedOrder) => {
      if (!updatedOrder || !updatedOrder.id) {
        console.error('Đơn hàng cập nhật không hợp lệ:', updatedOrder);
        return;
      }
      
      // Cập nhật cache với đơn hàng đã được cập nhật
      queryClient.setQueryData(['admin_orders'], (oldOrders) => {
        if (!oldOrders) return oldOrders;
        return oldOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        );
      });
    };
    
    // Đăng ký listeners
    socket.on('new_order_received', handleNewOrder);
    socket.on('order_updated_for_admin', handleUpdateOrder);

    return () => {
      socket.off('new_order_received', handleNewOrder);
      socket.off('order_updated_for_admin', handleUpdateOrder);
    };
  }, [socket, queryClient, toast]);

  // --- LOGIC TẠO ĐƠN HÀNG THỦ CÔNG ---
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      toast({
        title: "Thành công!",
        description: "Đã tạo đơn hàng thành công.",
      });
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      setIsCreateOrderOpen(false);
      // Reset form
      setSelectedTableId('');
      setCustomerName('');
      setSelectedItems([]);
    },
    onError: (err) => {
      toast({
        title: "Lỗi!",
        description: err.response?.data?.message || "Không thể tạo đơn hàng.",
        variant: "destructive",
      });
    },
  });

  // --- LOGIC "CÔNG NHÂN" (UPDATE) ---
  const updateStatusMutation = useMutation({
    mutationFn: updateOrderStatus,
    // Optimistic update: Cập nhật UI ngay lập tức trước khi server phản hồi
    onMutate: async ({ orderId, status }) => {
      // Hủy các query đang chạy để tránh ghi đè optimistic update
      await queryClient.cancelQueries({ queryKey: ['admin_orders'] });
      
      // Lưu snapshot của data hiện tại để rollback nếu lỗi
      const previousOrders = queryClient.getQueryData(['admin_orders']);
      
      // Lấy thông tin đơn hàng để hiển thị trong toast
      const currentOrder = previousOrders?.find(order => order.id === orderId);
      
      // Optimistic update: Cập nhật status ngay lập tức
      queryClient.setQueryData(['admin_orders'], (old) => {
        if (!old) return old;
        return old.map(order => 
          order.id === orderId 
            ? { ...order, status, updatedAt: new Date().toISOString() }
            : order
        );
      });
      
      return { previousOrders, currentOrder };
    },
    onSuccess: (data, variables, context) => {
      // Invalidate queries để đảm bảo data đồng bộ với server
      queryClient.invalidateQueries({ queryKey: ['admin_orders'] });
      
      // Hiển thị toast notification dựa trên trạng thái mới
      const order = context?.currentOrder;
      const customerInfo = order?.customerName || 'N/A';
      const tableInfo = order?.table?.name || 'N/A';
      
      let toastTitle = '';
      let toastDescription = '';
      
      switch (variables.status) {
        case 'COOKING':
          toastTitle = '✅ Đã xác nhận đơn hàng';
          toastDescription = `Đơn hàng của khách hàng ${customerInfo} - ${tableInfo} đã được xác nhận và đang được chế biến.`;
          break;
        case 'SERVED':
          toastTitle = '🍽️ Đã phục vụ';
          toastDescription = `Đơn hàng của khách hàng ${customerInfo} - ${tableInfo} đã được phục vụ.`;
          break;
        case 'PAID':
          toastTitle = '💰 Đã thanh toán';
          toastDescription = `Đơn hàng của khách hàng ${customerInfo} - ${tableInfo} đã được thanh toán thành công.`;
          break;
        case 'CANCELLED':
          toastTitle = '❌ Đã hủy đơn hàng';
          toastDescription = `Đơn hàng của khách hàng ${customerInfo} - ${tableInfo} đã được hủy.`;
          break;
        default:
          toastTitle = 'Cập nhật trạng thái';
          toastDescription = `Đơn hàng của khách hàng ${customerInfo} - ${tableInfo} đã được cập nhật.`;
      }
      
      toast({
        title: toastTitle,
        description: toastDescription,
        duration: 5000,
      });
    },
    onError: (err, variables, context) => {
      // Rollback nếu có lỗi
      if (context?.previousOrders) {
        queryClient.setQueryData(['admin_orders'], context.previousOrders);
      }
      toast({
        title: "Lỗi!",
        description: err.response?.data?.message || "Không thể cập nhật trạng thái.",
        variant: "destructive",
      });
    },
  });

  // --- LOGIC "LỌC" & "NHÓM" ---
  const { filteredAndGroupedOrders, tableList, orderCounts } = useMemo(() => {
    if (!allOrders) return { filteredAndGroupedOrders: {}, tableList: [], orderCounts: {} };
    
    // Lọc theo status
    let filtered = allOrders.filter(order => order.status === statusFilter);
    
    // Lọc theo bàn nếu có
    if (tableFilter !== "ALL") {
      filtered = filtered.filter(order => order.table?.name === tableFilter);
    }
    
    // Sắp xếp theo thời gian tạo (mới nhất trước)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Nhóm theo Bàn
    const grouped = filtered.reduce((acc, order) => {
      const tableName = order.table?.name || 'Bàn không xác định';
      if (!acc[tableName]) {
        acc[tableName] = [];
      }
      acc[tableName].push(order);
      return acc;
    }, {});
    
    // Lấy danh sách bàn và đếm số đơn
    const tables = [...new Set(allOrders.map(o => o.table?.name).filter(Boolean))];
    const counts = tables.reduce((acc, tableName) => {
      acc[tableName] = allOrders.filter(o => 
        o.table?.name === tableName && o.status === statusFilter
      ).length;
      return acc;
    }, {});
    
    return {
      filteredAndGroupedOrders: grouped, 
      tableList: tables.sort(),
      orderCounts: counts
    };
  }, [allOrders, statusFilter, tableFilter]);

  // --- HÀM XỬ LÝ TẠO ĐƠN HÀNG ---
  const handleAddItem = (itemId) => {
    const existingItem = selectedItems.find(item => item.item_id === itemId);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.item_id === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, { item_id: itemId, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.item_id !== itemId));
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setSelectedItems(selectedItems.map(item =>
      item.item_id === itemId
        ? { ...item, quantity: parseInt(quantity) }
        : item
    ));
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (!selectedTableId || !customerName || selectedItems.length === 0) {
      toast({
        title: "Lỗi!",
        description: "Vui lòng điền đầy đủ thông tin: bàn, tên khách hàng và chọn ít nhất 1 món.",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({
      table_id: selectedTableId,
      customer_name: customerName,
      items: selectedItems,
    });
  };

  // Tính tổng tiền
  const totalAmount = useMemo(() => {
    return selectedItems.reduce((total, selectedItem) => {
      const menuItem = menuItems.find(item => item.id === selectedItem.item_id);
      if (menuItem) {
        return total + (menuItem.price * selectedItem.quantity);
      }
      return total;
    }, 0);
  }, [selectedItems, menuItems]);
  
  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (isError) return <div className="p-4 text-red-500">Lỗi: Không thể tải đơn hàng.</div>;

  // --- RENDER ---
  return (
    <div className="p-4 md:p-8">
      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Quản lý Đơn hàng</h1>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Nút tạo đơn thủ công */}
          <Dialog 
            open={isCreateOrderOpen} 
            onOpenChange={(open) => {
              setIsCreateOrderOpen(open);
              if (!open) {
                // Reset form khi đóng
                setSelectedTableId('');
                setCustomerName('');
                setSelectedItems([]);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tạo đơn thủ công
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo đơn hàng thủ công</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitOrder} className="space-y-4 mt-4">
                {/* Chọn bàn */}
                <div className="space-y-2">
                  <Label htmlFor="table">Bàn *</Label>
                  <Select value={selectedTableId} onValueChange={setSelectedTableId} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn bàn" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.filter(table => table.status !== 'HIDDEN').map(table => (
                        <SelectItem key={table.id} value={table.id.toString()}>
                          {table.name} (Sức chứa: {table.capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tên khách hàng */}
                <div className="space-y-2">
                  <Label htmlFor="customerName">Tên khách hàng *</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nhập tên khách hàng"
                    required
                  />
                </div>

                {/* Chọn món ăn */}
                <div className="space-y-2">
                  <Label>Chọn món ăn *</Label>
                  <div className="border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                    {menuItems.filter(item => item.status === 'AVAILABLE').length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Không có món ăn nào khả dụng.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {menuItems
                          .filter(item => item.status === 'AVAILABLE')
                          .map(item => {
                            const selectedItem = selectedItems.find(si => si.item_id === item.id);
                            const quantity = selectedItem?.quantity || 0;
                            return (
                              <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                                <div className="flex items-center gap-3 flex-1">
                                  <Avatar className="h-10 w-10 rounded-md">
                                    <AvatarImage src={item.imageUrl} alt={item.name} />
                                    <AvatarFallback>{item.name[0]}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.price.toLocaleString('vi-VN')}đ
                                    </p>
                                  </div>
                                </div>
                                {quantity > 0 ? (
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateQuantity(item.id, quantity - 1)}
                                    >
                                      -
                                    </Button>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={quantity}
                                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                                      className="w-16 text-center"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateQuantity(item.id, quantity + 1)}
                                    >
                                      +
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddItem(item.id)}
                                  >
                                    Thêm
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tổng tiền */}
                {selectedItems.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Tổng tiền:</span>
                      <span className="text-2xl font-bold text-primary">
                        {totalAmount.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                )}

                {/* Nút submit */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOrderOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={createOrderMutation.isLoading || selectedItems.length === 0}
                  >
                    {createOrderMutation.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo đơn hàng'
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Bàn:</span>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tất cả</SelectItem>
                {tableList.map(tableName => (
                  <SelectItem key={tableName} value={tableName}>
                    {tableName} ({orderCounts[tableName] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Trạng thái:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Chờ xác nhận</SelectItem>
                <SelectItem value="COOKING">Đang nấu</SelectItem>
                <SelectItem value="SERVED">Đã phục vụ</SelectItem>
                <SelectItem value="PAID">Đã thanh toán</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* BẢNG ĐƠN HÀNG */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Bàn</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Tạo lúc/Cập nhật</TableHead>
              <TableHead>Người xử lý</TableHead>
              <TableHead>Số món</TableHead>
              <TableHead>Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.keys(filteredAndGroupedOrders).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  Không có đơn hàng nào.
                </TableCell>
              </TableRow>
            ) : (
              Object.keys(filteredAndGroupedOrders).map(tableName => {
                const orders = filteredAndGroupedOrders[tableName];
                return (
                  <React.Fragment key={tableName}>
                    {/* GROUP HEADER - Hiển thị tên bàn và số đơn */}
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={9} className="font-semibold py-2">
                        <div className="flex items-center gap-2">
                          <span>📋 {tableName}</span>
                          <Badge variant="secondary" className="ml-2">
                            {orders.length} đơn
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* CÁC ĐƠN HÀNG TRONG BÀN */}
                    {orders.map(order => (
                      <OrderRow 
                        key={order.id} 
                        order={order} 
                        onStatusChange={(newStatus) => updateStatusMutation.mutate({ orderId: order.id, status: newStatus })}
                        isLoading={updateStatusMutation.isLoading}
                        i18n={i18n}
                        isHighlighted={highlightedOrder === order.id}
                      />
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// --- COMPONENT CON: HÀNG ĐƠN HÀNG ---
const OrderRow = ({ order, onStatusChange, isLoading, i18n, isHighlighted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [isSendingBill, setIsSendingBill] = useState(false);
  const printRef = useRef(null);
  const { toast } = useToast();

  // Logic In - mở dialog preview
  const handlePrint = () => {
    setShowPrintDialog(true);
  };

  const reactToPrintFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Hoa-don-${order.id}`,
    onAfterPrint: () => {
      toast({
        title: "✅ In hóa đơn thành công",
        description: `Đã in hóa đơn cho đơn #${order.id}`,
        duration: 3000,
      });
      setShowPrintDialog(false);
    },
  });

  // Gửi hóa đơn cho khách hàng
  const handleSendBillToCustomer = async () => {
    setIsSendingBill(true);
    try {
      await api.post(`/api/admin/orders/${order.id}/send-bill`);
      toast({
        title: "✅ Đã gửi hóa đơn",
        description: `Hóa đơn đã được gửi đến khách hàng tại ${order.table?.name}`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "❌ Lỗi",
        description: error.response?.data?.message || "Không thể gửi hóa đơn",
        variant: "destructive",
      });
    } finally {
      setIsSendingBill(false);
    }
  };


  // Hàm lấy màu badge
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'default';
      case 'COOKING': return 'secondary';
      case 'SERVED': return 'default';
      case 'PAID': return 'default';
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Hàm lấy 2 chữ cái đầu
  const getInitials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'MÓN';

  // Lấy translation cho status
  let currentLang = i18n.language || 'vi';
  if (currentLang === 'ja') currentLang = 'jp';
  const statusTranslation = translateOrderStatus(order.status, currentLang);

  return (
    <Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
      <>
        {/* HÀNG CHÍNH: THÔNG TIN ĐƠN HÀNG */}
        <TableRow 
          id={`order-${order.id}`}
          className={cn(
            "cursor-pointer hover:bg-muted/50 transition-all",
            isHighlighted && "bg-yellow-100 dark:bg-yellow-900/30 animate-pulse"
          )}
        >
          <TableCell>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          </TableCell>
          <TableCell className="font-medium">{order.table?.name || 'N/A'}</TableCell>
          <TableCell>{order.customerName}</TableCell>
          <TableCell>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Tạo:</span>
                <span className="text-sm">{format(new Date(order.createdAt), 'HH:mm dd/MM/yyyy')}</span>
              </div>
              {order.updatedAt && new Date(order.updatedAt).getTime() !== new Date(order.createdAt).getTime() && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-xs text-muted-foreground">Cập nhật:</span>
                  <span className="text-sm font-medium text-primary">
                    {format(new Date(order.updatedAt), 'HH:mm dd/MM/yyyy')}
                  </span>
                </div>
              )}
            </div>
          </TableCell>
          <TableCell>
            {order.staff ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={order.staff.avatarUrl} alt={order.staff.name} />
                  <AvatarFallback className="text-xs">
                    {order.staff.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{order.staff.name}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Chưa có</span>
            )}
          </TableCell>
          <TableCell>
            <Badge variant="outline">{order.details?.length || 0} món</Badge>
          </TableCell>
          <TableCell className="font-bold text-lg">
            {order.totalAmount?.toLocaleString('vi-VN')}đ
          </TableCell>
          <TableCell>
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {statusTranslation.text}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              {/* Nút xem chi tiết */}
              <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Chi tiết đơn hàng #{order.id}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Bàn</p>
                        <p className="font-medium">{order.table?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Khách hàng</p>
                        <p className="font-medium">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tạo lúc</p>
                        <p className="font-medium">{format(new Date(order.createdAt), 'HH:mm dd/MM/yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cập nhật lúc</p>
                        <p className="font-medium">
                          {order.updatedAt && new Date(order.updatedAt).getTime() !== new Date(order.createdAt).getTime() 
                            ? format(new Date(order.updatedAt), 'HH:mm dd/MM/yyyy')
                            : 'Chưa cập nhật'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Người xử lý</p>
                        {order.staff ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={order.staff.avatarUrl} alt={order.staff.name} />
                              <AvatarFallback className="text-xs">
                                {order.staff.name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <p className="font-medium">{order.staff.name}</p>
                          </div>
                        ) : (
                          <p className="font-medium text-muted-foreground">Chưa có</p>
                        )}
                      </div>
        <div>
                        <p className="text-sm text-muted-foreground">Trạng thái</p>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {statusTranslation.text}
                        </Badge>
                      </div>
        </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold mb-2">Danh sách món:</p>
                      <div className="space-y-2">
                        {order.details?.map((detail, index) => (
                          <div key={detail.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                            <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
            <Avatar className="h-10 w-10 rounded-md">
              <AvatarImage src={detail.menuItem?.imageUrl} alt={detail.menuItem?.name} />
                              <AvatarFallback>{getInitials(detail.menuItem?.name)}</AvatarFallback>
            </Avatar>
                            <div className="flex-grow">
                              <span className="font-semibold">{detail.menuItem?.name}</span>
                              <p className="text-sm text-muted-foreground">
                                {detail.priceAtOrder?.toLocaleString('vi-VN')}đ x {detail.quantity}
                              </p>
                            </div>
                            <span className="font-medium">
                              {(detail.priceAtOrder * detail.quantity).toLocaleString('vi-VN')}đ
                            </span>
          </div>
        ))}
                      </div>
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center">
                      <span className="text-lg font-bold">Tổng tiền:</span>
                      <span className="text-2xl font-bold text-primary">
                        {order.totalAmount?.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Dropdown menu hành động */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {order.status === 'PENDING' && (
                    <>
                      <DropdownMenuItem onClick={() => onStatusChange('COOKING')}>
                        Xác nhận
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onStatusChange('CANCELLED')} 
                        className="text-red-500"
                      >
                        Hủy đơn
                      </DropdownMenuItem>
                    </>
                  )}
                  {order.status === 'COOKING' && (
                    <DropdownMenuItem onClick={() => onStatusChange('SERVED')}>
                      Đã phục vụ
                    </DropdownMenuItem>
                  )}
                  {order.status === 'SERVED' && (
                    <>
                      <DropdownMenuItem onClick={handlePrint}>
                        In hóa đơn
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleSendBillToCustomer} disabled={isSendingBill}>
                        {isSendingBill ? (
                          'Đang gửi...'
                        ) : (
                          'Gửi hóa đơn cho khách'
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onStatusChange('PAID')}>
                        Thanh toán xong
                      </DropdownMenuItem>
                    </>
                  )}
                  {order.status === 'PAID' && (
                    <DropdownMenuItem onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      In hóa đơn
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>

        {/* Dialog để in hóa đơn */}
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto print:overflow-visible">
            <DialogHeader className="print:hidden">
              <DialogTitle className="text-center text-xl font-bold">Xem trước hóa đơn</DialogTitle>
            </DialogHeader>
            
            {/* Preview hóa đơn với border đẹp */}
            <div className="flex justify-center my-4 print:my-0">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 print:border-none print:p-0">
                <div ref={printRef}>
                  <BillReceipt order={order} />
                </div>
              </div>
            </div>
            
            {/* Nút hành động */}
            <div className="flex gap-3 justify-center pt-4 border-t print:hidden">
              <Button onClick={reactToPrintFn} size="lg" className="flex-1 max-w-xs">
                <Printer className="mr-2 h-5 w-5" />
                In hóa đơn
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPrintDialog(false)}
                size="lg"
                className="flex-1 max-w-xs"
              >
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* HÀNG CON: CHI TIẾT MÓN (Collapsible) */}
        <CollapsibleContent asChild>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableCell colSpan={9} className="p-0">
              <div className="p-4 space-y-2">
        
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {order.details?.map((detail, index) => (
                    <div key={detail.id} className="flex items-center gap-3 p-3 rounded-md bg-background border">
                      <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                      <Avatar className="h-12 w-12 rounded-md">
                        <AvatarImage src={detail.menuItem?.imageUrl} alt={detail.menuItem?.name} />
                        <AvatarFallback>{getInitials(detail.menuItem?.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-grow">
                        <span className="font-semibold">{detail.menuItem?.name}</span>
                        <p className="text-sm text-muted-foreground">
                          {detail.priceAtOrder?.toLocaleString('vi-VN')}đ x {detail.quantity}
                        </p>
                      </div>
                      <span className="font-medium">
                        {(detail.priceAtOrder * detail.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TableCell>
          </TableRow>
        </CollapsibleContent>
      </>
    </Collapsible>
  );
};

// --- COMPONENT HÓA ĐƠN ĐỂ IN ---
const BillReceipt = ({ order }) => {
  return (
    <div style={{ padding: '30px', fontFamily: 'monospace', maxWidth: '80mm', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', margin: '0' }}>HÓA ĐƠN</h1>
        <h2 style={{ fontSize: '20px', margin: '5px 0' }}>NHÀ HÀNG</h2>
        <p style={{ margin: '5px 0' }}>Địa chỉ: 123 Đường ABC, TP.HCM</p>
        <p style={{ margin: '5px 0' }}>SĐT: 0123-456-789</p>
        <hr style={{ border: '1px dashed #000' }} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <p style={{ margin: '5px 0' }}><strong>Hóa đơn #:</strong> {order.id}</p>
        <p style={{ margin: '5px 0' }}><strong>Bàn:</strong> {order.table?.name || 'N/A'}</p>
        <p style={{ margin: '5px 0' }}><strong>Khách hàng:</strong> {order.customerName}</p>
        <p style={{ margin: '5px 0' }}><strong>Thời gian:</strong> {format(new Date(order.createdAt), 'HH:mm dd/MM/yyyy')}</p>
        {order.staff && (
          <p style={{ margin: '5px 0' }}><strong>Nhân viên:</strong> {order.staff.name}</p>
        )}
        <hr style={{ border: '1px dashed #000' }} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ textAlign: 'left', padding: '5px' }}>Món</th>
              <th style={{ textAlign: 'center', padding: '5px' }}>SL</th>
              <th style={{ textAlign: 'right', padding: '5px' }}>Giá</th>
              <th style={{ textAlign: 'right', padding: '5px' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {order.details?.map((detail) => (
              <tr key={detail.id} style={{ borderBottom: '1px dotted #ccc' }}>
                <td style={{ padding: '8px 5px' }}>{detail.menuItem?.name}</td>
                <td style={{ textAlign: 'center', padding: '8px 5px' }}>{detail.quantity}</td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>
                  {detail.priceAtOrder?.toLocaleString('vi-VN')}đ
                </td>
                <td style={{ textAlign: 'right', padding: '8px 5px' }}>
                  {(detail.priceAtOrder * detail.quantity).toLocaleString('vi-VN')}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr style={{ border: '1px dashed #000' }} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold' }}>
          <span>TỔNG CỘNG:</span>
          <span>{order.totalAmount?.toLocaleString('vi-VN')}đ</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        <p style={{ margin: '5px 0' }}>Cảm ơn quý khách!</p>
        <p style={{ margin: '5px 0' }}>Hẹn gặp lại!</p>
      </div>
    </div>
  );
};

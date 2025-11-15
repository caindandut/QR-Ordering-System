import { useMemo } from 'react'; 
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useCartStore } from '../store/cartStore';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import CartButton from '../components/CartButton'; 


const fetchMenu = async () => {
  const response = await api.get('/api/menu'); 
  return response.data;
};

export default function MenuPage() {
  const { toast } = useToast();

  // --- LOGIC LẤY DỮ LIỆU (READ) ---
  const { 
    data: menuItems, // Mảng "phẳng"
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['menu'],
    queryFn: fetchMenu,
  });

  // --- 🧠 4. LOGIC BIẾN ĐỔI DỮ LIỆU (useMemo + reduce) ---
  const groupedMenu = useMemo(() => {
    if (!menuItems) return {}; // Trả về object rỗng nếu chưa có data

    // Dùng `reduce` để "biến hình" mảng
    // (acc = accumulator, "cái thùng chứa")
    return menuItems.reduce((acc, item) => {
      // Lấy tên danh mục (ví dụ: "Khai vị")
      const category = item.category?.name || 'Chưa phân loại';
      
      // Nếu "cái thùng" chưa có "ngăn kéo" cho "Khai vị"
      if (!acc[category]) {
        acc[category] = []; // 👈 Tạo 1 "ngăn kéo" (mảng) rỗng
      }
      
      // Bỏ món ăn (item) vào đúng "ngăn kéo"
      acc[category].push(item);
      
      return acc; // Trả "cái thùng" về cho vòng lặp tiếp theo
    }, {}); // 👈 Bắt đầu với một "cái thùng" rỗng {}
  
  }, [menuItems]); // 👈 Chỉ "sắp xếp" lại khi `menuItems` thay đổi

  // Tác dụng: Dùng `useMemo` để tìm tên của danh mục đầu tiên
  // (ví dụ: "Khai vị") để làm `defaultValue` (giá trị mặc định) cho <Tabs>
  const firstCategory = useMemo(() => {
    return Object.keys(groupedMenu)[0];
  }, [groupedMenu]);

  // --- 5. LOGIC KẾT NỐI GIỎ HÀNG (Zustand) ---
  const addItemToCart = useCartStore((state) => state.addItem);

  const handleAddItem = (item) => {
    addItemToCart(item);
    toast({
      title: "Đã thêm vào giỏ!",
      description: `Đã thêm ${item.name} vào giỏ hàng của bạn.`,
    });
  };

  // --- RENDER (HIỂN THỊ) ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Đang tải thực đơn...</span>
      </div>
    );
  }
  if (isError) return <div className="p-4 text-red-500">Lỗi: Không thể tải thực đơn.</div>;

  return (
    <div className="p-4 md:p-8 pb-24">
      <h1 className="text-4xl font-bold mb-8">Menu</h1>
    
      {/* 👇 [MỚI] 4. BỌC MỌI THỨ TRONG <Tabs> */}
      {/* `defaultValue` nói với <Tabs> rằng:
        "Khi mới tải, hãy tự động chọn tab 'Khai vị'"
      */}
      <Tabs defaultValue={firstCategory} className="w-full">
        
        {/* 5. DANH SÁCH CÁC NÚT BẤM (TABS) */}
        {/* `TabsList` là "thanh" chứa các nút */}
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 h-auto mb-6">
          {/* Lặp qua các tên danh mục (ví dụ: "Khai vị", "Món chính") */}
          {Object.keys(groupedMenu).map((categoryName) => (
            // `TabsTrigger` là 1 "nút"
            <TabsTrigger 
              key={categoryName} 
              value={categoryName} // 👈 Giá trị (value) phải KHỚP
              className="py-3 text-base"
            >
              {categoryName}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {/* 6. NỘI DUNG CỦA TỪNG TAB */}
        {/* Lặp qua các tên danh mục một lần nữa */}
        {Object.keys(groupedMenu).map((categoryName) => (
          
          // `TabsContent` là "nội dung"
          <TabsContent 
            key={categoryName} 
            value={categoryName} // 👈 Giá trị (value) phải KHỚP
          >
            {/*
              Bên trong, chúng ta đặt LƯỚI (grid) các món ăn
              (Logic này y hệt code cũ của bạn)
            */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedMenu[categoryName].map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-48 object-cover rounded-md"
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-lg font-bold">
                      {item.price.toLocaleString('vi-VN')}đ
                    </span>
                    <Button onClick={() => handleAddItem(item)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
        ))}
      </Tabs>
    </div>
  );
}
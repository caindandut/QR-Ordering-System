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
    <div className="p-4 md:p-8 pb-24"> {/* Thêm padding-bottom để không bị "Giỏ hàng mini" che */}
      {/* 6. HIỂN THỊ CÁC NHÓM MÓN ĂN */}
      {/* Object.keys(groupedMenu) sẽ là: ["Khai vị", "Món chính", "Đồ uống"]
        Chúng ta lặp qua các "chìa khóa" (key) này
      */}
      <h1 className="text-4xl font-bold mb-8">Thực Đơn</h1>
      {Object.keys(groupedMenu).map((categoryName) => (
        <section key={categoryName} className="mb-8">
          
          {/* Tên Danh mục (Khai vị, Món chính...) */}
          <h2 className="text-3xl font-bold mb-4">{categoryName}</h2>
          
          {/* Lưới (Grid) các món ăn */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Lặp qua các món ăn BÊN TRONG nhóm đó */}
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
                    className="w-full h-80 object-cover rounded-md"
                  />
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <span className="text-lg font-bold">
                    {item.price.toLocaleString('vi-VN')}đ
                  </span>
                  
                  {/* 7. KẾT NỐI NÚT "THÊM" */}
                  <Button onClick={() => handleAddItem(item)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm
                  </Button>
                </CardFooter>
              </Card>

            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
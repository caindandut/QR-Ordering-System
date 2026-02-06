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
import { useTranslation } from 'react-i18next'; 


const fetchMenu = async () => {
  const response = await api.get('/api/menu'); 
  return response.data;
};

export default function MenuPage() {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const { 
    data: menuItems,
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['menu'],
    queryFn: fetchMenu,
  });

  const groupedMenu = useMemo(() => {
    if (!menuItems) return {};

    return menuItems.reduce((acc, item) => {
      const category = lang === 'jp' 
        ? (item.category?.name_jp || item.category?.name || 'その他')
        : (item.category?.name || 'Chưa phân loại');
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push(item);
      
      return acc;
    }, {});
  
  }, [menuItems, lang]);

  const firstCategory = useMemo(() => {
    return Object.keys(groupedMenu)[0];
  }, [groupedMenu]);

  const addItemToCart = useCartStore((state) => state.addItem);

  const handleAddItem = (item) => {
    addItemToCart(item);
    const itemName = lang === 'jp' ? item.name_jp : item.name;
    toast({
      title: t('menu_page.added_to_cart_title'),
      description: t('menu_page.added_to_cart_desc', { name: itemName }),
      duration: 5000,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen gap-2 text-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>{t('menu_page.loading')}</span>
      </div>
    );
  }
  if (isError) return <div className="p-4 text-red-500">{t('menu_page.error')}</div>;

  return (
    <div className="p-4 md:p-8 pb-24 bg-background min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-foreground">{t('menu_page.title')}</h1>
    
      <Tabs key={lang} defaultValue={firstCategory} className="w-full">
        
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 h-auto mb-6">
          {Object.keys(groupedMenu).map((categoryName) => (
            <TabsTrigger 
              key={categoryName} 
              value={categoryName}
              className="py-3 text-base"
            >
              {categoryName}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {Object.keys(groupedMenu).map((categoryName) => (
          
          <TabsContent 
            key={categoryName} 
            value={categoryName}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedMenu[categoryName].map((item) => (
                <Card key={item.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>
                      {lang === 'jp' ? item.name_jp : item.name}
                    </CardTitle>
                    <CardDescription>
                      {lang === 'jp' ? (item.description_jp || item.description) : item.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-70 object-cover rounded-md"
                    />
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-lg font-bold text-card-foreground">
                      {item.price.toLocaleString('vi-VN')}đ
                    </span>
                    <Button onClick={() => handleAddItem(item)}>
                      <Plus className="mr-2 h-4 w-4" />
                      {t('menu_page.add_to_cart')}
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

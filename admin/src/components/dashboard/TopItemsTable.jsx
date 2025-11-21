import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTopItems } from '@/services/dashboardService';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';

export default function TopItemsTable() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('today');

  const { data: topItems, isLoading, isError } = useQuery({
    queryKey: ['topItems', period],
    queryFn: () => fetchTopItems(period, 10),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Món bán chạy nhất
            </CardTitle>
            <CardDescription>
              Xem thống kê món ăn có doanh số cao nhất
            </CardDescription>
          </div>
          
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="today">Hôm nay</TabsTrigger>
              <TabsTrigger value="week">Tuần này</TabsTrigger>
              <TabsTrigger value="month">Tháng này</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center text-red-500 p-8">
            Lỗi: Không thể tải dữ liệu món bán chạy
          </div>
        ) : !topItems || topItems.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            <p>Chưa có dữ liệu cho khoảng thời gian này</p>
            <p className="text-sm mt-2">
              Hãy đợi khi có đơn hàng được thanh toán
            </p>
          </div>
        ) : (
          <div className="rounded-md border dark:border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">STT</TableHead>
                  <TableHead>Món ăn</TableHead>
                  <TableHead className="text-right">Số lượng bán</TableHead>
                  <TableHead className="text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topItems.map((item, index) => (
                  <TableRow key={item.menuItemId}>
                    <TableCell className="font-medium">
                      {index === 0 && (
                        <Badge variant="default" className="mr-1">🏆</Badge>
                      )}
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage src={item.imageUrl} alt={item.name} />
                          <AvatarFallback className="rounded-md">
                            {item.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {item.quantitySold}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {item.revenue.toLocaleString('vi-VN')}đ
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

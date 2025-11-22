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
  const [period, setPeriod] = useState('today');

  const { t, i18n } = useTranslation();
  
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
              {t('dashboard.top_items.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.top_items.description')}
            </CardDescription>
          </div>
          
          <Tabs value={period} onValueChange={setPeriod}>
            <TabsList>
              <TabsTrigger value="today">{t('dashboard.top_items.today')}</TabsTrigger>
              <TabsTrigger value="week">{t('dashboard.top_items.week')}</TabsTrigger>
              <TabsTrigger value="month">{t('dashboard.top_items.month')}</TabsTrigger>
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
            {t('dashboard.top_items.error')}
          </div>
        ) : !topItems || topItems.length === 0 ? (
          <div className="text-center text-muted-foreground p-8">
            <p>{t('dashboard.top_items.no_data')}</p>
            <p className="text-sm mt-2">
              {t('dashboard.top_items.no_data_desc')}
            </p>
          </div>
        ) : (
          <div className="rounded-md border dark:border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">{t('dashboard.top_items.table_stt')}</TableHead>
                  <TableHead>{t('dashboard.top_items.table_item')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.top_items.table_quantity')}</TableHead>
                  <TableHead className="text-right">{t('dashboard.top_items.table_revenue')}</TableHead>
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
                          <AvatarImage src={item.imageUrl} alt={i18n.language === 'jp' ? (item.name_jp || item.name) : item.name} />
                          <AvatarFallback className="rounded-md">
                            {(i18n.language === 'jp' ? (item.name_jp || item.name) : item.name)[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{i18n.language === 'jp' ? (item.name_jp || item.name) : item.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {i18n.language === 'jp' ? (item.category_jp || item.category) : item.category}
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

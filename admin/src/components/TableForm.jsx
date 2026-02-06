import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from 'react-i18next';

export default function TableForm({ onSubmit, isLoading, initialData = {} }) {
  const { t } = useTranslation();
  
  const [name, setName] = useState(initialData?.name || '');
  const [capacity, setCapacity] = useState(initialData?.capacity || 0);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCapacity(initialData.capacity || 0);
    } else {
      setName('');
      setCapacity(0);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      name,
      capacity: parseInt(capacity, 10),
    };
    
    if (!initialData || !initialData.id) {
      data.status = 'AVAILABLE';
    }
    
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('tables_page.table_name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="capacity">{t('tables_page.capacity')}</Label>
        <Input
          id="capacity"
          type="number"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />
      </div>
      
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  );
}

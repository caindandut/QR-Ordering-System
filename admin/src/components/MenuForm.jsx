import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const fetchCategories = async () => {
  const response = await api.get('/api/categories');
  return response.data;
};

const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default function MenuForm({ onSubmit, isLoading, initialData = null }) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [name, setName] = useState('');
  const [nameJp, setNameJp] = useState('');
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState('');
  const [descriptionJp, setDescriptionJp] = useState('');
  const [status, setStatus] = useState('AVAILABLE');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setNameJp(initialData.name_jp || '');
      setPrice(initialData.price || 0);
      setDescription(initialData.description || '');
      setDescriptionJp(initialData.description_jp || '');
      setStatus(initialData.status || 'AVAILABLE');
      setCategoryId(initialData.categoryId || '');
      setImageUrl(initialData.imageUrl || '');
    } else {
      setName('');
      setNameJp('');
      setPrice(0);
      setDescription('');
      setDescriptionJp('');
      setStatus('AVAILABLE');
      setCategoryId('');
      setImageUrl('');
    }
  }, [initialData]);

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const uploadImageMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      setImageUrl(data.imageUrl);
      toast({ title: t('menu_page.upload_success_title'), description: t('menu_page.upload_success_desc'), duration: 5000 });
    },
    onError: () => {
      toast({
        title: t('menu_page.upload_error_title'),
        description: t('menu_page.upload_error_desc'),
        variant: "destructive",
        duration: 5000,
      });
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    onSubmit({
      name,
      name_jp: nameJp,
      price: parseInt(price, 10),
      description,
      description_jp: descriptionJp,
      status,
      categoryId: parseInt(categoryId, 10),
      imageUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      
      <div className="space-y-2">
        <Label htmlFor="image">{t('common.image')}</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploadImageMutation.isLoading}
        />
        {uploadImageMutation.isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{t('menu_page.uploading')}</span>
          </div>
        ) : (
          imageUrl && (
            <div className="mt-2">
              <img
                src={imageUrl}
                alt={t('menu_page.preview')}
                className="w-32 h-32 object-cover rounded-md"
              />
            </div>
          )
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t('common.name_vi')}</Label>
        <Input
          id="name" value={name} onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="nameJp">{t('common.name_jp')}</Label>
        <Input
          id="nameJp" value={nameJp} onChange={(e) => setNameJp(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">{t('common.price')} (VNĐ)</Label>
        <Input
          id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">{t('common.category')}</Label>
        <Select
          value={categoryId ? String(categoryId) : ''}
          onValueChange={setCategoryId}
          disabled={isLoadingCategories}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoadingCategories ? t('menu_page.loading_categories') : t('menu_page.select_category')} />
          </SelectTrigger>
          <SelectContent>
            {categories && categories.map((category) => (
              <SelectItem key={category.id} value={String(category.id)}>
                {lang === 'jp' ? (category.name_jp || category.name) : category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="status">{t('common.status')}</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder={t('menu_page.select_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AVAILABLE">{t('menu_page.status_available')}</SelectItem>
            <SelectItem value="UNAVAILABLE">{t('menu_page.status_unavailable')}</SelectItem>
            <SelectItem value="HIDDEN">{t('menu_page.status_hidden')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('menu_page.description_vi')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('menu_page.description_placeholder')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descriptionJp">{t('menu_page.description_jp')}</Label>
        <Textarea
          id="descriptionJp"
          value={descriptionJp}
          onChange={(e) => setDescriptionJp(e.target.value)}
          placeholder={t('menu_page.description_placeholder_jp')}
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || uploadImageMutation.isLoading}
        className="w-full"
      >
        {isLoading ? t('common.saving') : (uploadImageMutation.isLoading ? t('menu_page.processing_image') : t('menu_page.save_dish'))}
      </Button>
    </form>
  );
}

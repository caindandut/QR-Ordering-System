import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from 'lucide-react'; 

export function LanguageToggle() {
  // 1. Lấy "bộ não" i18n
  const { i18n } = useTranslation();

  // 2. Hàm "ra lệnh"
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang); 
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Đổi ngôn ngữ</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {/* 3. Các nút gọi lệnh */}
        <DropdownMenuItem onClick={() => changeLanguage('vi')}>
          Tiếng Việt 
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('jp')}>
          日本語
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { useState } from "react";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { UserAvatar } from "./UserAvatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-2 md:gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger data-testid="button-sidebar-toggle" />
      
      {/* Desktop Search - visible on md and above */}
      <div className="hidden md:flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Поиск по системе..."
            className="pl-9"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Mobile Search Button - visible only on small screens */}
      <div className="flex md:hidden flex-1 items-center">
        <Button
          variant="ghost"
          size="icon"
          className="hover-elevate active-elevate-2"
          onClick={() => setSearchOpen(true)}
          data-testid="button-mobile-search"
        >
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile Search Sheet */}
      <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
        <SheetContent side="top" className="w-full">
          <SheetHeader>
            <SheetTitle>Поиск</SheetTitle>
            <SheetDescription>
              Поиск по всей системе
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Поиск по системе..."
                className="pl-9"
                data-testid="input-search-mobile"
                autoFocus
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-1 md:gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative hover-elevate active-elevate-2"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                variant="destructive"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Уведомления</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Новый заказ клиента</p>
                <p className="text-xs text-muted-foreground">ООО "Интерьер Плюс" #1234</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Просрочен этап замера</p>
                <p className="text-xs text-muted-foreground">Проект #567</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Низкий остаток на складе</p>
                <p className="text-xs text-muted-foreground">МДФ 18мм - осталось 15 листов</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="gap-2 hover-elevate active-elevate-2"
              data-testid="button-user-menu"
            >
              <UserAvatar name="Иван Петров" size="sm" />
              <span className="hidden md:inline text-sm">Иван Петров</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Мой аккаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Профиль</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">Настройки</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">Выйти</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

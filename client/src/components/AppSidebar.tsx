import { 
  LayoutDashboard,
  ShoppingCart,
  FolderKanban,
  Factory,
  Package,
  DollarSign,
  Hammer,
  Mail,
  CheckSquare,
  FileText,
  Bot,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { UserAvatar } from "./UserAvatar";

const modules = [
  { title: "Дашборд", url: "/", icon: LayoutDashboard },
  { title: "Продажи", url: "/sales", icon: ShoppingCart },
  { title: "Проекты", url: "/projects", icon: FolderKanban },
  { title: "Производство", url: "/production", icon: Factory },
  { title: "Склад", url: "/warehouse", icon: Package },
  { title: "Финансы", url: "/finance", icon: DollarSign },
  { title: "Монтаж", url: "/installation", icon: Hammer },
];

const tools = [
  { title: "Почта", url: "/mail", icon: Mail },
  { title: "Задачи", url: "/tasks", icon: CheckSquare },
  { title: "Документы", url: "/documents", icon: FileText },
  { title: "ИИ Агенты", url: "/ai-agents", icon: Bot },
];

const settings = [
  { title: "Настройки", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  activeModule?: string;
}

export function AppSidebar({ activeModule = "/" }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
            E
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-semibold text-sidebar-foreground">Emerald ERP</h2>
            <p className="text-xs text-muted-foreground">Фабрика мебели</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Модули</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeModule === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Инструменты</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeModule === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {settings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={activeModule === item.url}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <UserAvatar name="Иван Петров" size="sm" />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Иван Петров</p>
            <p className="text-xs text-muted-foreground truncate">Директор</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

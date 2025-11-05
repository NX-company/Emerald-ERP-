import {
  LayoutDashboard,
  ShoppingCart,
  FolderKanban,
  Factory,
  Package,
  Truck,
  DollarSign,
  Hammer,
  Mail,
  CheckSquare,
  FileText,
  Bot,
  Settings,
  FileStack,
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
  { title: "Отгрузки", url: "/shipments", icon: Truck },
  { title: "Финансы", url: "/finance", icon: DollarSign },
  { title: "Монтаж", url: "/installation", icon: Hammer },
];

const tools = [
  { title: "Почта", url: "/mail", icon: Mail },
  { title: "Задачи", url: "/tasks", icon: CheckSquare },
  { title: "Мои задачи", url: "/my-tasks", icon: CheckSquare },
  { title: "Документы", url: "/documents", icon: FileText },
  { title: "ИИ Агенты", url: "/ai-agents", icon: Bot },
];

const settings = [
  { title: "Шаблоны процессов", url: "/process-templates", icon: FileStack },
  { title: "Настройки", url: "/settings", icon: Settings },
];

interface AppSidebarProps {
  activeModule?: string;
}

export function AppSidebar({ activeModule = "/" }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-lg">
            E
          </div>
          <div className="group-data-[collapsible=icon]:hidden overflow-hidden">
            <h2 className="font-semibold text-sidebar-foreground truncate">Emerald ERP</h2>
            <p className="text-xs text-muted-foreground truncate">Фабрика мебели</p>
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
                    tooltip={item.title}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
                    tooltip={item.title}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
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
                    tooltip={item.title}
                    data-testid={`link-${item.title.toLowerCase()}`}
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <UserAvatar name="Иван Петров" size="sm" />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden overflow-hidden">
            <p className="text-sm font-medium text-sidebar-foreground truncate">Иван Петров</p>
            <p className="text-xs text-muted-foreground truncate">Директор</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

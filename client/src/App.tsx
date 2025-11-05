import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import Dashboard from "@/pages/Dashboard";
import Sales from "@/pages/Sales";
import Projects from "@/pages/Projects";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import Production from "@/pages/Production";
import Warehouse from "@/pages/Warehouse";
import Shipments from "@/pages/Shipments";
import ShipmentScanner from "@/pages/ShipmentScanner";
import ShipmentDetail from "@/pages/ShipmentDetail";
import Finance from "@/pages/Finance";
import Installation from "@/pages/Installation";
import Mail from "@/pages/Mail";
import Tasks from "@/pages/Tasks";
import MyTasks from "@/pages/MyTasks";
import Documents from "@/pages/Documents";
import AIAgents from "@/pages/AIAgents";
import Settings from "@/pages/Settings";
import ProcessTemplates from "@/pages/ProcessTemplates";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { useEffect, useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sales" component={Sales} />
      <Route path="/projects/:id" component={ProjectDetailPage} />
      <Route path="/projects" component={Projects} />
      <Route path="/production" component={Production} />
      <Route path="/warehouse" component={Warehouse} />
      <Route path="/shipments/new" component={ShipmentScanner} />
      <Route path="/shipments/:id" component={ShipmentDetail} />
      <Route path="/shipments" component={Shipments} />
      <Route path="/finance" component={Finance} />
      <Route path="/installation" component={Installation} />
      <Route path="/mail" component={Mail} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/my-tasks" component={MyTasks} />
      <Route path="/documents" component={Documents} />
      <Route path="/ai-agents" component={AIAgents} />
      <Route path="/process-templates" component={ProcessTemplates} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const [userRole, setUserRole] = useState<any>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role) {
      setUserRole(JSON.parse(role));
    }
  }, []);

  // Скрываем sidebar для роли замерщика
  const showSidebar = userRole?.name !== 'Замерщик';

  return (
    <div className="flex h-screen w-full">
      {showSidebar && <AppSidebar activeModule={location} />}
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          <Router />
        </main>
      </div>
    </div>
  );
}

function App() {
  const [location, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    const user = localStorage.getItem("user");

    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      // Если не на странице логина, перенаправляем на неё
      if (location !== "/login") {
        setLocation("/login");
      }
    }

    setIsLoading(false);
  }, [location, setLocation]);

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  // Показываем загрузку пока проверяем аутентификацию
  if (isLoading) {
    return null;
  }

  // Если не авторизован и на странице логина, показываем только логин
  if (!isAuthenticated && location === "/login") {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Login />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Если не авторизован и не на странице логина, перенаправляем
  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Redirect to="/login" />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Если авторизован, показываем основное приложение
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider defaultOpen={true} style={style as React.CSSProperties}>
          <AppContent />
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

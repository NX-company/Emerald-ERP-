import { Switch, Route, useLocation } from "wouter";
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
import Production from "@/pages/Production";
import Warehouse from "@/pages/Warehouse";
import Finance from "@/pages/Finance";
import Installation from "@/pages/Installation";
import Mail from "@/pages/Mail";
import Tasks from "@/pages/Tasks";
import Documents from "@/pages/Documents";
import AIAgents from "@/pages/AIAgents";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/sales" component={Sales} />
      <Route path="/projects" component={Projects} />
      <Route path="/production" component={Production} />
      <Route path="/warehouse" component={Warehouse} />
      <Route path="/finance" component={Finance} />
      <Route path="/installation" component={Installation} />
      <Route path="/mail" component={Mail} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/documents" component={Documents} />
      <Route path="/ai-agents" component={AIAgents} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full">
      <AppSidebar activeModule={location} />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 overflow-auto p-6 bg-background">
          <Router />
        </main>
      </div>
    </div>
  );
}

function App() {
  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

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

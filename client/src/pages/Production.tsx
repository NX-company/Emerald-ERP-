import { useQuery } from "@tanstack/react-query";
import { ProductionCard } from "@/components/ProductionCard";
import { Button } from "@/components/ui/button";
import { Plus, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { ProductionTask, ProductionStage, User } from "@shared/schema";

type ProductionTaskWithStages = ProductionTask & { stages: ProductionStage[] };

export default function Production() {
  const { toast } = useToast();

  const { data: productionTasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<ProductionTaskWithStages[]>({
    queryKey: ["/api/production"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (tasksError) {
    toast({
      title: "Ошибка загрузки",
      description: "Не удалось загрузить производственные задания",
      variant: "destructive",
    });
  }

  const isLoading = tasksLoading || usersLoading;

  const getUserName = (userId: string | null) => {
    if (!userId) return "Не назначен";
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.username || "Не назначен";
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Не установлен";
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const transformedTasks = productionTasks.map(task => ({
    id: task.id,
    itemName: task.item_name,
    stages: task.stages.map(stage => ({
      name: stage.name,
      status: stage.status,
    })),
    progress: task.progress || 0,
    worker: getUserName(task.worker_id),
    payment: parseFloat(task.payment || "0"),
    deadline: formatDate(task.deadline),
    qrCode: !!task.qr_code,
    status: task.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Производство</h1>
          <p className="text-sm text-muted-foreground mt-1">Сменные задания и контроль этапов</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-scan-qr">
            <QrCode className="h-4 w-4 mr-2" />
            Сканировать QR
          </Button>
          <Button data-testid="button-create-task">
            <Plus className="h-4 w-4 mr-2" />
            Новое задание
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Все задания ({transformedTasks.length})</TabsTrigger>
          <TabsTrigger value="in_progress">
            В работе ({transformedTasks.filter((t) => t.status === "in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершено ({transformedTasks.filter((t) => t.status === "completed").length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64" data-testid={`skeleton-production-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformedTasks.map((task) => (
                <ProductionCard key={task.id} {...task} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="in_progress" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-64" data-testid={`skeleton-production-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformedTasks
                .filter((t) => t.status === "in_progress")
                .map((task) => (
                  <ProductionCard key={task.id} {...task} />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1].map((i) => (
                <Skeleton key={i} className="h-64" data-testid={`skeleton-production-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformedTasks
                .filter((t) => t.status === "completed")
                .map((task) => (
                  <ProductionCard key={task.id} {...task} />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

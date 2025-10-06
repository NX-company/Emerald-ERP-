import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Task, User } from "@shared/schema";

export default function Tasks() {
  const { toast } = useToast();

  const { data: tasks = [], isLoading: tasksLoading, error } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (error) {
    toast({
      title: "Ошибка загрузки",
      description: "Не удалось загрузить задачи",
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

  const transformedTasks = tasks.map(task => ({
    id: task.id,
    title: task.title,
    assignee: getUserName(task.assignee_id),
    priority: task.priority,
    deadline: formatDate(task.deadline),
    attachments: task.attachments_count || 0,
    comments: task.comments_count || 0,
    completed: task.status === "completed",
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Задачи</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Управление задачами и подзадачами</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="icon"
            className="md:hidden"
            data-testid="button-create-task"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            className="hidden md:flex"
            data-testid="button-create-task-desktop"
          >
            <Plus className="h-4 w-4 mr-2" />
            Новая задача
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="active">
            Активные ({transformedTasks.filter((t) => !t.completed).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершенные ({transformedTasks.filter((t) => t.completed).length})
          </TabsTrigger>
          <TabsTrigger value="all">Все ({transformedTasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-48" data-testid={`skeleton-task-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformedTasks
                .filter((t) => !t.completed)
                .map((task) => (
                  <TaskCard key={task.id} {...task} />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1].map((i) => (
                <Skeleton key={i} className="h-48" data-testid={`skeleton-task-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformedTasks
                .filter((t) => t.completed)
                .map((task) => (
                  <TaskCard key={task.id} {...task} />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-48" data-testid={`skeleton-task-${i}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {transformedTasks.map((task) => (
                <TaskCard key={task.id} {...task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

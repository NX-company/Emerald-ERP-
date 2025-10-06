import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Tasks() {
  // todo: remove mock functionality
  const tasks = [
    {
      id: "101",
      title: "Согласовать чертежи с клиентом",
      assignee: "Петр Козлов",
      priority: "high" as const,
      deadline: "10.11.2025",
      attachments: 3,
      comments: 5,
      completed: false,
    },
    {
      id: "102",
      title: "Заказать фурнитуру у поставщика",
      assignee: "Ольга Смирнова",
      priority: "medium" as const,
      deadline: "12.11.2025",
      attachments: 1,
      comments: 2,
      completed: false,
    },
    {
      id: "103",
      title: "Подготовить смету по проекту #567",
      assignee: "Иван Морозов",
      priority: "critical" as const,
      deadline: "08.11.2025",
      comments: 8,
      completed: true,
    },
    {
      id: "104",
      title: "Проверить остатки на складе МДФ",
      assignee: "Анна Волкова",
      priority: "medium" as const,
      deadline: "14.11.2025",
      attachments: 2,
      comments: 1,
      completed: false,
    },
    {
      id: "105",
      title: "Организовать монтаж на объекте",
      assignee: "Сергей Морозов",
      priority: "high" as const,
      deadline: "09.11.2025",
      attachments: 5,
      comments: 12,
      completed: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Задачи</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление задачами и подзадачами</p>
        </div>
        <Button data-testid="button-create-task">
          <Plus className="h-4 w-4 mr-2" />
          Новая задача
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Активные ({tasks.filter((t) => !t.completed).length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершенные ({tasks.filter((t) => t.completed).length})
          </TabsTrigger>
          <TabsTrigger value="all">Все ({tasks.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks
              .filter((t) => !t.completed)
              .map((task) => (
                <TaskCard key={task.id} {...task} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks
              .filter((t) => t.completed)
              .map((task) => (
                <TaskCard key={task.id} {...task} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} {...task} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

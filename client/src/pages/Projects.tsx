import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Projects() {
  // todo: remove mock functionality
  const projects = [
    {
      id: "567",
      name: "Кухонный гарнитур Модерн",
      client: "ООО Интерьер Плюс",
      progress: 65,
      status: "in_progress" as const,
      deadline: "25.11.2025",
      manager: "Петр Козлов",
      stages: [
        { name: "Замер", status: "completed" as const },
        { name: "ТЗ", status: "completed" as const },
        { name: "КД", status: "in_progress" as const },
        { name: "Согласование", status: "pending" as const },
        { name: "Закупка", status: "pending" as const },
      ],
    },
    {
      id: "568",
      name: "Шкаф-купе 3м",
      client: "ИП Иванова Е.А.",
      progress: 30,
      status: "pending" as const,
      deadline: "30.11.2025",
      manager: "Анна Волкова",
      stages: [
        { name: "Замер", status: "completed" as const },
        { name: "ТЗ", status: "in_progress" as const },
        { name: "КД", status: "pending" as const },
        { name: "Закупка", status: "pending" as const },
      ],
    },
    {
      id: "569",
      name: "Гостиная набор Люкс",
      client: "ООО Дизайн Студия",
      progress: 85,
      status: "in_progress" as const,
      deadline: "20.11.2025",
      manager: "Петр Козлов",
      stages: [
        { name: "Замер", status: "completed" as const },
        { name: "ТЗ", status: "completed" as const },
        { name: "КД", status: "completed" as const },
        { name: "Согласование", status: "completed" as const },
        { name: "Закупка", status: "in_progress" as const },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Проекты</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление этапами разработки</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-view-gantt">
            <Calendar className="h-4 w-4 mr-2" />
            Диаграмма Ганта
          </Button>
          <Button data-testid="button-create-project">
            <Plus className="h-4 w-4 mr-2" />
            Новый проект
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Все проекты ({projects.length})</TabsTrigger>
          <TabsTrigger value="in_progress">В работе ({projects.filter(p => p.status === "in_progress").length})</TabsTrigger>
          <TabsTrigger value="pending">Ожидают ({projects.filter(p => p.status === "pending").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} {...project} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="in_progress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects
              .filter((p) => p.status === "in_progress")
              .map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects
              .filter((p) => p.status === "pending")
              .map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

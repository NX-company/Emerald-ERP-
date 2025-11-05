import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, Calendar } from "lucide-react";
import { ProjectDetailCard } from "@/components/ProjectDetailCard";
import { ProjectCreateDialog } from "@/components/ProjectCreateDialog";
import { GanttChart } from "@/components/GanttChart";
import { MeasurerTasksList } from "@/components/MeasurerTasksList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Project, ProjectStage, User } from "@shared/schema";

type ProjectWithStages = Project & { stages: ProjectStage[] };

export default function Projects() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showGantt, setShowGantt] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Получаем данные пользователя для фильтрации проектов
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("userRole");
    if (storedUser) setUser(JSON.parse(storedUser));
    if (storedRole) setUserRole(JSON.parse(storedRole));
  }, []);

  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery<ProjectWithStages[]>({
    queryKey: ["/api/projects", user?.id, userRole?.name],
    queryFn: async () => {
      // Формируем URL с параметрами
      const params = new URLSearchParams();
      if (user?.id) params.append('userId', user.id);
      if (userRole?.name) params.append('userRole', userRole.name);

      const url = `/api/projects${params.toString() ? '?' + params.toString() : ''}`;
      return await apiRequest('GET', url);
    },
    enabled: !!user && !!userRole, // Загружаем только когда есть данные пользователя
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  useEffect(() => {
    if (projectsError) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить проекты",
        variant: "destructive",
      });
    }
  }, [projectsError, toast]);

  // Для замерщика показываем упрощенный интерфейс задач
  if (userRole?.name === 'Замерщик') {
    return <MeasurerTasksList />;
  }

  const isLoading = projectsLoading || usersLoading;

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

  const handleProjectClick = (projectId: string) => {
    setLocation(`/projects/${projectId}`);
  };

  const transformedProjects = projects.map(project => ({
    id: project.id,
    name: project.name,
    client: project.client_name,
    progress: project.progress || 0,
    status: project.status,
    durationDays: project.duration_days || 0,
    manager: getUserName(project.manager_id),
    started_at: project.started_at,
    stages: project.stages.map(stage => ({
      name: stage.name,
      status: stage.status,
    })),
  }));

  // Скрываем кнопку создания проекта для роли замерщика
  const canCreateProject = userRole?.name !== 'Замерщик';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Проекты</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Управление этапами разработки</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setShowGantt(!showGantt)}
            data-testid="button-view-gantt"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden md:flex"
            onClick={() => setShowGantt(!showGantt)}
            data-testid="button-view-gantt-desktop"
          >
            <Calendar className="h-4 w-4 mr-2" />
            {showGantt ? "Список проектов" : "Диаграмма Ганта"}
          </Button>
          {canCreateProject && (
            <>
              <Button
                size="icon"
                onClick={() => setCreateDialogOpen(true)}
                className="md:hidden"
                data-testid="button-create-project"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="hidden md:flex"
                data-testid="button-create-project-desktop"
              >
                <Plus className="h-4 w-4 mr-2" />
                Новый проект
              </Button>
            </>
          )}
        </div>
      </div>

      {showGantt ? (
        <div className="mt-6" data-testid="gantt-view">
          <GanttChart stages={projects.flatMap(p => p.stages)} />
        </div>
      ) : (
      <>
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="all">Все ({transformedProjects.length})</TabsTrigger>
          <TabsTrigger value="pending">В ожидании ({transformedProjects.filter(p => p.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="in_progress">В работе ({transformedProjects.filter(p => p.status === "in_progress").length})</TabsTrigger>
          <TabsTrigger value="completed">Завершенные ({transformedProjects.filter(p => p.status === "completed").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" data-testid={`skeleton-project-${i}`} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {transformedProjects.map((project) => (
                <ProjectDetailCard
                  key={project.id}
                  {...project}
                  onClick={() => handleProjectClick(project.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="pending" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1].map((i) => (
                <Skeleton key={i} className="h-48" data-testid={`skeleton-project-${i}`} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {transformedProjects
                .filter((p) => p.status === "pending")
                .map((project) => (
                  <ProjectDetailCard
                    key={project.id}
                    {...project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="in_progress" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48" data-testid={`skeleton-project-${i}`} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {transformedProjects
                .filter((p) => p.status === "in_progress")
                .map((project) => (
                  <ProjectDetailCard
                    key={project.id}
                    {...project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1].map((i) => (
                <Skeleton key={i} className="h-48" data-testid={`skeleton-project-${i}`} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {transformedProjects
                .filter((p) => p.status === "completed")
                .map((project) => (
                  <ProjectDetailCard
                    key={project.id}
                    {...project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProjectCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      </>
      )}
    </div>
  );
}

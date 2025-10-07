import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowLeft, Plus, Edit, Trash2, Calendar, FileText, Layers, 
  AlertCircle
} from "lucide-react";
import { ProjectItemDialog } from "@/components/ProjectItemDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, ProjectItem, ProjectStage } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery<Project & { stages: ProjectStage[] }>({
    queryKey: ['/api/projects', id],
    enabled: !!id,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<ProjectItem[]>({
    queryKey: ['/api/projects', id, 'items'],
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return await apiRequest('DELETE', `/api/projects/${id}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', id, 'items'] });
      toast({
        title: "Позиция удалена",
        description: "Позиция мебели успешно удалена",
      });
      if (selectedItemId === itemToDelete) {
        setSelectedItemId(null);
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить позицию",
        variant: "destructive",
      });
    },
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "Не установлен";
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "0 ₽";
    return `${parseFloat(amount).toLocaleString("ru-RU")} ₽`;
  };

  const handleAddItem = () => {
    setEditingItem(undefined);
    setItemDialogOpen(true);
  };

  const handleEditItem = (item: ProjectItem) => {
    setEditingItem(item);
    setItemDialogOpen(true);
  };

  const handleDeleteItem = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  const selectedItem = items.find(item => item.id === selectedItemId);

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20" data-testid="skeleton-header" />
        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
          <Skeleton className="h-96" data-testid="skeleton-sidebar" />
          <Skeleton className="h-96" data-testid="skeleton-content" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg text-muted-foreground" data-testid="text-not-found">
          Проект не найден
        </p>
        <Button onClick={() => setLocation("/projects")} data-testid="button-back-to-projects">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к проектам
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          onClick={() => setLocation("/projects")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к проектам
        </Button>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold" data-testid="text-project-name">
                  {project.name}
                </h1>
                <p className="text-muted-foreground" data-testid="text-client-name">
                  Клиент: {project.client_name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={project.status} data-testid="badge-status" />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Срок сдачи</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm" data-testid="text-deadline">
                    {formatDate(project.deadline)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Прогресс</p>
                <div className="space-y-2">
                  <Progress value={project.progress || 0} data-testid="progress-bar" />
                  <p className="text-sm" data-testid="text-progress">
                    {project.progress || 0}%
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Позиций мебели</p>
                <p className="text-lg font-semibold" data-testid="text-items-count">
                  {items.length}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        {/* Left Panel - Items List */}
        <Card className="p-4 h-fit lg:sticky lg:top-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold" data-testid="text-items-title">
                Позиции мебели
              </h2>
              <Button
                size="icon"
                onClick={handleAddItem}
                data-testid="button-add-item"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            {itemsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24" data-testid={`skeleton-item-${i}`} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Layers className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground" data-testid="text-empty-items">
                  Нет позиций мебели
                </p>
                <p className="text-xs text-muted-foreground">
                  Добавьте первую позицию
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {items.map((item) => (
                  <Card
                    key={item.id}
                    className={`p-4 space-y-3 cursor-pointer transition-colors ${
                      selectedItemId === item.id ? "border-primary" : ""
                    }`}
                    onClick={() => setSelectedItemId(item.id)}
                    data-testid={`card-item-${item.id}`}
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-sm" data-testid={`text-item-name-${item.id}`}>
                        {item.name}
                      </p>
                      {item.article && (
                        <p className="text-xs text-muted-foreground" data-testid={`text-item-article-${item.id}`}>
                          Арт: {item.article}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground" data-testid={`text-item-quantity-${item.id}`}>
                        {item.quantity} шт
                      </span>
                      {item.price && (
                        <span className="text-muted-foreground" data-testid={`text-item-price-${item.id}`}>
                          × {formatCurrency(item.price)}
                        </span>
                      )}
                    </div>

                    {item.price && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Итого:</span>
                        <span className="font-semibold text-sm" data-testid={`text-item-total-${item.id}`}>
                          {formatCurrency((parseFloat(item.price) * item.quantity).toString())}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditItem(item);
                        }}
                        data-testid={`button-edit-item-${item.id}`}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Изменить
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        data-testid={`button-delete-item-${item.id}`}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Удалить
                      </Button>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-full"
                            disabled
                            data-testid={`button-create-process-${item.id}`}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Создать процесс по шаблону
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Будет доступно в следующей версии</p>
                      </TooltipContent>
                    </Tooltip>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Right Panel - Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="constructor" className="w-full">
            <TabsList className="w-full justify-start" data-testid="tabs-list">
              <TabsTrigger value="constructor" data-testid="tab-constructor">
                Конструктор
              </TabsTrigger>
              <TabsTrigger value="gantt" data-testid="tab-gantt">
                Диаграмма Ганта
              </TabsTrigger>
              <TabsTrigger value="templates" data-testid="tab-templates">
                Шаблоны
              </TabsTrigger>
            </TabsList>

            <TabsContent value="constructor" className="mt-6" data-testid="content-constructor">
              {selectedItem ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold" data-testid="text-stages-title">
                      Этапы для позиции: {selectedItem.name}
                    </h3>
                  </div>
                  <Separator />
                  <div className="text-center py-12 space-y-2">
                    <Layers className="w-12 h-12 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground" data-testid="text-empty-stages">
                      Этапы пока не добавлены
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Функционал будет добавлен в следующей версии
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-2">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground" data-testid="text-no-selection">
                    Выберите позицию слева для управления этапами
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="gantt" className="mt-6" data-testid="content-gantt">
              <div className="text-center py-12 space-y-2">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground" data-testid="text-gantt-placeholder">
                  Диаграмма Ганта будет добавлена в следующей версии
                </p>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="mt-6" data-testid="content-templates">
              <div className="text-center py-12 space-y-2">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground" data-testid="text-templates-placeholder">
                  Шаблоны процессов будут добавлены в следующей версии
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      <ProjectItemDialog
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        projectId={id!}
        item={editingItem}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-item">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-delete-title">
              Удалить позицию?
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-delete-description">
              Это действие нельзя отменить. Позиция мебели будет удалена навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

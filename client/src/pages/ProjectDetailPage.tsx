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
  AlertCircle, GripVertical, MessageSquare
} from "lucide-react";
import { ProjectItemDialog } from "@/components/ProjectItemDialog";
import { StageDialog } from "@/components/StageDialog";
import { StageFlowEditor } from "@/components/StageFlowEditor";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, ProjectItem, ProjectStage, User } from "@shared/schema";
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
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";

// StageCard component with drag&drop functionality
interface StageCardProps {
  stage: ProjectStage;
  users: User[];
  onEdit: (stage: ProjectStage) => void;
  onDelete: (stageId: string) => void;
  onViewDetails: (stage: ProjectStage) => void;
  formatDate: (date: Date | null) => string;
  formatCurrency: (amount: string | null) => string;
}

function StageCard({ stage, users, onEdit, onDelete, onViewDetails, formatDate, formatCurrency }: StageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignee = users.find((u) => u.id === stage.assignee_id);
  const progressValue = stage.status === "completed" ? 100 : stage.status === "in_progress" ? 50 : 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-4 space-y-3"
      data-testid={`card-stage-${stage.id}`}
    >
      <div className="flex items-start gap-3">
        <button
          className="cursor-grab active:cursor-grabbing mt-1"
          {...attributes}
          {...listeners}
          data-testid={`handle-stage-${stage.id}`}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <h4 className="font-medium" data-testid={`text-stage-name-${stage.id}`}>
                {stage.name}
              </h4>
              {stage.description && (
                <p className="text-sm text-muted-foreground" data-testid={`text-stage-description-${stage.id}`}>
                  {stage.description}
                </p>
              )}
            </div>
            <StatusBadge status={stage.status} data-testid={`badge-stage-status-${stage.id}`} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Даты</p>
              <p data-testid={`text-stage-dates-${stage.id}`}>
                {formatDate(stage.start_date)} - {formatDate(stage.end_date)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Исполнитель</p>
              <p data-testid={`text-stage-assignee-${stage.id}`}>
                {assignee ? (assignee.full_name || assignee.username) : "Не назначен"}
              </p>
            </div>

            {stage.cost && (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs">Стоимость</p>
                <p className="font-semibold" data-testid={`text-stage-cost-${stage.id}`}>
                  {formatCurrency(stage.cost)}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Прогресс</p>
              <div className="space-y-1">
                <Progress value={progressValue} data-testid={`progress-stage-${stage.id}`} />
                <p className="text-xs" data-testid={`text-stage-progress-${stage.id}`}>
                  {progressValue}%
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(stage)}
              data-testid={`button-edit-stage-${stage.id}`}
            >
              <Edit className="w-3 h-3 mr-1" />
              Изменить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(stage.id)}
              data-testid={`button-delete-stage-${stage.id}`}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Удалить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewDetails(stage)}
              data-testid={`button-view-details-${stage.id}`}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Детали
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjectItem | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  
  // Stage dialog state
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<ProjectStage | undefined>();
  const [deleteStageDialogOpen, setDeleteStageDialogOpen] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<string | null>(null);

  const { data: project, isLoading: projectLoading } = useQuery<Project & { stages: ProjectStage[] }>({
    queryKey: ['/api/projects', id],
    enabled: !!id,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<ProjectItem[]>({
    queryKey: ['/api/projects', id, 'items'],
    enabled: !!id,
  });

  // Query stages for selected item
  const { data: stages = [], isLoading: stagesLoading } = useQuery<ProjectStage[]>({
    queryKey: ['/api/projects', id, 'items', selectedItemId, 'stages'],
    enabled: !!id && !!selectedItemId,
  });

  // Query users for assignee select
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
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

  // Stage handlers
  const handleAddStage = () => {
    setEditingStage(undefined);
    setStageDialogOpen(true);
  };

  const handleEditStage = (stage: ProjectStage) => {
    setEditingStage(stage);
    setStageDialogOpen(true);
  };

  const handleDeleteStage = (stageId: string) => {
    setStageToDelete(stageId);
    setDeleteStageDialogOpen(true);
  };

  const deleteStage = useMutation({
    mutationFn: async (stageId: string) => {
      return await apiRequest('DELETE', `/api/projects/stages/${stageId}`);
    },
    onSuccess: () => {
      if (selectedItemId) {
        queryClient.invalidateQueries({ queryKey: ['/api/projects', id, 'items', selectedItemId, 'stages'] });
      }
      toast({
        title: "Этап удален",
        description: "Этап успешно удален",
      });
      setDeleteStageDialogOpen(false);
      setStageToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить этап",
        variant: "destructive",
      });
    },
  });

  const confirmDeleteStage = () => {
    if (stageToDelete) {
      deleteStage.mutate(stageToDelete);
    }
  };

  const reorderStages = useMutation({
    mutationFn: async (stageIds: string[]) => 
      apiRequest('PATCH', `/api/projects/${id}/items/${selectedItemId}/stages/reorder`, {
        stageIds
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/projects', id, 'items', selectedItemId, 'stages'] 
      });
      toast({ 
        title: "Порядок этапов обновлён",
        description: "Порядок этапов успешно изменен",
      });
    },
    onError: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['/api/projects', id, 'items', selectedItemId, 'stages'] 
      });
      toast({ 
        title: "Ошибка", 
        description: "Не удалось обновить порядок", 
        variant: "destructive" 
      });
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex(s => s.id === active.id);
    const newIndex = stages.findIndex(s => s.id === over.id);
    
    // Optimistic update
    const reordered = arrayMove(stages, oldIndex, newIndex);
    queryClient.setQueryData(
      ['/api/projects', id, 'items', selectedItemId, 'stages'],
      reordered
    );

    // Single atomic API call
    reorderStages.mutate(reordered.map(s => s.id));
  };

  const selectedItem = items.find(item => item.id === selectedItemId);
  const sortedStages = [...stages].sort((a, b) => a.order - b.order);

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
              {!selectedItem ? (
                <div className="text-center py-12 space-y-2">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground" data-testid="text-no-selection">
                    Выберите позицию слева для управления этапами
                  </p>
                </div>
              ) : (
                <StageFlowEditor
                  projectId={id}
                  itemId={selectedItem.id}
                  itemName={selectedItem.name}
                />
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

      <StageDialog
        open={stageDialogOpen}
        onOpenChange={setStageDialogOpen}
        projectId={id!}
        itemId={selectedItemId || undefined}
        stage={editingStage}
      />

      <AlertDialog open={deleteStageDialogOpen} onOpenChange={setDeleteStageDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-stage">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-delete-stage-title">
              Удалить этап?
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-delete-stage-description">
              Это действие нельзя отменить. Этап будет удален навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-stage">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStage}
              disabled={deleteStage.isPending}
              data-testid="button-confirm-delete-stage"
            >
              {deleteStage.isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

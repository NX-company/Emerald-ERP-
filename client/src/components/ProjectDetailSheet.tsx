import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Plus, Loader2, Trash2 } from "lucide-react";
import { insertProjectSchema, type Project, type User, type Deal, type ProjectStage } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectDetailSheetProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectDetailSheet({ project, open, onOpenChange }: ProjectDetailSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const { toast } = useToast();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: deals = [] } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: stages = [], isLoading: stagesLoading } = useQuery<ProjectStage[]>({
    queryKey: ["/api/projects", project?.id, "stages"],
    enabled: !!project?.id,
  });

  const form = useForm({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: project?.name || "",
      client_name: project?.client_name || "",
      deal_id: project?.deal_id || "",
      status: project?.status || "pending",
      progress: project?.progress || 0,
      deadline: project?.deadline ? new Date(project.deadline).toISOString().slice(0, 16) : "",
      manager_id: project?.manager_id || "",
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name || "",
        client_name: project.client_name || "",
        deal_id: project.deal_id || "",
        status: project.status || "pending",
        progress: project.progress || 0,
        deadline: project.deadline ? new Date(project.deadline).toISOString().slice(0, 16) : "",
        manager_id: project.manager_id || "",
      });
    }
  }, [project, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const projectData = {
        ...data,
        deal_id: data.deal_id || null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        manager_id: data.manager_id || null,
      };
      await apiRequest("PUT", `/api/projects/${project?.id}`, projectData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Успешно",
        description: "Проект обновлен",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/projects/${project?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Успешно",
        description: "Проект удален",
      });
      setShowDeleteDialog(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addStageMutation = useMutation({
    mutationFn: async (stageName: string) => {
      const maxOrder = stages.length > 0 ? Math.max(...stages.map(s => s.order)) : -1;
      await apiRequest("POST", `/api/projects/${project?.id}/stages`, {
        name: stageName,
        status: "pending",
        order: maxOrder + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Успешно",
        description: "Стадия добавлена",
      });
      setNewStageName("");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ stageId, status }: { stageId: string; status: string }) => {
      await apiRequest("PUT", `/api/projects/stages/${stageId}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Успешно",
        description: "Статус стадии обновлен",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStageMutation = useMutation({
    mutationFn: async (stageId: string) => {
      await apiRequest("DELETE", `/api/projects/stages/${stageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project?.id, "stages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Успешно",
        description: "Стадия удалена",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleAddStage = () => {
    if (newStageName.trim()) {
      addStageMutation.mutate(newStageName.trim());
    }
  };

  const statusLabels: Record<string, string> = {
    pending: "В ожидании",
    in_progress: "В работе",
    completed: "Завершен",
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle data-testid="text-project-sheet-title">Детали проекта</SheetTitle>
            <SheetDescription data-testid="text-project-sheet-description">
              Редактирование информации о проекте
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название проекта</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Название проекта" 
                        data-testid="input-project-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Клиент</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Имя клиента" 
                        data-testid="input-project-client-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deal_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Сделка</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-deal">
                          <SelectValue placeholder="Выберите сделку (опционально)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="" data-testid="option-project-deal-none">
                          Без сделки
                        </SelectItem>
                        {deals.map((deal) => (
                          <SelectItem 
                            key={deal.id} 
                            value={deal.id}
                            data-testid={`option-project-deal-${deal.id}`}
                          >
                            {deal.client_name} - {deal.company || "Нет компании"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Статус</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-status">
                          <SelectValue placeholder="Выберите статус" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending" data-testid="option-project-status-pending">
                          {statusLabels.pending}
                        </SelectItem>
                        <SelectItem value="in_progress" data-testid="option-project-status-in_progress">
                          {statusLabels.in_progress}
                        </SelectItem>
                        <SelectItem value="completed" data-testid="option-project-status-completed">
                          {statusLabels.completed}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="progress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Прогресс: {field.value}%</FormLabel>
                    <FormControl>
                      <Slider 
                        value={[field.value || 0]} 
                        onValueChange={(value) => field.onChange(value[0])}
                        max={100}
                        step={5}
                        data-testid="slider-project-progress"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Срок</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="datetime-local" 
                        data-testid="input-project-deadline"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manager_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>РОП</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger data-testid="select-project-manager">
                          <SelectValue placeholder="Выберите менеджера" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem 
                            key={user.id} 
                            value={user.id}
                            data-testid={`option-project-manager-${user.id}`}
                          >
                            {user.full_name || user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-project"
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-project"
                >
                  Удалить
                </Button>
              </div>
            </form>
          </Form>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Стадии проекта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newStageName}
                  onChange={(e) => setNewStageName(e.target.value)}
                  placeholder="Название стадии"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddStage();
                    }
                  }}
                  data-testid="input-new-stage-name"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleAddStage}
                  disabled={addStageMutation.isPending || !newStageName.trim()}
                  data-testid="button-add-stage"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {stagesLoading ? (
                <div className="text-sm text-muted-foreground" data-testid="text-stages-loading">
                  Загрузка стадий...
                </div>
              ) : stages.length === 0 ? (
                <div className="text-sm text-muted-foreground" data-testid="text-no-stages">
                  Нет стадий
                </div>
              ) : (
                <div className="space-y-2">
                  {stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage, index) => (
                      <div 
                        key={stage.id} 
                        className="flex items-center gap-2 p-2 border rounded-md"
                        data-testid={`stage-item-${index}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate" data-testid={`stage-name-${index}`}>
                            {stage.name}
                          </div>
                        </div>
                        <Select 
                          value={stage.status} 
                          onValueChange={(value) => updateStageMutation.mutate({ 
                            stageId: stage.id, 
                            status: value 
                          })}
                        >
                          <SelectTrigger className="w-36" data-testid={`select-stage-status-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending" data-testid={`option-stage-status-pending-${index}`}>
                              {statusLabels.pending}
                            </SelectItem>
                            <SelectItem value="in_progress" data-testid={`option-stage-status-in_progress-${index}`}>
                              {statusLabels.in_progress}
                            </SelectItem>
                            <SelectItem value="completed" data-testid={`option-stage-status-completed-${index}`}>
                              {statusLabels.completed}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteStageMutation.mutate(stage.id)}
                          disabled={deleteStageMutation.isPending}
                          data-testid={`button-delete-stage-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-project-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-project-delete-title">
              Подтвердите удаление
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-project-delete-description">
              Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-project-delete">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-project-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

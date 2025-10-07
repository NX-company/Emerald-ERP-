import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertProjectItemSchema } from "@shared/schema";
import type { ProjectItem, InsertProjectItem } from "@shared/schema";
import { z } from "zod";

const formSchema = insertProjectItemSchema.omit({ project_id: true, order: true }).extend({
  name: z.string().min(1, "Название обязательно"),
  quantity: z.coerce.number().min(1, "Минимальное количество: 1"),
  price: z.union([z.string(), z.number(), z.null()]).optional().transform((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    return typeof val === "string" ? val : val.toString();
  }),
  article: z.string().nullable().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  item?: ProjectItem;
}

export function ProjectItemDialog({ open, onOpenChange, projectId, item }: ProjectItemDialogProps) {
  const { toast } = useToast();
  const isEditing = !!item;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      article: null,
      quantity: 1,
      price: undefined,
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name,
        article: item.article || null,
        quantity: item.quantity,
        price: item.price || undefined,
      });
    } else {
      form.reset({
        name: "",
        article: null,
        quantity: 1,
        price: undefined,
      });
    }
  }, [item, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const maxOrderResult = await fetch(`/api/projects/${projectId}/items`);
      const items = await maxOrderResult.json();
      const maxOrder = items.length > 0 ? Math.max(...items.map((i: ProjectItem) => i.order)) : 0;

      return await apiRequest('POST', `/api/projects/${projectId}/items`, {
        ...data,
        project_id: projectId,
        order: maxOrder + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'items'] });
      toast({
        title: "Позиция создана",
        description: "Позиция мебели успешно добавлена",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать позицию",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest('PUT', `/api/projects/${projectId}/items/${item?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'items'] });
      toast({
        title: "Позиция обновлена",
        description: "Позиция мебели успешно обновлена",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить позицию",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-project-item">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">
            {isEditing ? "Редактировать позицию" : "Добавить позицию"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              {...form.register("name")}
              data-testid="input-name"
              placeholder="Например: Кухонный гарнитур"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive" data-testid="error-name">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="article">Артикул</Label>
            <Input
              id="article"
              {...form.register("article")}
              data-testid="input-article"
              placeholder="Например: КГ-001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Количество *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                {...form.register("quantity")}
                data-testid="input-quantity"
              />
              {form.formState.errors.quantity && (
                <p className="text-sm text-destructive" data-testid="error-quantity">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Цена (₽)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                {...form.register("price")}
                data-testid="input-price"
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              data-testid="button-cancel"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              data-testid="button-submit"
            >
              {isPending ? "Сохранение..." : isEditing ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

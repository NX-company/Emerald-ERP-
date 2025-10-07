import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Edit2, Plus, Trash2, Settings2, ArrowLeft, Wand2 } from "lucide-react";
import { LocalStageEditor, LocalStage, LocalStageDependency } from "./LocalStageEditor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface InvoicePosition {
  name: string;
  article?: string;
  quantity: number;
  price: string;
}

interface PositionStagesData {
  stages: LocalStage[];
  dependencies: LocalStageDependency[];
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoicePositions: InvoicePosition[];
  onCreateProject: (
    selectedPositions: number[], 
    editedPositions: InvoicePosition[],
    positionStagesData: Record<number, PositionStagesData>
  ) => void;
  isPending: boolean;
  dealName: string;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  invoicePositions,
  onCreateProject,
  isPending,
  dealName,
}: CreateProjectDialogProps) {
  const { toast } = useToast();
  const [positions, setPositions] = useState<InvoicePosition[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentTab, setCurrentTab] = useState<"positions" | "stages">("positions");
  const [selectedPositionForStages, setSelectedPositionForStages] = useState<number | null>(null);
  const [positionStagesData, setPositionStagesData] = useState<Record<number, PositionStagesData>>({});
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);

  // Load templates
  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/templates"],
    enabled: open,
  });

  useEffect(() => {
    if (open && invoicePositions.length > 0) {
      setPositions([...invoicePositions]);
      setSelectedIndices(new Set(invoicePositions.map((_, i) => i)));
      setCurrentTab("positions");
      setSelectedPositionForStages(null);
      setPositionStagesData({}); // Очистить данные этапов при открытии диалога
    }
  }, [open, invoicePositions]);

  const handleToggle = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedIndices.size === positions.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(positions.map((_, i) => i)));
    }
  };

  const handleAddPosition = () => {
    const newPosition: InvoicePosition = {
      name: "Новая позиция",
      quantity: 1,
      price: "0",
    };
    setPositions([...positions, newPosition]);
    setSelectedIndices(new Set(Array.from(selectedIndices).concat(positions.length)));
    setEditingIndex(positions.length);
  };

  const handleDeletePosition = (index: number) => {
    const newPositions = positions.filter((_, i) => i !== index);
    setPositions(newPositions);
    
    const newSelected = new Set<number>();
    selectedIndices.forEach(idx => {
      if (idx < index) {
        newSelected.add(idx);
      } else if (idx > index) {
        newSelected.add(idx - 1);
      }
    });
    setSelectedIndices(newSelected);

    // Переиндексировать positionStagesData
    const newStagesData: Record<number, PositionStagesData> = {};
    Object.entries(positionStagesData).forEach(([key, value]) => {
      const oldIndex = parseInt(key);
      if (oldIndex < index) {
        newStagesData[oldIndex] = value;
      } else if (oldIndex > index) {
        newStagesData[oldIndex - 1] = value;
      }
      // Если oldIndex === index, не добавляем (удаляем)
    });
    setPositionStagesData(newStagesData);
  };

  const handleUpdatePosition = (index: number, field: keyof InvoicePosition, value: string | number) => {
    const newPositions = [...positions];
    newPositions[index] = { ...newPositions[index], [field]: value };
    setPositions(newPositions);
  };

  const handleCreate = () => {
    onCreateProject(Array.from(selectedIndices), positions, positionStagesData);
  };

  const goToStages = (index: number) => {
    setSelectedPositionForStages(index);
    setCurrentTab("stages");
  };

  const backToPositions = () => {
    setSelectedPositionForStages(null);
    setCurrentTab("positions");
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId || selectedPositionForStages === null) return;

    setIsApplyingTemplate(true);
    try {
      const response = await apiRequest(
        "GET",
        `/api/templates/${selectedTemplateId}`
      );
      const data: any = await response.json();

      // API returns { template, stages, dependencies }
      if (!data || !data.stages || !Array.isArray(data.stages)) {
        throw new Error("Invalid template data structure");
      }

      const { template, stages, dependencies = [] } = data;

      // Create stage ID mapping with crypto.randomUUID() for uniqueness
      const stageIdMap: Record<string, string> = {};
      stages.forEach((stage: any) => {
        stageIdMap[stage.id] = crypto.randomUUID();
      });

      // Map template stages to LocalStage format
      const localStages: LocalStage[] = stages.map((stage: any) => ({
        id: stageIdMap[stage.id],
        name: stage.name,
        order_index: stage.order,
      }));

      // Map dependencies with validation - skip invalid dependencies
      const localDependencies: LocalStageDependency[] = dependencies
        .filter((dep: any) => {
          const hasValidIds = stageIdMap[dep.template_stage_id] && stageIdMap[dep.depends_on_template_stage_id];
          if (!hasValidIds) {
            console.warn("Skipping dependency with missing stage IDs:", dep);
          }
          return hasValidIds;
        })
        .map((dep: any) => ({
          id: crypto.randomUUID(),
          stage_id: stageIdMap[dep.template_stage_id],
          depends_on_stage_id: stageIdMap[dep.depends_on_template_stage_id],
        }));

      setPositionStagesData(prev => ({
        ...prev,
        [selectedPositionForStages]: {
          stages: localStages,
          dependencies: localDependencies,
        }
      }));

      toast({ description: `Шаблон "${template.name}" применён` });
      setSelectedTemplateId("");
    } catch (error) {
      console.error("Error applying template:", error);
      const message = error instanceof Error ? error.message : "Ошибка при применении шаблона";
      toast({ description: message, variant: "destructive" });
    } finally {
      setIsApplyingTemplate(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]" data-testid="dialog-create-project">
        <DialogHeader>
          {currentTab === "stages" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={backToPositions}
              className="mb-2 w-fit"
              data-testid="button-back-to-positions"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к позициям
            </Button>
          )}
          <DialogTitle>
            {currentTab === "positions" 
              ? "Создать проект из счёта" 
              : `Настройка этапов: ${positions[selectedPositionForStages!]?.name}`
            }
          </DialogTitle>
          <DialogDescription>
            {currentTab === "positions" 
              ? `Выберите позиции из счёта, которые войдут в проект "${dealName}"`
              : "Добавьте этапы и свяжите их зависимостями. После создания проекта этапы будут доступны для редактирования."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 min-h-0">
          {currentTab === "positions" ? (
            <>
            <div className="flex items-center justify-between gap-2 pb-2 border-b shrink-0">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedIndices.size === positions.length}
                onCheckedChange={handleToggleAll}
                data-testid="checkbox-select-all"
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
                data-testid="label-select-all"
              >
                Выбрать все ({selectedIndices.size} из {positions.length})
              </label>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddPosition}
              data-testid="button-add-position"
            >
              <Plus className="w-4 h-4 mr-1" />
              Добавить
            </Button>
          </div>

          <ScrollArea className="h-[280px] pr-3">
            <div className="space-y-2">
              {positions.map((position, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 rounded-lg border hover-elevate"
                  data-testid={`position-${index}`}
                >
                  <Checkbox
                    id={`position-${index}`}
                    checked={selectedIndices.has(index)}
                    onCheckedChange={() => handleToggle(index)}
                    data-testid={`checkbox-position-${index}`}
                    className="mt-0.5"
                  />
                  
                  {editingIndex === index ? (
                    <div className="flex-1 space-y-2">
                      <Input
                        value={position.name}
                        onChange={(e) => handleUpdatePosition(index, 'name', e.target.value)}
                        placeholder="Название"
                        data-testid={`input-edit-name-${index}`}
                        autoFocus
                      />
                      <Input
                        value={position.article || ""}
                        onChange={(e) => handleUpdatePosition(index, 'article', e.target.value)}
                        placeholder="Артикул"
                        data-testid={`input-edit-article-${index}`}
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={position.quantity}
                          onChange={(e) => handleUpdatePosition(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Кол-во"
                          className="w-20"
                          data-testid={`input-edit-quantity-${index}`}
                        />
                        <Input
                          type="number"
                          value={position.price}
                          onChange={(e) => handleUpdatePosition(index, 'price', e.target.value)}
                          placeholder="Цена"
                          className="flex-1"
                          data-testid={`input-edit-price-${index}`}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setEditingIndex(null)}
                          data-testid={`button-save-${index}`}
                        >
                          Готово
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm" data-testid={`text-position-name-${index}`}>
                          {position.name}
                        </p>
                        {position.article && (
                          <p className="text-xs text-muted-foreground" data-testid={`text-position-article-${index}`}>
                            Артикул: {position.article}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium" data-testid={`text-position-price-${index}`}>
                          {parseFloat(position.price).toLocaleString('ru-RU')} ₽
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`text-position-quantity-${index}`}>
                          {position.quantity} шт.
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToStages(index);
                          }}
                          data-testid={`button-stages-${index}`}
                        >
                          <Settings2 className="w-3 h-3 mr-1" />
                          Этапы
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingIndex(index)}
                          data-testid={`button-edit-${index}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {index >= invoicePositions.length && (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletePosition(index)}
                            data-testid={`button-delete-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          {selectedIndices.size === 0 && (
            <p className="text-sm text-destructive shrink-0" data-testid="text-validation-error">
              Выберите хотя бы одну позицию для создания проекта
            </p>
          )}
            </>
          ) : selectedPositionForStages !== null ? (
            <>
              <div className="shrink-0 flex items-center gap-2 pb-3 border-b">
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                  disabled={isApplyingTemplate}
                >
                  <SelectTrigger className="flex-1" data-testid="select-template">
                    <SelectValue placeholder="Выберите шаблон процесса" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleApplyTemplate}
                  disabled={!selectedTemplateId || isApplyingTemplate}
                  size="default"
                  data-testid="button-apply-template"
                >
                  {isApplyingTemplate ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Применить
                </Button>
              </div>

              <LocalStageEditor
                positionName={positions[selectedPositionForStages]?.name || ""}
                stages={positionStagesData[selectedPositionForStages]?.stages || []}
                dependencies={positionStagesData[selectedPositionForStages]?.dependencies || []}
                onStagesChange={(stages) => {
                  setPositionStagesData(prev => ({
                    ...prev,
                    [selectedPositionForStages]: {
                      stages,
                      dependencies: prev[selectedPositionForStages]?.dependencies || []
                    }
                  }));
                }}
                onDependenciesChange={(dependencies) => {
                  setPositionStagesData(prev => ({
                    ...prev,
                    [selectedPositionForStages]: {
                      stages: prev[selectedPositionForStages]?.stages || [],
                      dependencies
                    }
                  }));
                }}
              />
            </>
          ) : null}

          <DialogFooter className="shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            data-testid="button-cancel"
          >
            Отмена
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isPending || selectedIndices.size === 0}
            data-testid="button-create-project-confirm"
          >
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isPending ? "Создание..." : "Создать проект"}
          </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Link2, X, ChevronUp, ChevronDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

export interface LocalStage {
  id: string;
  name: string;
  order_index: number;
  duration_days?: number;
  assignee_id?: string;
  cost?: number;
  description?: string;
}

export interface LocalStageDependency {
  stage_id: string;
  depends_on_stage_id: string;
}

interface LocalStageEditorProps {
  positionName: string;
  stages: LocalStage[];
  dependencies?: LocalStageDependency[];
  onStagesChange: (stages: LocalStage[]) => void;
  onDependenciesChange?: (dependencies: LocalStageDependency[]) => void;
  mode?: 'template' | 'project';
  users?: Array<{ id: string; full_name?: string; username: string }>;
}

export function LocalStageEditor({ 
  positionName, 
  stages, 
  dependencies = [],
  onStagesChange,
  onDependenciesChange,
  mode = 'template',
  users = []
}: LocalStageEditorProps) {
  const [newStageName, setNewStageName] = useState("");

  const handleAddStage = () => {
    if (!newStageName.trim()) return;

    const newStage: LocalStage = {
      id: `temp-${Date.now()}`,
      name: newStageName,
      order_index: stages.length,
    };

    onStagesChange([...stages, newStage]);
    setNewStageName("");
  };

  const handleDeleteStage = (id: string) => {
    const updatedStages = stages
      .filter(s => s.id !== id)
      .map((s, index) => ({ ...s, order_index: index }));
    onStagesChange(updatedStages);

    if (onDependenciesChange) {
      const updatedDeps = dependencies.filter(
        d => d.stage_id !== id && d.depends_on_stage_id !== id
      );
      onDependenciesChange(updatedDeps);
    }
  };

  const handleUpdateStage = (id: string, field: keyof LocalStage, value: string | number) => {
    const updatedStages = stages.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    onStagesChange(updatedStages);
  };

  const handleAddDependency = (stageId: string, dependsOnStageId: string) => {
    if (!onDependenciesChange) return;
    
    const exists = dependencies.some(
      d => d.stage_id === stageId && d.depends_on_stage_id === dependsOnStageId
    );
    
    if (!exists && stageId !== dependsOnStageId) {
      onDependenciesChange([...dependencies, { stage_id: stageId, depends_on_stage_id: dependsOnStageId }]);
    }
  };

  const handleRemoveDependency = (stageId: string, dependsOnStageId: string) => {
    if (!onDependenciesChange) return;
    
    const updatedDeps = dependencies.filter(
      d => !(d.stage_id === stageId && d.depends_on_stage_id === dependsOnStageId)
    );
    onDependenciesChange(updatedDeps);
  };

  const getStageDependencies = (stageId: string) => {
    return dependencies.filter(d => d.stage_id === stageId);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newStages = [...stages];
    [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];
    const reindexed = newStages.map((s, i) => ({ ...s, order_index: i }));
    onStagesChange(reindexed);
  };

  const handleMoveDown = (index: number) => {
    if (index === stages.length - 1) return;
    const newStages = [...stages];
    [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];
    const reindexed = newStages.map((s, i) => ({ ...s, order_index: i }));
    onStagesChange(reindexed);
  };

  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="shrink-0">
        <h4 className="text-sm font-medium mb-1">Этапы для: {positionName}</h4>
        <p className="text-xs text-muted-foreground">
          Добавьте этапы и настройте зависимости между ними.
        </p>
      </div>

      <ScrollArea className="h-[240px] pr-3">
        <div className="space-y-2">
          {stages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-3 bg-muted rounded-lg" data-testid="text-no-stages">
              Этапы не добавлены
            </p>
          ) : (
            stages.map((stage, index) => {
              const stageDeps = getStageDependencies(stage.id);
              
              return (
                <div
                  key={stage.id}
                  className="p-2 border rounded-lg space-y-2"
                  data-testid={`stage-item-${index}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6"
                        data-testid={`button-move-up-${index}`}
                      >
                        <ChevronUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === stages.length - 1}
                        className="h-6 w-6"
                        data-testid={`button-move-down-${index}`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={stage.name}
                        onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                        placeholder="Название этапа"
                        data-testid={`input-stage-name-${index}`}
                      />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteStage(stage.id)}
                      data-testid={`button-delete-stage-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pl-12 pt-2">
                    <div>
                      <Label className="text-xs">Срок (дни)</Label>
                      <Input
                        type="number"
                        value={stage.duration_days || ''}
                        onChange={(e) => handleUpdateStage(stage.id, 'duration_days', parseInt(e.target.value) || 0)}
                        placeholder="7"
                        className="h-8"
                        data-testid={`input-duration-${index}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Стоимость</Label>
                      <Input
                        type="number"
                        value={stage.cost || ''}
                        onChange={(e) => handleUpdateStage(stage.id, 'cost', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="h-8"
                        data-testid={`input-cost-${index}`}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Исполнитель</Label>
                      <Select
                        value={stage.assignee_id || ''}
                        onValueChange={(value) => handleUpdateStage(stage.id, 'assignee_id', value)}
                      >
                        <SelectTrigger className="h-8" data-testid={`select-assignee-${index}`}>
                          <SelectValue placeholder="Выбрать исполнителя" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.full_name || u.username}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Описание</Label>
                      <Textarea
                        value={stage.description || ''}
                        onChange={(e) => handleUpdateStage(stage.id, 'description', e.target.value)}
                        placeholder="Детали выполнения этапа"
                        className="h-16 text-xs"
                        data-testid={`textarea-description-${index}`}
                      />
                    </div>
                  </div>

                  {onDependenciesChange && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                          <Link2 className="w-3 h-3" />
                          Зависит от:
                        </Label>
                        <Select
                          value=""
                          onValueChange={(value) => handleAddDependency(stage.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs" data-testid={`select-add-dependency-${index}`}>
                            <SelectValue placeholder="Добавить зависимость" />
                          </SelectTrigger>
                          <SelectContent>
                            {stages
                              .filter(s => s.id !== stage.id && !stageDeps.some(d => d.depends_on_stage_id === s.id))
                              .map(s => (
                                <SelectItem key={s.id} value={s.id} data-testid={`option-dependency-${s.id}`}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            {stages.filter(s => s.id !== stage.id && !stageDeps.some(d => d.depends_on_stage_id === s.id)).length === 0 && (
                              <SelectItem value="none" disabled>
                                Нет доступных этапов
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {stageDeps.length > 0 && (
                        <div className="flex flex-wrap gap-1 pl-20">
                          {stageDeps.map(dep => {
                            const depStage = stages.find(s => s.id === dep.depends_on_stage_id);
                            return (
                              <Badge 
                                key={dep.depends_on_stage_id} 
                                variant="secondary" 
                                className="text-xs gap-1"
                                data-testid={`badge-dependency-${dep.depends_on_stage_id}`}
                              >
                                {depStage?.name}
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-3 w-3 p-0 hover:bg-transparent"
                                  onClick={() => handleRemoveDependency(stage.id, dep.depends_on_stage_id)}
                                  data-testid={`button-remove-dependency-${dep.depends_on_stage_id}`}
                                >
                                  <X className="w-2 h-2" />
                                </Button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <div className="space-y-2 p-2 border rounded-lg bg-muted/50 shrink-0">
        <Label className="text-sm font-medium">Добавить этап</Label>
        <div className="flex gap-2">
          <Input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="Название этапа"
            onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
            data-testid="input-new-stage-name"
          />
          <Button
            type="button"
            size="icon"
            onClick={handleAddStage}
            disabled={!newStageName.trim()}
            data-testid="button-add-stage"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

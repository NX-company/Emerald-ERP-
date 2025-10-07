import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Link2, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface LocalStage {
  id: string;
  name: string;
  duration_days: number;
  order_index: number;
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
}

export function LocalStageEditor({ 
  positionName, 
  stages, 
  dependencies = [],
  onStagesChange,
  onDependenciesChange
}: LocalStageEditorProps) {
  const [newStageName, setNewStageName] = useState("");
  const [newStageDuration, setNewStageDuration] = useState("7");

  const handleAddStage = () => {
    if (!newStageName.trim()) return;

    const newStage: LocalStage = {
      id: `temp-${Date.now()}`,
      name: newStageName,
      duration_days: parseInt(newStageDuration) || 7,
      order_index: stages.length,
    };

    onStagesChange([...stages, newStage]);
    setNewStageName("");
    setNewStageDuration("7");
  };

  const handleDeleteStage = (id: string) => {
    const updatedStages = stages
      .filter(s => s.id !== id)
      .map((s, index) => ({ ...s, order_index: index }));
    onStagesChange(updatedStages);

    // Удалить все зависимости, связанные с этим этапом
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
    
    // Проверить, что зависимость не существует
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

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Этапы для: {positionName}</h4>
        <p className="text-xs text-muted-foreground">
          Добавьте этапы и настройте зависимости между ними. Этапы с зависимостями будут созданы автоматически.
        </p>
      </div>

      {/* Список этапов */}
      <div className="space-y-2">
        {stages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg" data-testid="text-no-stages">
            Этапы не добавлены
          </p>
        ) : (
          stages.map((stage, index) => {
            const stageDeps = getStageDependencies(stage.id);
            
            return (
              <div
                key={stage.id}
                className="p-3 border rounded-lg space-y-3"
                data-testid={`stage-item-${index}`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Input
                      value={stage.name}
                      onChange={(e) => handleUpdateStage(stage.id, 'name', e.target.value)}
                      placeholder="Название этапа"
                      data-testid={`input-stage-name-${index}`}
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      value={stage.duration_days}
                      onChange={(e) => handleUpdateStage(stage.id, 'duration_days', parseInt(e.target.value) || 1)}
                      placeholder="Дней"
                      data-testid={`input-stage-duration-${index}`}
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

                {/* Зависимости */}
                {onDependenciesChange && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
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
                      <div className="flex flex-wrap gap-1">
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

      {/* Добавление нового этапа */}
      <div className="space-y-2 p-3 border rounded-lg bg-muted/50">
        <Label className="text-sm font-medium">Добавить этап</Label>
        <div className="flex gap-2">
          <Input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder="Название этапа"
            onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
            data-testid="input-new-stage-name"
          />
          <Input
            type="number"
            value={newStageDuration}
            onChange={(e) => setNewStageDuration(e.target.value)}
            placeholder="Дней"
            className="w-24"
            data-testid="input-new-stage-duration"
          />
          <Button
            type="button"
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

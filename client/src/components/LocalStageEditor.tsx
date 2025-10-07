import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

export interface LocalStage {
  id: string;
  name: string;
  duration_days: number;
  order_index: number;
}

interface LocalStageEditorProps {
  positionName: string;
  stages: LocalStage[];
  onStagesChange: (stages: LocalStage[]) => void;
}

export function LocalStageEditor({ positionName, stages, onStagesChange }: LocalStageEditorProps) {
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
  };

  const handleUpdateStage = (id: string, field: keyof LocalStage, value: string | number) => {
    const updatedStages = stages.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    onStagesChange(updatedStages);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2">Этапы для: {positionName}</h4>
        <p className="text-xs text-muted-foreground">
          Добавьте этапы производства. После создания проекта вы сможете настроить зависимости между этапами.
        </p>
      </div>

      {/* Список этапов */}
      <div className="space-y-2">
        {stages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center p-4 bg-muted rounded-lg" data-testid="text-no-stages">
            Этапы не добавлены
          </p>
        ) : (
          stages.map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-center gap-2 p-3 border rounded-lg hover-elevate"
              data-testid={`stage-item-${index}`}
            >
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
          ))
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

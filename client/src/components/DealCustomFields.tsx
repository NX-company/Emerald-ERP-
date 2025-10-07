import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CustomFieldDefinition } from "@shared/schema";

interface DealCustomFieldValue {
  id: string;
  deal_id: string;
  field_definition_id: string;
  value: string | null;
  created_at: string;
  field_name: string;
  field_type: string;
  options?: string[];
}

interface DealCustomFieldsProps {
  dealId: string | null;
}

export function DealCustomFields({ dealId }: DealCustomFieldsProps) {
  const { toast } = useToast();
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const { data: definitions = [] } = useQuery<CustomFieldDefinition[]>({
    queryKey: ["/api/custom-field-definitions"],
  });

  const { data: fieldValues = [] } = useQuery<DealCustomFieldValue[]>({
    queryKey: ["/api/deals", dealId, "custom-fields"],
    enabled: !!dealId,
  });

  const saveField = useMutation({
    mutationFn: async ({
      fieldDefinitionId,
      value,
    }: {
      fieldDefinitionId: string;
      value: string;
    }) => {
      if (!dealId) throw new Error("No deal ID");
      return apiRequest("POST", `/api/deals/${dealId}/custom-fields`, {
        field_definition_id: fieldDefinitionId,
        value,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/deals", dealId, "custom-fields"],
      });
      toast({
        title: "Поле сохранено",
        description: "Значение успешно сохранено",
      });
      setEditingFieldId(null);
      setEditValue("");
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить значение",
        variant: "destructive",
      });
    },
  });

  const handleStartEdit = (fieldId: string, currentValue: string | null) => {
    setEditingFieldId(fieldId);
    setEditValue(currentValue || "");
  };

  const handleSave = (fieldDefinitionId: string) => {
    saveField.mutate({ fieldDefinitionId, value: editValue });
  };

  const handleCancel = () => {
    setEditingFieldId(null);
    setEditValue("");
  };

  const renderFieldEditor = (definition: CustomFieldDefinition, currentValue?: DealCustomFieldValue) => {
    const isEditing = editingFieldId === definition.id;
    const displayValue = currentValue?.value || "—";

    if (!isEditing) {
      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm" data-testid={`field-value-${definition.id}`}>
            {definition.field_type === "checkbox"
              ? displayValue === "true"
                ? "Да"
                : "Нет"
              : displayValue}
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => handleStartEdit(definition.id, currentValue?.value || null)}
            data-testid={`button-edit-${definition.id}`}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {definition.field_type === "text" && (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Введите значение"
            className="h-8 text-sm"
            data-testid={`input-${definition.id}`}
          />
        )}

        {definition.field_type === "number" && (
          <Input
            type="number"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder="Введите число"
            className="h-8 text-sm"
            data-testid={`input-${definition.id}`}
          />
        )}

        {definition.field_type === "date" && (
          <Input
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-sm"
            data-testid={`input-${definition.id}`}
          />
        )}

        {definition.field_type === "checkbox" && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={editValue === "true"}
              onCheckedChange={(checked) => setEditValue(checked ? "true" : "false")}
              data-testid={`checkbox-${definition.id}`}
            />
            <Label className="text-sm">Да</Label>
          </div>
        )}

        {definition.field_type === "select" && definition.options && (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="h-8 text-sm" data-testid={`select-${definition.id}`}>
              <SelectValue placeholder="Выберите значение" />
            </SelectTrigger>
            <SelectContent>
              {definition.options.filter(Boolean).map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleSave(definition.id)}
            disabled={saveField.isPending}
            className="h-7 px-2"
            data-testid={`button-save-${definition.id}`}
          >
            <Check className="h-3 w-3 mr-1" />
            Сохранить
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-7 px-2"
            data-testid={`button-cancel-${definition.id}`}
          >
            <X className="h-3 w-3 mr-1" />
            Отмена
          </Button>
        </div>
      </div>
    );
  };

  if (!dealId || definitions.length === 0) {
    return null; // Don't show section if no deal ID or no custom fields are defined
  }

  return (
    <div className="mb-4">
      <p className="text-sm font-medium mb-2">Дополнительные поля</p>
      <div className="space-y-3">
        {definitions.map((definition) => {
          const currentValue = fieldValues.find(
            (fv) => fv.field_definition_id === definition.id
          );
          return (
            <div key={definition.id} data-testid={`custom-field-${definition.id}`}>
              <Label className="text-xs text-muted-foreground">
                {definition.name}
              </Label>
              {renderFieldEditor(definition, currentValue)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

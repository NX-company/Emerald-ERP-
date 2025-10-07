import { useState } from "react";
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
import { Loader2 } from "lucide-react";

interface InvoicePosition {
  name: string;
  article?: string;
  quantity: number;
  price: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoicePositions: InvoicePosition[];
  onCreateProject: (selectedPositions: number[]) => void;
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
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(
    new Set(invoicePositions.map((_, i) => i))
  );

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
    if (selectedIndices.size === invoicePositions.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(invoicePositions.map((_, i) => i)));
    }
  };

  const handleCreate = () => {
    onCreateProject(Array.from(selectedIndices));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid="dialog-create-project">
        <DialogHeader>
          <DialogTitle>Создать проект из счёта</DialogTitle>
          <DialogDescription>
            Выберите позиции из счёта, которые войдут в проект "{dealName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectedIndices.size === invoicePositions.length}
              onCheckedChange={handleToggleAll}
              data-testid="checkbox-select-all"
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer"
            >
              Выбрать все ({selectedIndices.size} из {invoicePositions.length})
            </label>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {invoicePositions.map((position, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border hover-elevate"
                  data-testid={`position-${index}`}
                >
                  <Checkbox
                    id={`position-${index}`}
                    checked={selectedIndices.has(index)}
                    onCheckedChange={() => handleToggle(index)}
                    data-testid={`checkbox-position-${index}`}
                  />
                  <label
                    htmlFor={`position-${index}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {position.name}
                        </p>
                        {position.article && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Артикул: {position.article}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">
                          {parseFloat(position.price).toLocaleString('ru-RU')} ₽
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {position.quantity} шт.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </ScrollArea>

          {selectedIndices.size === 0 && (
            <p className="text-sm text-destructive">
              Выберите хотя бы одну позицию для создания проекта
            </p>
          )}
        </div>

        <DialogFooter>
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
      </DialogContent>
    </Dialog>
  );
}

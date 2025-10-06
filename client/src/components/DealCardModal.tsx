import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import type { Deal } from "@shared/schema";

interface DealCardModalProps {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealCardModal({ dealId, open, onOpenChange }: DealCardModalProps) {
  const { data: deal, isLoading } = useQuery<Deal>({
    queryKey: ['/api/deals', dealId],
    enabled: !!dealId && open,
  });

  if (!open || !dealId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0" data-testid="dialog-deal-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>Загрузка...</p>
          </div>
        ) : (
          <div className="grid grid-cols-[300px_1fr_350px] h-full overflow-hidden">
            {/* Левая панель - информация */}
            <div className="border-r p-4 overflow-y-auto" data-testid="panel-left-info">
              <h3 className="font-semibold mb-2">Информация о сделке</h3>
              {/* Заглушка */}
            </div>

            {/* Центральная панель - чат */}
            <div className="flex flex-col" data-testid="panel-center-chat">
              <div className="flex-1 p-4 overflow-y-auto">
                <h3 className="font-semibold mb-2">История сообщений</h3>
                {/* Заглушка */}
              </div>
            </div>

            {/* Правая панель - действия */}
            <div className="border-l p-4 overflow-y-auto" data-testid="panel-right-actions">
              <h3 className="font-semibold mb-2">Действия</h3>
              {/* Заглушка */}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

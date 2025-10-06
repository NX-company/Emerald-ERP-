import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building2, DollarSign } from "lucide-react";
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
              {deal && (
                <>
                  {/* Заголовок */}
                  <div className="mb-4">
                    <h2 className="font-semibold text-lg" data-testid="text-deal-name">
                      {deal.client_name || "Сделка без названия"}
                    </h2>
                    <p className="text-sm text-muted-foreground" data-testid="text-order-number">
                      Заказ #{deal.order_number || "не присвоен"}
                    </p>
                  </div>

                  <Separator className="my-4" />

                  {/* Этап */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Этап</p>
                    <Badge data-testid="badge-stage">{deal.stage}</Badge>
                  </div>

                  <Separator className="my-4" />

                  {/* Контакты */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Контактные данные</p>
                    {deal.contact_email && (
                      <div className="flex items-center gap-2 text-sm mb-1" data-testid="text-email">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{deal.contact_email}</span>
                      </div>
                    )}
                    {deal.contact_phone && (
                      <div className="flex items-center gap-2 text-sm mb-1" data-testid="text-phone">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{deal.contact_phone}</span>
                      </div>
                    )}
                    {deal.company && (
                      <div className="flex items-center gap-2 text-sm" data-testid="text-company">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{deal.company}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Сумма */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Сумма заказа</p>
                    <div className="flex items-center gap-2" data-testid="text-amount">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {deal.amount ? `${Number(deal.amount).toLocaleString('ru-RU')} ₽` : 'Не указана'}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Документы */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Документы</p>
                    <p className="text-sm text-muted-foreground mb-2">Пусто</p>
                    <Button size="sm" variant="outline" disabled data-testid="button-add-document">
                      + Добавить документ
                    </Button>
                  </div>

                  <Separator className="my-4" />

                  {/* Доп поля */}
                  <div>
                    <p className="text-sm font-medium mb-2">Дополнительные поля</p>
                    <p className="text-sm text-muted-foreground">Настройте поля в настройках</p>
                  </div>
                </>
              )}
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

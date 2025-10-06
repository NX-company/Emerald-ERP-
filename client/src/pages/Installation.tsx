import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Calendar, User, Phone, Camera } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";

export default function Installation() {
  // todo: remove mock functionality
  const installations = [
    {
      id: "INS001",
      projectId: "567",
      projectName: "Кухонный гарнитур Модерн",
      client: "ООО Интерьер Плюс",
      address: "г. Москва, ул. Ленина, д. 10, кв. 25",
      installer: "Сергей Морозов",
      phone: "+7 (999) 123-45-67",
      date: "15.11.2025",
      status: "scheduled" as const,
      payment: 15000,
    },
    {
      id: "INS002",
      projectId: "568",
      projectName: "Шкаф-купе 3м",
      client: "ИП Иванова Е.А.",
      address: "г. Москва, ул. Пушкина, д. 5",
      installer: "Дмитрий Попов",
      phone: "+7 (999) 765-43-21",
      date: "12.11.2025",
      status: "in_progress" as const,
      payment: 8000,
    },
  ];

  const statusConfig = {
    scheduled: { label: "Запланирован", variant: "secondary" as const },
    in_progress: { label: "В работе", variant: "default" as const },
    completed: { label: "Завершен", variant: "outline" as const },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Монтаж</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление монтажными работами</p>
        </div>
        <Button data-testid="button-create-installation">
          <Plus className="h-4 w-4 mr-2" />
          Новая задача
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {installations.map((installation) => (
          <Card key={installation.id} className="hover-elevate active-elevate-2" data-testid={`card-installation-${installation.id}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{installation.projectName}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{installation.client}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className="font-mono text-xs">#{installation.projectId}</Badge>
                  <Badge variant={statusConfig[installation.status].variant}>
                    {statusConfig[installation.status].label}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-xs">{installation.address}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className="text-xs">Дата монтажа</span>
                </div>
                <span className="text-xs font-medium">{installation.date}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span className="text-xs">Монтажник</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserAvatar name={installation.installer} size="sm" />
                  <span className="text-xs">{installation.installer.split(" ")[0]}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span className="text-xs">Телефон</span>
                </div>
                <span className="text-xs font-mono">{installation.phone}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Оплата</span>
                <span className="text-sm font-semibold">₽{installation.payment.toLocaleString()}</span>
              </div>

              {installation.status === "in_progress" && (
                <Button variant="outline" size="sm" className="w-full gap-2" data-testid={`button-upload-photo-${installation.id}`}>
                  <Camera className="h-4 w-4" />
                  Загрузить фото
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

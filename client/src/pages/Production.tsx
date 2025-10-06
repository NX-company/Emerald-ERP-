import { ProductionCard } from "@/components/ProductionCard";
import { Button } from "@/components/ui/button";
import { Plus, QrCode } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Production() {
  // todo: remove mock functionality
  const productionTasks = [
    {
      id: "301",
      itemName: "Кухонный фасад верхний",
      stages: [
        { name: "Раскрой", status: "completed" as const },
        { name: "Кромка", status: "completed" as const },
        { name: "Фрезеровка", status: "completed" as const },
        { name: "Покраска", status: "completed" as const },
        { name: "Сборка", status: "completed" as const },
      ],
      progress: 100,
      worker: "Андрей Кузнецов",
      payment: 3500,
      deadline: "08.11.2025",
      qrCode: true,
      status: "completed",
    },
    {
      id: "302",
      itemName: "Столешница 3000мм",
      stages: [
        { name: "Раскрой", status: "completed" as const },
        { name: "Фрезеровка", status: "in_progress" as const },
        { name: "Полировка", status: "pending" as const },
        { name: "Упаковка", status: "pending" as const },
      ],
      progress: 45,
      worker: "Михаил Соколов",
      payment: 5000,
      deadline: "09.11.2025",
      qrCode: true,
      status: "in_progress",
    },
    {
      id: "303",
      itemName: "Дверца шкафа-купе",
      stages: [
        { name: "Раскрой", status: "completed" as const },
        { name: "Кромка", status: "completed" as const },
        { name: "Покраска", status: "in_progress" as const },
        { name: "Сушка", status: "pending" as const },
        { name: "Упаковка", status: "pending" as const },
      ],
      progress: 20,
      worker: "Дмитрий Попов",
      payment: 4200,
      deadline: "10.11.2025",
      qrCode: true,
      status: "in_progress",
    },
    {
      id: "304",
      itemName: "Полка навесная",
      stages: [
        { name: "Раскрой", status: "pending" as const },
        { name: "Кромка", status: "pending" as const },
        { name: "Сборка", status: "pending" as const },
      ],
      progress: 0,
      worker: "Сергей Морозов",
      payment: 2800,
      deadline: "11.11.2025",
      qrCode: true,
      status: "pending",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Производство</h1>
          <p className="text-sm text-muted-foreground mt-1">Сменные задания и контроль этапов</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-scan-qr">
            <QrCode className="h-4 w-4 mr-2" />
            Сканировать QR
          </Button>
          <Button data-testid="button-create-task">
            <Plus className="h-4 w-4 mr-2" />
            Новое задание
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Все задания ({productionTasks.length})</TabsTrigger>
          <TabsTrigger value="in_progress">
            В работе ({productionTasks.filter((t) => t.status === "in_progress").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Завершено ({productionTasks.filter((t) => t.status === "completed").length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productionTasks.map((task) => (
              <ProductionCard key={task.id} {...task} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="in_progress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productionTasks
              .filter((t) => t.status === "in_progress")
              .map((task) => (
                <ProductionCard key={task.id} {...task} />
              ))}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productionTasks
              .filter((t) => t.status === "completed")
              .map((task) => (
                <ProductionCard key={task.id} {...task} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

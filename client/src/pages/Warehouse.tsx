import { Button } from "@/components/ui/button";
import { Plus, QrCode, FileBarChart } from "lucide-react";
import { WarehouseItemCard } from "@/components/WarehouseItemCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Warehouse() {
  // todo: remove mock functionality
  const items = [
    {
      id: "MAT001",
      name: "МДФ 18мм белый",
      quantity: 15,
      unit: "листов",
      location: "Склад А-12",
      status: "critical" as const,
      minStock: 20,
    },
    {
      id: "MAT002",
      name: "Фурнитура Blum",
      quantity: 45,
      unit: "компл.",
      location: "Склад Б-03",
      status: "low" as const,
      minStock: 30,
    },
    {
      id: "MAT003",
      name: "Кромка ПВХ 2мм",
      quantity: 250,
      unit: "м.п.",
      location: "Склад А-05",
      status: "normal" as const,
      minStock: 100,
    },
    {
      id: "MAT004",
      name: "ДСП 16мм дуб",
      quantity: 80,
      unit: "листов",
      location: "Склад А-15",
      status: "normal" as const,
      minStock: 40,
    },
    {
      id: "PROD001",
      name: "Кухонный фасад верхний",
      quantity: 2,
      unit: "шт.",
      location: "Склад готовой продукции",
      status: "normal" as const,
      minStock: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Склад</h1>
          <p className="text-sm text-muted-foreground mt-1">Учет материалов и готовой продукции</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" data-testid="button-inventory">
            <FileBarChart className="h-4 w-4 mr-2" />
            Инвентаризация
          </Button>
          <Button variant="outline" data-testid="button-scan-qr">
            <QrCode className="h-4 w-4 mr-2" />
            Сканировать
          </Button>
          <Button data-testid="button-add-item">
            <Plus className="h-4 w-4 mr-2" />
            Приход
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Все ({items.length})</TabsTrigger>
          <TabsTrigger value="materials">Материалы ({items.filter(i => i.id.startsWith("MAT")).length})</TabsTrigger>
          <TabsTrigger value="products">Готовая продукция ({items.filter(i => i.id.startsWith("PROD")).length})</TabsTrigger>
          <TabsTrigger value="critical">Критический остаток ({items.filter(i => i.status === "critical").length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <WarehouseItemCard key={item.id} {...item} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="materials" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.filter(i => i.id.startsWith("MAT")).map((item) => (
              <WarehouseItemCard key={item.id} {...item} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.filter(i => i.id.startsWith("PROD")).map((item) => (
              <WarehouseItemCard key={item.id} {...item} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="critical" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.filter(i => i.status === "critical").map((item) => (
              <WarehouseItemCard key={item.id} {...item} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

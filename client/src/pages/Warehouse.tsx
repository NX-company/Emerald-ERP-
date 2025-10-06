import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, QrCode, FileBarChart, Search, AlertTriangle, Package } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WarehouseItem } from "@shared/schema";

export default function Warehouse() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: items = [], isLoading, error } = useQuery<WarehouseItem[]>({
    queryKey: ["/api/warehouse"],
  });

  if (error) {
    toast({
      title: "Ошибка загрузки",
      description: "Не удалось загрузить данные склада",
      variant: "destructive",
    });
  }

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: "normal" | "low" | "critical") => {
    const config = {
      normal: { label: "В норме", variant: "outline" as const },
      low: { label: "Низкий", variant: "secondary" as const },
      critical: { label: "Критический", variant: "destructive" as const },
    };
    return config[status];
  };

  const renderTable = (itemsToRender: WarehouseItem[]) => (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Артикул</TableHead>
              <TableHead>Название</TableHead>
              <TableHead className="w-32 text-right">Остаток</TableHead>
              <TableHead className="w-24">Ед. изм.</TableHead>
              <TableHead className="w-40">Расположение</TableHead>
              <TableHead className="w-32 text-right">Мин. остаток</TableHead>
              <TableHead className="w-32 text-center">Статус</TableHead>
              <TableHead className="w-24 text-center">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemsToRender.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Ничего не найдено
                </TableCell>
              </TableRow>
            ) : (
              itemsToRender.map((item) => {
                const statusConfig = getStatusBadge(item.status);
                const quantity = parseFloat(item.quantity);
                const minStock = parseFloat(item.min_stock || "0");
                return (
                  <TableRow
                    key={item.id}
                    className="hover-elevate"
                    data-testid={`row-warehouse-${item.id}`}
                  >
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      <span className={item.status === "critical" || item.status === "low" ? "text-destructive font-semibold" : "font-semibold"}>
                        {quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.location || "—"}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {minStock} {item.unit}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusConfig.variant} className="gap-1 text-xs">
                        {(item.status === "critical" || item.status === "low") && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        data-testid={`button-qr-${item.id}`}
                      >
                        <QrCode className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

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

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по названию или артикулу..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-warehouse"
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            Все товары ({filteredItems.length})
          </TabsTrigger>
          <TabsTrigger value="materials">
            Материалы ({filteredItems.filter(i => i.category === "materials").length})
          </TabsTrigger>
          <TabsTrigger value="products">
            Готовая продукция ({filteredItems.filter(i => i.category === "products").length})
          </TabsTrigger>
          <TabsTrigger value="alerts">
            Требуют внимания ({filteredItems.filter(i => i.status === "low" || i.status === "critical").length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <Skeleton className="h-96" data-testid="skeleton-warehouse" />
          ) : (
            renderTable(filteredItems)
          )}
        </TabsContent>
        <TabsContent value="materials" className="mt-6">
          {isLoading ? (
            <Skeleton className="h-96" data-testid="skeleton-warehouse" />
          ) : (
            renderTable(filteredItems.filter(i => i.category === "materials"))
          )}
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          {isLoading ? (
            <Skeleton className="h-96" data-testid="skeleton-warehouse" />
          ) : (
            renderTable(filteredItems.filter(i => i.category === "products"))
          )}
        </TabsContent>
        <TabsContent value="alerts" className="mt-6">
          {isLoading ? (
            <Skeleton className="h-96" data-testid="skeleton-warehouse" />
          ) : (
            renderTable(filteredItems.filter(i => i.status === "low" || i.status === "critical"))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

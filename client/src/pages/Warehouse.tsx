import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { WarehouseItemCard } from "@/components/WarehouseItemCard";
import { WarehouseItemDetailSheet } from "@/components/WarehouseItemDetailSheet";
import { WarehouseItemCreateDialog } from "@/components/WarehouseItemCreateDialog";
import type { WarehouseItem, User } from "@shared/schema";

export default function Warehouse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<WarehouseItem | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "normal" | "low" | "critical">("all");
  const { toast } = useToast();

  const { data: items = [], isLoading, error } = useQuery<WarehouseItem[]>({
    queryKey: ["/api/warehouse/items"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (error) {
    toast({
      title: "Ошибка загрузки",
      description: "Не удалось загрузить данные склада",
      variant: "destructive",
    });
  }

  const currentUserId = users[0]?.id || "";

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleItemClick = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setIsDetailSheetOpen(true);
    }
  };

  const renderGrid = (itemsToRender: WarehouseItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {itemsToRender.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground" data-testid="text-no-items">
          Ничего не найдено
        </div>
      ) : (
        itemsToRender.map((item) => (
          <WarehouseItemCard
            key={item.id}
            id={item.id}
            name={item.name}
            quantity={parseFloat(item.quantity)}
            unit={item.unit}
            location={item.location}
            category={item.category}
            status={item.status}
            minStock={parseFloat(item.min_stock || "0")}
            onClick={() => handleItemClick(item.id)}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Склад</h1>
          <p className="text-sm text-muted-foreground mt-1">Учет материалов и готовой продукции</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-warehouse-item"
          >
            <Plus className="h-4 w-4 mr-2" />
            Новая позиция
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
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="all" data-testid="filter-status-all">
              Все
            </TabsTrigger>
            <TabsTrigger value="normal" data-testid="filter-status-normal">
              Норма
            </TabsTrigger>
            <TabsTrigger value="low" data-testid="filter-status-low">
              Низкий
            </TabsTrigger>
            <TabsTrigger value="critical" data-testid="filter-status-critical">
              Критический
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-category-all">
            Все ({filteredItems.length})
          </TabsTrigger>
          <TabsTrigger value="materials" data-testid="tab-category-materials">
            Материалы ({filteredItems.filter(i => i.category === "materials").length})
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-category-products">
            Готовая продукция ({filteredItems.filter(i => i.category === "products").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64" data-testid={`skeleton-warehouse-${i}`} />
              ))}
            </div>
          ) : (
            renderGrid(filteredItems)
          )}
        </TabsContent>

        <TabsContent value="materials" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" data-testid={`skeleton-warehouse-${i}`} />
              ))}
            </div>
          ) : (
            renderGrid(filteredItems.filter(i => i.category === "materials"))
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64" data-testid={`skeleton-warehouse-${i}`} />
              ))}
            </div>
          ) : (
            renderGrid(filteredItems.filter(i => i.category === "products"))
          )}
        </TabsContent>
      </Tabs>

      <WarehouseItemDetailSheet
        item={selectedItem}
        open={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
        currentUserId={currentUserId}
      />

      <WarehouseItemCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

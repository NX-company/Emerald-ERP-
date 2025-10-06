import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, MapPin } from "lucide-react";

interface WarehouseItemCardProps {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  location: string;
  status: "normal" | "low" | "critical";
  minStock: number;
}

export function WarehouseItemCard({ id, name, quantity, unit, location, status, minStock }: WarehouseItemCardProps) {
  const statusConfig = {
    normal: { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30" },
    low: { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    critical: { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
  };

  const config = statusConfig[status];

  return (
    <Card className="hover-elevate active-elevate-2" data-testid={`card-warehouse-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{name}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{location}</span>
            </div>
          </div>
          <div className={`flex items-center justify-center w-12 h-12 rounded ${config.bg}`}>
            <Package className={`h-6 w-6 ${config.color}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Остаток</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">{quantity}</span>
            <span className="text-sm text-muted-foreground">{unit}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <span className="text-muted-foreground">Мин. остаток: {minStock} {unit}</span>
          {status !== "normal" && (
            <Badge variant={status === "critical" ? "destructive" : "secondary"} className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {status === "critical" ? "Критический" : "Низкий"}
            </Badge>
          )}
        </div>

        <Badge variant="outline" className="text-xs font-mono w-full justify-center">
          Артикул #{id}
        </Badge>
      </CardContent>
    </Card>
  );
}

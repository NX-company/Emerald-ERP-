import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Shipments() {
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "confirmed" | "cancelled">("all");

  const { data: shipments = [] } = useQuery<any[]>({
    queryKey: ["/api/shipments"],
  });

  const filteredShipments = statusFilter === "all"
    ? shipments
    : shipments.filter((s) => s.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Черновик</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500">Подтверждено</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Отменено</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Накладные</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Архив всех отгрузок товаров
          </p>
        </div>
        <Button onClick={() => window.location.href = "/shipments/new"}>
          <Plus className="h-4 w-4 mr-2" />
          Новая отгрузка
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Все ({shipments.length})</TabsTrigger>
          <TabsTrigger value="draft">
            Черновики ({shipments.filter((s) => s.status === "draft").length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Подтверждено ({shipments.filter((s) => s.status === "confirmed").length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Отменено ({shipments.filter((s) => s.status === "cancelled").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              Нет накладных
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Номер</TableHead>
                    <TableHead>Проект</TableHead>
                    <TableHead>Кладовщик</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.map((shipment) => (
                    <TableRow key={shipment.id}>
                      <TableCell className="font-mono font-semibold">
                        {shipment.shipment_number}
                      </TableCell>
                      <TableCell>{shipment.project_name}</TableCell>
                      <TableCell>{shipment.warehouse_keeper}</TableCell>
                      <TableCell>{getStatusBadge(shipment.status)}</TableCell>
                      <TableCell>
                        {format(new Date(shipment.created_at), "dd MMM yyyy HH:mm", {
                          locale: ru,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/shipments/${shipment.id}`}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

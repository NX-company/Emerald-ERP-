import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List } from "lucide-react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { DealCard } from "@/components/DealCard";

export default function Sales() {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  // todo: remove mock functionality
  const deals = [
    {
      id: "1234",
      clientName: "Александр Сергеев",
      company: "ООО Интерьер Плюс",
      amount: 450000,
      deadline: "15.11.2025",
      manager: "Мария Петрова",
      tags: ["Кухня", "VIP"],
      stage: "new",
    },
    {
      id: "1235",
      clientName: "Елена Иванова",
      company: "ИП Иванова Е.А.",
      amount: 280000,
      deadline: "20.11.2025",
      manager: "Иван Сидоров",
      tags: ["Шкаф"],
      stage: "new",
    },
    {
      id: "1236",
      clientName: "Дмитрий Ковалев",
      company: "ООО Дизайн Студия",
      amount: 620000,
      deadline: "18.11.2025",
      manager: "Мария Петрова",
      tags: ["Гостиная", "Кухня"],
      stage: "meeting",
    },
    {
      id: "1237",
      clientName: "Ольга Смирнова",
      company: "ИП Смирнова О.В.",
      amount: 185000,
      deadline: "12.11.2025",
      manager: "Иван Сидоров",
      tags: ["Прихожая"],
      stage: "proposal",
    },
  ];

  const kanbanColumns = [
    {
      id: "new",
      title: "Новые",
      count: deals.filter((d) => d.stage === "new").length,
      items: deals
        .filter((d) => d.stage === "new")
        .map((deal) => <DealCard key={deal.id} {...deal} />),
    },
    {
      id: "meeting",
      title: "Встреча назначена",
      count: deals.filter((d) => d.stage === "meeting").length,
      items: deals
        .filter((d) => d.stage === "meeting")
        .map((deal) => <DealCard key={deal.id} {...deal} />),
    },
    {
      id: "proposal",
      title: "КП отправлено",
      count: deals.filter((d) => d.stage === "proposal").length,
      items: deals
        .filter((d) => d.stage === "proposal")
        .map((deal) => <DealCard key={deal.id} {...deal} />),
    },
    {
      id: "contract",
      title: "Договор",
      count: 0,
      items: [],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Продажи (CRM)</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление заказами клиентов</p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
            <TabsList>
              <TabsTrigger value="kanban" data-testid="button-view-kanban">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" data-testid="button-view-list">
                <List className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button data-testid="button-create-deal">
            <Plus className="h-4 w-4 mr-2" />
            Новая сделка
          </Button>
        </div>
      </div>

      {view === "kanban" ? (
        <KanbanBoard columns={kanbanColumns} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <DealCard key={deal.id} {...deal} />
          ))}
        </div>
      )}
    </div>
  );
}

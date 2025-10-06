import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List } from "lucide-react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { DealCard } from "@/components/DealCard";
import { DealDetailSheet } from "@/components/DealDetailSheet";
import { DealCreateDialog } from "@/components/DealCreateDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Deal, User } from "@shared/schema";
import { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Sales() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: deals = [], isLoading: dealsLoading, error: dealsError } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  if (dealsError) {
    toast({
      title: "Ошибка загрузки",
      description: "Не удалось загрузить сделки",
      variant: "destructive",
    });
  }

  const isLoading = dealsLoading || usersLoading;

  const getUserName = (userId: string | null) => {
    if (!userId) return "Не назначен";
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.username || "Не назначен";
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Не установлен";
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const transformedDeals = deals.map(deal => ({
    id: deal.id,
    clientName: deal.client_name,
    company: deal.company || "",
    amount: parseFloat(deal.amount || "0"),
    deadline: formatDate(deal.deadline),
    manager: getUserName(deal.manager_id),
    tags: deal.tags || [],
    stage: deal.stage,
  }));

  const updateDealStageMutation = useMutation({
    mutationFn: async ({ dealId, newStage }: { dealId: string; newStage: string }) => {
      return await apiRequest("PUT", `/api/deals/${dealId}`, { stage: newStage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    },
    onError: (error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Ошибка",
        description: "Не удалось переместить сделку. Попробуйте снова.",
        variant: "destructive",
      });
    },
  });

  const handleDealClick = (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      setSelectedDeal(deal);
      setIsDetailSheetOpen(true);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeDeal = deals.find(d => d.id === activeId);
    
    if (!activeDeal) {
      setActiveId(null);
      return;
    }

    const columns = ["new", "meeting", "proposal", "contract", "won", "lost"];
    const newStage = columns.find(col => overId === col || deals.find(d => d.id === overId && d.stage === col));

    if (newStage && newStage !== activeDeal.stage) {
      const previousDeals = [...deals];
      
      queryClient.setQueryData(["/api/deals"], (oldDeals: Deal[] | undefined) => {
        if (!oldDeals) return oldDeals;
        return oldDeals.map(deal => 
          deal.id === activeId ? { ...deal, stage: newStage as any } : deal
        );
      });

      updateDealStageMutation.mutate(
        { dealId: activeId, newStage },
        {
          onError: () => {
            queryClient.setQueryData(["/api/deals"], previousDeals);
          }
        }
      );
    }

    setActiveId(null);
  };

  const activeDeal = activeId ? transformedDeals.find(d => d.id === activeId) : null;

  const kanbanColumns = [
    {
      id: "new",
      title: "Новые",
      count: transformedDeals.filter((d) => d.stage === "new").length,
      items: transformedDeals
        .filter((d) => d.stage === "new")
        .map((deal) => ({
          id: deal.id,
          content: <DealCard key={deal.id} {...deal} onClick={() => handleDealClick(deal.id)} />
        })),
    },
    {
      id: "meeting",
      title: "Встреча назначена",
      count: transformedDeals.filter((d) => d.stage === "meeting").length,
      items: transformedDeals
        .filter((d) => d.stage === "meeting")
        .map((deal) => ({
          id: deal.id,
          content: <DealCard key={deal.id} {...deal} onClick={() => handleDealClick(deal.id)} />
        })),
    },
    {
      id: "proposal",
      title: "КП отправлено",
      count: transformedDeals.filter((d) => d.stage === "proposal").length,
      items: transformedDeals
        .filter((d) => d.stage === "proposal")
        .map((deal) => ({
          id: deal.id,
          content: <DealCard key={deal.id} {...deal} onClick={() => handleDealClick(deal.id)} />
        })),
    },
    {
      id: "contract",
      title: "Договор",
      count: transformedDeals.filter((d) => d.stage === "contract").length,
      items: transformedDeals
        .filter((d) => d.stage === "contract")
        .map((deal) => ({
          id: deal.id,
          content: <DealCard key={deal.id} {...deal} onClick={() => handleDealClick(deal.id)} />
        })),
    },
    {
      id: "won",
      title: "Выиграно",
      count: transformedDeals.filter((d) => d.stage === "won").length,
      items: transformedDeals
        .filter((d) => d.stage === "won")
        .map((deal) => ({
          id: deal.id,
          content: <DealCard key={deal.id} {...deal} onClick={() => handleDealClick(deal.id)} />
        })),
    },
    {
      id: "lost",
      title: "Проиграно",
      count: transformedDeals.filter((d) => d.stage === "lost").length,
      items: transformedDeals
        .filter((d) => d.stage === "lost")
        .map((deal) => ({
          id: deal.id,
          content: <DealCard key={deal.id} {...deal} onClick={() => handleDealClick(deal.id)} />
        })),
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
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-deal">
            <Plus className="h-4 w-4 mr-2" />
            Новая сделка
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64" data-testid={`skeleton-deal-${i}`} />
          ))}
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard 
          columns={kanbanColumns}
          activeId={activeId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          activeItem={activeDeal ? <DealCard {...activeDeal} /> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformedDeals.map((deal) => (
            <DealCard key={deal.id} {...deal} onClick={() => handleDealClick(deal.id)} />
          ))}
        </div>
      )}

      <DealDetailSheet
        deal={selectedDeal}
        open={isDetailSheetOpen}
        onOpenChange={setIsDetailSheetOpen}
      />

      <DealCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}

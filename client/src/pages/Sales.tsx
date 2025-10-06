import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, LayoutGrid, List, Settings, Trash2, CheckSquare } from "lucide-react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { DealCard } from "@/components/DealCard";
import { DealDetailSheet } from "@/components/DealDetailSheet";
import { DealCreateDialog } from "@/components/DealCreateDialog";
import { ManageStagesDialog } from "@/components/ManageStagesDialog";
import { DealCardModal } from "@/components/DealCardModal";
import { DeleteDealDialog } from "@/components/DeleteDealDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Deal, User, DealStage } from "@shared/schema";
import { DragStartEvent, DragOverEvent, DragEndEvent } from "@dnd-kit/core";
import { apiRequest, queryClient, getCurrentUserId } from "@/lib/queryClient";

export default function Sales() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageStagesOpen, setIsManageStagesOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedDeals, setSelectedDeals] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: deals = [], isLoading: dealsLoading, error: dealsError } = useQuery<Deal[]>({
    queryKey: ["/api/deals"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: stages = [], isLoading: stagesLoading } = useQuery<DealStage[]>({
    queryKey: ["/api/deal-stages"],
  });

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users', getCurrentUserId()],
  });

  useEffect(() => {
    if (dealsError) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить сделки",
        variant: "destructive",
      });
    }
  }, [dealsError, toast]);

  const isLoading = dealsLoading || usersLoading || stagesLoading;

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
    orderNumber: deal.order_number || undefined,
    clientName: deal.client_name,
    company: deal.company || undefined,
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (dealIds: string[]) => {
      return await apiRequest("POST", "/api/deals/bulk-delete", { dealIds });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Сделки удалены",
        description: data.message || `Удалено ${selectedDeals.size} сделок`,
      });
      setSelectedDeals(new Set());
      setSelectionMode(false);
      setBulkDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить сделки",
        variant: "destructive",
      });
    },
  });

  const handleToggleSelection = (dealId: string) => {
    setSelectedDeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dealId)) {
        newSet.delete(dealId);
      } else {
        newSet.add(dealId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedDeals.size === transformedDeals.length) {
      setSelectedDeals(new Set());
    } else {
      setSelectedDeals(new Set(transformedDeals.map(d => d.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedDeals.size === 0) return;
    setBulkDeleteDialogOpen(true);
  };

  const handleDealClick = (dealId: string) => {
    setSelectedDealId(dealId);
    setModalOpen(true);
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

    const stageKeys = stages.map(s => s.key);
    const newStage = stageKeys.find(key => overId === key || deals.find(d => d.id === overId && d.stage === key));

    if (newStage && newStage !== activeDeal.stage) {
      const previousDeals = [...deals];
      
      queryClient.setQueryData(["/api/deals"], (oldDeals: Deal[] | undefined) => {
        if (!oldDeals) return oldDeals;
        return oldDeals.map(deal => 
          deal.id === activeId ? { ...deal, stage: newStage } : deal
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

  const kanbanColumns = stages.map(stage => ({
    id: stage.key,
    title: stage.name,
    color: stage.color ?? undefined,
    count: transformedDeals.filter((d) => d.stage === stage.key).length,
    items: transformedDeals
      .filter((d) => d.stage === stage.key)
      .map((deal) => ({
        id: deal.id,
        content: <DealCard key={deal.id} {...deal} onClick={() => handleDealClick(deal.id)} />
      })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">Продажи (CRM)</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">Управление заказами клиентов</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!selectionMode && (
            <>
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
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsManageStagesOpen(true)} 
                className="md:hidden"
                data-testid="button-manage-stages"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsManageStagesOpen(true)} 
                className="hidden md:flex"
                data-testid="button-manage-stages-desktop"
              >
                <Settings className="h-4 w-4 mr-2" />
                Управление этапами
              </Button>
              {currentUser?.can_delete_deals && view === "list" && (
                <Button 
                  variant="outline" 
                  onClick={() => setSelectionMode(true)} 
                  data-testid="button-enable-selection"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Выбрать</span>
                </Button>
              )}
              {currentUser?.can_create_deals && (
                <>
                  <Button 
                    size="icon"
                    onClick={() => setIsCreateDialogOpen(true)} 
                    className="md:hidden"
                    data-testid="button-create-deal"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)} 
                    className="hidden md:flex"
                    data-testid="button-create-deal-desktop"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Новая сделка
                  </Button>
                </>
              )}
            </>
          )}
          {selectionMode && (
            <>
              <Button 
                variant="outline" 
                onClick={handleSelectAll}
                data-testid="button-select-all"
              >
                {selectedDeals.size === transformedDeals.length ? "Снять все" : "Выбрать все"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedDeals(new Set());
                }}
                data-testid="button-cancel-selection"
              >
                Отмена
              </Button>
              <Button 
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={selectedDeals.size === 0}
                data-testid="button-bulk-delete"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить ({selectedDeals.size})
              </Button>
            </>
          )}
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
            <div key={deal.id} className="relative">
              {selectionMode && (
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox
                    checked={selectedDeals.has(deal.id)}
                    onCheckedChange={() => handleToggleSelection(deal.id)}
                    data-testid={`checkbox-deal-${deal.id}`}
                    className="bg-background"
                  />
                </div>
              )}
              <DealCard 
                {...deal} 
                onClick={() => !selectionMode && handleDealClick(deal.id)} 
              />
            </div>
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

      <ManageStagesDialog
        open={isManageStagesOpen}
        onOpenChange={setIsManageStagesOpen}
      />

      <DealCardModal 
        dealId={selectedDealId}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />

      <DeleteDealDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        onConfirm={() => bulkDeleteMutation.mutate(Array.from(selectedDeals))}
        dealName={`${selectedDeals.size} ${selectedDeals.size === 1 ? 'сделку' : selectedDeals.size < 5 ? 'сделки' : 'сделок'}`}
        isPending={bulkDeleteMutation.isPending}
      />
    </div>
  );
}

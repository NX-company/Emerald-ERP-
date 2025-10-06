import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, QrCode, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { insertWarehouseItemSchema, type WarehouseItem, type WarehouseTransaction, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WarehouseTransactionDialog } from "./WarehouseTransactionDialog";

interface WarehouseItemDetailSheetProps {
  item: WarehouseItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
}

export function WarehouseItemDetailSheet({ item, open, onOpenChange, currentUserId }: WarehouseItemDetailSheetProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const { toast } = useToast();

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<WarehouseTransaction[]>({
    queryKey: ["/api/warehouse/items", item?.id, "transactions"],
    enabled: !!item?.id,
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm({
    resolver: zodResolver(insertWarehouseItemSchema),
    defaultValues: {
      name: item?.name || "",
      quantity: item?.quantity || "0",
      unit: item?.unit || "шт",
      location: item?.location || "",
      category: item?.category || "materials",
      min_stock: item?.min_stock || "0",
      status: item?.status || "normal",
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        name: item.name || "",
        quantity: item.quantity || "0",
        unit: item.unit || "шт",
        location: item.location || "",
        category: item.category || "materials",
        min_stock: item.min_stock || "0",
        status: item.status || "normal",
      });
    }
  }, [item, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const itemData = {
        ...data,
        location: data.location || null,
        min_stock: data.min_stock || "0",
      };
      await apiRequest("PUT", `/api/warehouse/items/${item?.id}`, itemData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/items", item?.id] });
      toast({
        title: "Успешно",
        description: "Позиция обновлена",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/warehouse/items/${item?.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse"] });
      queryClient.invalidateQueries({ queryKey: ["/api/warehouse/items"] });
      toast({
        title: "Успешно",
        description: "Позиция удалена",
      });
      setShowDeleteDialog(false);
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    updateMutation.mutate(data);
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const getStatusBadge = (status: "normal" | "low" | "critical") => {
    const config = {
      normal: { label: "Норма", variant: "outline" as const },
      low: { label: "Низкий остаток", variant: "secondary" as const },
      critical: { label: "Критический", variant: "destructive" as const },
    };
    return config[status];
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || user?.username || "Неизвестно";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusConfig = item ? getStatusBadge(item.status) : null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle data-testid="text-warehouse-sheet-title">Детали позиции</SheetTitle>
            <SheetDescription data-testid="text-warehouse-sheet-description">
              Редактирование позиции на складе
            </SheetDescription>
          </SheetHeader>

          {item && (
            <div className="mt-4 p-3 border rounded-md bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Текущий статус</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Артикул: {item.id}
                  </p>
                </div>
                <Badge variant={statusConfig?.variant} data-testid="badge-warehouse-status">
                  {statusConfig?.label}
                </Badge>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Название позиции" 
                        data-testid="input-warehouse-item-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01"
                          placeholder="0" 
                          data-testid="input-warehouse-item-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Единица</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-warehouse-item-unit">
                            <SelectValue placeholder="Выберите единицу" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="шт" data-testid="option-item-unit-pc">шт</SelectItem>
                          <SelectItem value="кг" data-testid="option-item-unit-kg">кг</SelectItem>
                          <SelectItem value="м" data-testid="option-item-unit-m">м</SelectItem>
                          <SelectItem value="м²" data-testid="option-item-unit-m2">м²</SelectItem>
                          <SelectItem value="л" data-testid="option-item-unit-l">л</SelectItem>
                          <SelectItem value="уп" data-testid="option-item-unit-pack">уп</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Местоположение</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Например: Стеллаж А-1" 
                        data-testid="input-warehouse-item-location"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категория</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-warehouse-item-category">
                          <SelectValue placeholder="Выберите категорию" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="materials" data-testid="option-item-category-materials">
                          Материалы
                        </SelectItem>
                        <SelectItem value="products" data-testid="option-item-category-products">
                          Готовая продукция
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="min_stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Минимальный остаток</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        placeholder="0" 
                        data-testid="input-warehouse-item-min-stock"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>QR код</FormLabel>
                <div className="flex items-center gap-2 p-3 border rounded-md bg-muted">
                  <QrCode className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium" data-testid="text-warehouse-qr-code">
                      QR: {item?.id}
                    </p>
                    <p className="text-xs text-muted-foreground">Идентификатор позиции</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                  className="flex-1"
                  data-testid="button-save-warehouse-item"
                >
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={deleteMutation.isPending}
                  data-testid="button-delete-warehouse-item"
                >
                  Удалить
                </Button>
              </div>
            </form>
          </Form>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">История транзакций</CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowTransactionDialog(true)}
                  data-testid="button-add-transaction"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Транзакция
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {transactionsLoading ? (
                <div className="text-sm text-muted-foreground" data-testid="text-transactions-loading">
                  Загрузка транзакций...
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-sm text-muted-foreground" data-testid="text-no-transactions">
                  Нет транзакций
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 10)
                    .map((transaction, index) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center gap-3 p-3 border rounded-md"
                        data-testid={`transaction-item-${index}`}
                      >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          transaction.type === "in" 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        }`}>
                          {transaction.type === "in" ? (
                            <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm" data-testid={`transaction-quantity-${index}`}>
                              {transaction.type === "in" ? "+" : "-"}{transaction.quantity} {item?.unit}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {transaction.type === "in" ? "Приход" : "Расход"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {getUserName(transaction.user_id)} • {formatDate(transaction.created_at)}
                          </p>
                          {transaction.notes && (
                            <p className="text-xs text-muted-foreground mt-1" data-testid={`transaction-notes-${index}`}>
                              {transaction.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent data-testid="dialog-warehouse-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-warehouse-delete-title">
              Подтвердите удаление
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="text-warehouse-delete-description">
              Вы уверены, что хотите удалить эту позицию? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-warehouse-delete">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-warehouse-delete"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {item && (
        <WarehouseTransactionDialog
          open={showTransactionDialog}
          onOpenChange={setShowTransactionDialog}
          itemId={item.id}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}

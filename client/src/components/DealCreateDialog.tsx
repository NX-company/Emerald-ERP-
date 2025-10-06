import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { insertDealSchema, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface DealCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealCreateDialog({ open, onOpenChange }: DealCreateDialogProps) {
  const { toast } = useToast();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm({
    resolver: zodResolver(insertDealSchema),
    defaultValues: {
      client_name: "",
      company: "",
      amount: "",
      stage: "new" as const,
      deadline: "",
      manager_id: "",
      production_days_count: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const dealData = {
        ...data,
        amount: data.amount || null,
        company: data.company || null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        manager_id: data.manager_id || null,
        production_days_count: data.production_days_count ? parseInt(data.production_days_count) : null,
      };
      await apiRequest("POST", "/api/deals", dealData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      toast({
        title: "Успешно",
        description: "Сделка создана",
      });
      form.reset();
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
    createMutation.mutate(data);
  });

  const stageLabels: Record<string, string> = {
    new: "Новые",
    meeting: "Встреча назначена",
    proposal: "КП отправлено",
    contract: "Договор",
    won: "Выиграна",
    lost: "Проиграна",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">Новая сделка</DialogTitle>
          <DialogDescription data-testid="text-dialog-description">
            Создание новой сделки в CRM
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="client_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Клиент</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Имя клиента" 
                      data-testid="input-create-client-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Компания</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Название компании" 
                      data-testid="input-create-company"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      placeholder="0.00" 
                      data-testid="input-create-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Стадия</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-create-stage">
                        <SelectValue placeholder="Выберите стадию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="new" data-testid="option-create-stage-new">
                        {stageLabels.new}
                      </SelectItem>
                      <SelectItem value="meeting" data-testid="option-create-stage-meeting">
                        {stageLabels.meeting}
                      </SelectItem>
                      <SelectItem value="proposal" data-testid="option-create-stage-proposal">
                        {stageLabels.proposal}
                      </SelectItem>
                      <SelectItem value="contract" data-testid="option-create-stage-contract">
                        {stageLabels.contract}
                      </SelectItem>
                      <SelectItem value="won" data-testid="option-create-stage-won">
                        {stageLabels.won}
                      </SelectItem>
                      <SelectItem value="lost" data-testid="option-create-stage-lost">
                        {stageLabels.lost}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Срок</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="datetime-local" 
                      data-testid="input-create-deadline"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="manager_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Менеджер</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-create-manager">
                        <SelectValue placeholder="Выберите менеджера" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem 
                          key={user.id} 
                          value={user.id}
                          data-testid={`option-create-manager-${user.id}`}
                        >
                          {user.full_name || user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="production_days_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сроки изготовления в рабочих днях</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="1"
                      placeholder="Количество рабочих дней" 
                      data-testid="input-create-production-days"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
                data-testid="button-cancel-create"
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="flex-1"
                data-testid="button-submit-create"
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Создать
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

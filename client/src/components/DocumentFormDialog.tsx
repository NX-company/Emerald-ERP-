import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DealDocument } from "@shared/schema";

const positionSchema = z.object({
  name: z.string().min(1, "Введите название"),
  price: z.coerce.number().min(0, "Цена должна быть больше 0"),
  quantity: z.coerce.number().min(1, "Количество должно быть больше 0"),
});

const documentFormSchema = z.object({
  name: z.string().min(1, "Введите название документа"),
  positions: z.array(positionSchema).min(1, "Добавьте хотя бы одну позицию"),
  is_signed: z.boolean().optional(),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

interface DocumentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  documentType: 'quote' | 'invoice' | 'contract';
  documentId?: string; // For editing existing document
  onSuccess?: () => void;
}

const documentTypeLabels = {
  quote: "КП",
  invoice: "Счёт",
  contract: "Договор"
};

export function DocumentFormDialog({
  open,
  onOpenChange,
  dealId,
  documentType,
  documentId,
  onSuccess
}: DocumentFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!documentId;

  const { data: existingDocuments = [] } = useQuery<DealDocument[]>({
    queryKey: ['/api/deals', dealId, 'documents'],
    enabled: open && documentType === 'quote',
  });

  const { data: editingDocument } = useQuery<DealDocument | undefined>({
    queryKey: ['/api/deals', dealId, 'documents', documentId],
    queryFn: async () => {
      const docs = await apiRequest('GET', `/api/deals/${dealId}/documents`) as unknown as DealDocument[];
      return docs.find((doc: DealDocument) => doc.id === documentId);
    },
    enabled: open && isEditing,
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: "",
      positions: [{ name: "", price: 0, quantity: 1 }],
      is_signed: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "positions",
  });

  // Load existing document data when editing
  useEffect(() => {
    if (editingDocument && open) {
      const docData = editingDocument.data as any;
      const positions = docData?.positions || [{ name: "", price: 0, quantity: 1 }];
      form.reset({
        name: editingDocument.name,
        positions: positions.map((pos: any) => ({
          name: pos.name,
          price: pos.price,
          quantity: pos.quantity,
        })),
        is_signed: editingDocument.is_signed || false,
      });
    } else if (!isEditing && open) {
      form.reset({
        name: "",
        positions: [{ name: "", price: 0, quantity: 1 }],
        is_signed: false,
      });
    }
  }, [editingDocument, open, isEditing, form]);

  const positions = form.watch("positions");
  
  const calculateTotal = (price: number, quantity: number) => {
    return price * quantity;
  };

  const grandTotal = positions.reduce((sum, pos) => {
    return sum + calculateTotal(pos.price || 0, pos.quantity || 1);
  }, 0);

  const saveDocument = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      const positionsWithTotal = data.positions.map(pos => ({
        ...pos,
        total: calculateTotal(pos.price, pos.quantity)
      }));

      if (isEditing && documentId) {
        // Update existing document
        return await apiRequest('PUT', `/api/deals/${dealId}/documents/${documentId}`, {
          name: data.name,
          data: { positions: positionsWithTotal },
          total_amount: grandTotal.toString(),
          is_signed: documentType === 'contract' ? data.is_signed : undefined,
        });
      } else {
        // Create new document
        let version = 1;
        if (documentType === 'quote') {
          const quoteDocuments = existingDocuments.filter(
            (doc) => doc.document_type === 'quote'
          );
          const maxVersion = quoteDocuments.reduce(
            (max, doc) => Math.max(max, doc.version || 0),
            0
          );
          version = maxVersion + 1;
        }

        return await apiRequest('POST', `/api/deals/${dealId}/documents`, {
          document_type: documentType,
          name: data.name,
          version: version,
          file_url: `placeholder-${Date.now()}`,
          data: { positions: positionsWithTotal },
          total_amount: grandTotal.toString(),
          is_signed: documentType === 'contract' ? data.is_signed : false,
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: isEditing ? `${documentTypeLabels[documentType]} обновлён` : `${documentTypeLabels[documentType]} создан`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'documents'] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || `Не удалось ${isEditing ? 'обновить' : 'создать'} документ`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: DocumentFormData) => {
    saveDocument.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid={`dialog-${isEditing ? 'edit' : 'create'}-${documentType}`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Редактировать' : 'Создать'} {documentTypeLabels[documentType]}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название документа</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={`Введите название ${documentTypeLabels[documentType]}`}
                      data-testid="input-document-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex justify-between items-center mb-2">
                <FormLabel>Позиции</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", price: 0, quantity: 1 })}
                  data-testid="button-add-position"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Добавить позицию
                </Button>
              </div>

              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Название</TableHead>
                      <TableHead className="w-32">Цена</TableHead>
                      <TableHead className="w-32">Кол-во</TableHead>
                      <TableHead className="w-32">Итого</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id} data-testid={`position-row-${index}`}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`positions.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Название позиции"
                                    data-testid={`input-position-name-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`positions.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0"
                                    data-testid={`input-position-price-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`positions.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    data-testid={`input-position-quantity-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell data-testid={`text-position-total-${index}`}>
                          {calculateTotal(
                            positions[index]?.price || 0,
                            positions[index]?.quantity || 1
                          ).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                            data-testid={`button-remove-position-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="text-lg font-semibold" data-testid="text-grand-total">
                Итого: {grandTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₽
              </div>
            </div>

            {documentType === 'contract' && (
              <FormField
                control={form.control}
                name="is_signed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-is-signed"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Подписан</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={saveDocument.isPending}
                data-testid="button-submit"
              >
                {saveDocument.isPending ? (isEditing ? "Сохранение..." : "Создание...") : (isEditing ? "Сохранить" : "Создать")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

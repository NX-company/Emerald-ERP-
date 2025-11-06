import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Image as ImageIcon, X, ZoomIn } from "lucide-react";
import { apiRequest, queryClient, getCurrentUserId } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DealDocument } from "@shared/schema";

const positionSchema = z.object({
  name: z.string().min(1, "Введите название"),
  price: z.coerce.number().min(0, "Цена должна быть больше 0"),
  quantity: z.coerce.number().min(1, "Количество должно быть больше 0"),
  unit: z.string().default("шт"),
  imageUrl: z.string().optional(),
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
  const [imagePreview, setImagePreview] = useState<{ url: string; index: number } | null>(null);
  const positionRefs = useRef<(HTMLTableRowElement | null)[]>([]);

  const { data: existingDocuments = [] } = useQuery<DealDocument[]>({
    queryKey: ['/api/deals', dealId, 'documents'],
    enabled: open && documentType === 'quote',
  });

  const { data: editingDocument } = useQuery<DealDocument | undefined>({
    queryKey: ['/api/deals', dealId, 'documents', documentId],
    queryFn: async () => {
      // Force bypass HTTP cache to always get fresh data
      const response = await fetch(`/api/deals/${dealId}/documents`, {
        method: 'GET',
        headers: {
          'X-User-Id': getCurrentUserId(),
          'Content-Type': 'application/json'
        },
        cache: 'no-cache', // Critical: bypass browser HTTP cache
        credentials: 'include'
      });
      const docs = await response.json() as DealDocument[];
      return docs.find((doc: DealDocument) => doc.id === documentId);
    },
    enabled: open && isEditing,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      name: "",
      positions: [{ name: "", price: 0, quantity: 1, unit: "шт", imageUrl: undefined }],
      is_signed: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "positions",
  });

  // Load existing document data when editing
  useEffect(() => {
    // When opening dialog for editing, invalidate the documents cache first
    // to ensure we get fresh data
    if (open && isEditing && documentId) {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'documents'] });
    }

    if (editingDocument && open) {
      // Parse data from JSON string
      const docData = typeof editingDocument.data === 'string'
        ? JSON.parse(editingDocument.data)
        : editingDocument.data as any;
      const positions = docData?.positions || [{ name: "", price: 0, quantity: 1, unit: "шт", imageUrl: undefined }];
      form.reset({
        name: editingDocument.name,
        positions: positions.map((pos: any) => ({
          name: pos.name,
          price: pos.price,
          quantity: pos.quantity,
          unit: pos.unit || "шт", // Default to "шт" for old documents
          imageUrl: pos.imageUrl || undefined,
        })),
        is_signed: editingDocument.is_signed || false,
      });
    } else if (!isEditing && open) {
      form.reset({
        name: "",
        positions: [{ name: "", price: 0, quantity: 1, unit: "шт", imageUrl: undefined }],
        is_signed: false,
      });
    }
  }, [editingDocument, open, isEditing, form, documentId, dealId, queryClient]);

  const positions = form.watch("positions");
  
  const calculateTotal = (price: number, quantity: number) => {
    return price * quantity;
  };

  const grandTotal = positions.reduce((sum, pos) => {
    return sum + calculateTotal(pos.price || 0, pos.quantity || 1);
  }, 0);

  // Handle paste image from clipboard
  const handlePasteImage = async (event: React.ClipboardEvent, index: number) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        event.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          form.setValue(`positions.${index}.imageUrl`, base64);
          toast({
            title: "Изображение добавлено",
            description: "Изображение успешно вставлено из буфера обмена",
          });
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    form.setValue(`positions.${index}.imageUrl`, undefined);
    toast({
      title: "Изображение удалено",
    });
  };

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
          data: JSON.stringify({ positions: positionsWithTotal }),
          total_amount: grandTotal,
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
          data: JSON.stringify({ positions: positionsWithTotal }),
          total_amount: grandTotal,
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
                  onClick={() => append({ name: "", price: 0, quantity: 1, unit: "шт", imageUrl: undefined })}
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
                      <TableHead className="w-24">Кол-во</TableHead>
                      <TableHead className="w-24">Ед.изм.</TableHead>
                      <TableHead className="w-32">Итого</TableHead>
                      <TableHead className="w-20">Фото</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow
                        key={field.id}
                        data-testid={`position-row-${index}`}
                        ref={(el) => (positionRefs.current[index] = el)}
                        onPaste={(e) => handlePasteImage(e, index)}
                        tabIndex={-1}
                      >
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
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`positions.${index}.unit`}
                            render={({ field }) => (
                              <FormItem>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue="шт">
                                  <FormControl>
                                    <SelectTrigger data-testid={`select-position-unit-${index}`}>
                                      <SelectValue placeholder="шт" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="шт">шт</SelectItem>
                                    <SelectItem value="м²">м²</SelectItem>
                                    <SelectItem value="м.п.">м.п.</SelectItem>
                                    <SelectItem value="м">м</SelectItem>
                                    <SelectItem value="кг">кг</SelectItem>
                                    <SelectItem value="л">л</SelectItem>
                                    <SelectItem value="уп">уп</SelectItem>
                                  </SelectContent>
                                </Select>
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
                          <div className="flex items-center justify-center gap-1">
                            {positions[index]?.imageUrl ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setImagePreview({ url: positions[index].imageUrl!, index })}
                                  className="relative w-8 h-8 rounded border hover:border-primary transition-colors"
                                >
                                  <img
                                    src={positions[index].imageUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded"
                                  />
                                  <ZoomIn className="absolute inset-0 m-auto w-4 h-4 text-white opacity-0 hover:opacity-100 transition-opacity" />
                                </button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleRemoveImage(index)}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <ImageIcon className="w-3 h-3" />
                                Ctrl+V
                              </div>
                            )}
                          </div>
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

      {/* Image Preview Dialog */}
      {imagePreview && (
        <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Изображение позиции</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center p-4">
              <img
                src={imagePreview.url}
                alt="Preview"
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImagePreview(null)}>
                Закрыть
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleRemoveImage(imagePreview.index);
                  setImagePreview(null);
                }}
              >
                Удалить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

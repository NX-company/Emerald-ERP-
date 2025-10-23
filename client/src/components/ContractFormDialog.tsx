import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Upload, FileText, Trash2, Eye } from "lucide-react";
import { apiRequest, queryClient, getCurrentUserId } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DealDocument } from "@shared/schema";

const contractFormSchema = z.object({
  name: z.string().min(1, "Введите название договора"),
  is_signed: z.boolean().optional(),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  contractId?: string; // For editing existing contract
  onSuccess?: () => void;
}

export function ContractFormDialog({
  open,
  onOpenChange,
  dealId,
  contractId,
  onSuccess
}: ContractFormDialogProps) {
  const { toast } = useToast();
  const isEditing = !!contractId;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: existingDocuments = [] } = useQuery<DealDocument[]>({
    queryKey: ['/api/deals', dealId, 'documents'],
    enabled: open,
  });

  const { data: editingContract } = useQuery<DealDocument | undefined>({
    queryKey: ['/api/deals', dealId, 'documents', contractId],
    queryFn: async () => {
      const docs = await apiRequest<DealDocument[]>('GET', `/api/deals/${dealId}/documents`);
      return docs.find((doc: DealDocument) => doc.id === contractId);
    },
    enabled: open && isEditing,
  });

  const form = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      name: "",
      is_signed: false,
    },
  });

  // Load existing contract data when editing
  useEffect(() => {
    if (editingContract && open) {
      form.reset({
        name: editingContract.name,
        is_signed: editingContract.is_signed || false,
      });
      setExistingFileUrl(editingContract.file_url);
      setUploadedFile(null);
    } else if (!isEditing && open) {
      form.reset({
        name: "",
        is_signed: false,
      });
      setExistingFileUrl(null);
      setUploadedFile(null);
    }
  }, [editingContract, open, isEditing, form]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(pdf|docx|doc)$/i)) {
      toast({
        title: "Неверный формат файла",
        description: "Пожалуйста, загрузите PDF или DOCX файл",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "Файл слишком большой",
        description: "Максимальный размер файла: 10 МБ",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    setUploadedFile(file);
    event.target.value = '';
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (!isEditing) {
      setExistingFileUrl(null);
    }
  };

  const saveContract = useMutation({
    mutationFn: async (data: ContractFormData) => {
      console.log('[ContractFormDialog] Starting save contract...');
      console.log('[ContractFormDialog] uploadedFile:', uploadedFile?.name);
      console.log('[ContractFormDialog] existingFileUrl:', existingFileUrl);

      let fileUrl = existingFileUrl;

      // Upload new file if selected
      if (uploadedFile) {
        console.log('[ContractFormDialog] Uploading file:', uploadedFile.name);
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', uploadedFile);

          const uploadResponse = await fetch('/api/objects/upload', {
            method: 'POST',
            headers: {
              'X-User-Id': getCurrentUserId(),
            },
            body: formData,
          });

          console.log('[ContractFormDialog] Upload response status:', uploadResponse.status);

          if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();
            console.error('[ContractFormDialog] Upload failed:', errorText);
            throw new Error('Failed to upload file');
          }

          const uploadData = await uploadResponse.json();
          console.log('[ContractFormDialog] Upload successful, objectPath:', uploadData.objectPath);
          fileUrl = uploadData.objectPath;
        } catch (error) {
          console.error('[ContractFormDialog] Upload error:', error);
          throw new Error('Ошибка загрузки файла');
        } finally {
          setIsUploading(false);
        }
      }

      // Validate that we have a file URL
      if (!fileUrl) {
        console.error('[ContractFormDialog] No file URL available!');
        throw new Error('Необходимо загрузить файл договора');
      }

      console.log('[ContractFormDialog] Final fileUrl:', fileUrl);

      if (isEditing && contractId) {
        // Update existing contract
        console.log('[ContractFormDialog] Updating contract:', contractId);
        return await apiRequest('PUT', `/api/deals/${dealId}/documents/${contractId}`, {
          name: data.name,
          file_url: fileUrl,
          is_signed: data.is_signed,
        });
      } else {
        // Create new contract
        let version = 1;
        const contractDocuments = existingDocuments.filter(
          (doc) => doc.document_type === 'contract'
        );
        const maxVersion = contractDocuments.reduce(
          (max, doc) => Math.max(max, doc.version || 0),
          0
        );
        version = maxVersion + 1;

        console.log('[ContractFormDialog] Creating new contract, version:', version);
        const payload = {
          document_type: 'contract',
          name: data.name,
          version: version,
          file_url: fileUrl,
          data: null,
          total_amount: null,
          is_signed: data.is_signed || false,
        };
        console.log('[ContractFormDialog] Create payload:', payload);

        return await apiRequest('POST', `/api/deals/${dealId}/documents`, payload);
      }
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: isEditing ? "Договор обновлён" : "Договор создан",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/activity-logs', 'deal', dealId] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || `Не удалось ${isEditing ? 'обновить' : 'создать'} договор`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: ContractFormData) => {
    // Validate file presence for new contracts
    if (!isEditing && !uploadedFile) {
      toast({
        title: "Требуется файл",
        description: "Пожалуйста, загрузите PDF или DOCX файл договора",
        variant: "destructive",
      });
      return;
    }

    saveContract.mutate(data);
  };

  const handleViewFile = () => {
    if (existingFileUrl) {
      window.open(existingFileUrl, '_blank');
    }
  };

  const hasFile = uploadedFile || existingFileUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" data-testid={`dialog-${isEditing ? 'edit' : 'create'}-contract`}>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Редактировать' : 'Создать'} Договор</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название договора</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Введите название договора"
                      data-testid="input-contract-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Файл договора (PDF или DOCX)</FormLabel>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-contract-file"
              />

              {!hasFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  data-testid="dropzone-contract-file"
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Нажмите, чтобы загрузить файл
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF или DOCX, до 10 МБ
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg p-4 flex items-center gap-3" data-testid="file-preview">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {uploadedFile ? uploadedFile.name : existingFileUrl?.split('/').pop() || 'Договор'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedFile
                        ? `${(uploadedFile.size / 1024).toFixed(1)} KB`
                        : 'Загружен'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {existingFileUrl && !uploadedFile && (
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleViewFile}
                        data-testid="button-view-file"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={removeFile}
                      data-testid="button-remove-file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!hasFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-select-file"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Выбрать файл
                </Button>
              )}
            </div>

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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveContract.isPending || isUploading}
                data-testid="button-cancel"
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={saveContract.isPending || isUploading}
                data-testid="button-submit"
              >
                {isUploading
                  ? "Загрузка файла..."
                  : saveContract.isPending
                    ? (isEditing ? "Сохранение..." : "Создание...")
                    : (isEditing ? "Сохранить" : "Создать")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

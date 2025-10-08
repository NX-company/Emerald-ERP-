import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, Building2, DollarSign, MessageSquare, CheckSquare, Activity, Brain, Plus, FolderOpen, FileText, Trash2, Sparkles } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { apiRequest, queryClient, getCurrentUserId } from "@/lib/queryClient";
import { DocumentFormDialog } from "@/components/DocumentFormDialog";
import { DeleteDealDialog } from "@/components/DeleteDealDialog";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { useToast } from "@/hooks/use-toast";
import type { Deal, DealMessage, InsertDealMessage, DealDocument, User, DealStage, DealAttachment, Project } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import { DealCustomFields } from "@/components/DealCustomFields";
import { AllDocumentsDialog } from "@/components/AllDocumentsDialog";
import type { UploadResult } from "@uppy/core";
import { X, Download } from "lucide-react";
import { useLocation } from "wouter";
import { AiAssistantDialog } from "@/components/AiAssistantDialog";

interface DealCardModalProps {
  dealId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealCardModal({ dealId, open, onOpenChange }: DealCardModalProps) {
  const { data: deal, isLoading } = useQuery<Deal>({
    queryKey: ['/api/deals', dealId],
    enabled: !!dealId && open,
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<DealMessage[]>({
    queryKey: ['/api/deals', dealId, 'messages'],
    enabled: !!dealId && open,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery<DealDocument[]>({
    queryKey: ['/api/deals', dealId, 'documents'],
    enabled: !!dealId && open,
  });

  const { data: stages = [] } = useQuery<DealStage[]>({
    queryKey: ['/api/deal-stages'],
    enabled: open,
  });

  const { data: attachments = [] } = useQuery<DealAttachment[]>({
    queryKey: ['/api/deals', dealId, 'attachments'],
    enabled: !!dealId && open,
  });

  const { data: existingProject } = useQuery<Project>({
    queryKey: [`/api/projects/by-deal/${dealId}`],
    enabled: !!dealId && open,
  });

  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<"note" | "call" | "email" | "task">("note");
  
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [allDocumentsDialogOpen, setAllDocumentsDialogOpen] = useState(false);
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false);
  const [editingDocumentId, setEditingDocumentId] = useState<string | undefined>();
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/users', getCurrentUserId()],
    enabled: open,
  });

  // Логика воркфлоу
  const hasQuote = documents.some(doc => doc.document_type === 'quote');
  const hasSignedContract = documents.some(
    doc => doc.document_type === 'contract' && doc.is_signed
  );

  const quotes = documents.filter(doc => doc.document_type === 'quote');
  const invoices = documents.filter(doc => doc.document_type === 'invoice');
  const contracts = documents.filter(doc => doc.document_type === 'contract');

  const createMessage = useMutation({
    mutationFn: async (data: { message_type: "note" | "call" | "email" | "task"; content: string }) => {
      return await apiRequest('POST', `/api/deals/${dealId}/messages`, {
        ...data,
        author_id: getCurrentUserId()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'messages'] });
      setMessageText("");
    },
  });

  const deleteDeal = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/deals/${dealId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      toast({
        title: "Сделка удалена",
        description: "Сделка успешно удалена",
      });
      setDeleteDialogOpen(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить сделку",
        variant: "destructive",
      });
    },
  });

  const updateStage = useMutation({
    mutationFn: async (stage: string) => {
      return await apiRequest('PUT', `/api/deals/${dealId}`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId] });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      toast({
        title: "Этап обновлён",
        description: "Этап сделки успешно изменён",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить этап",
        variant: "destructive",
      });
    },
  });

  const deleteAttachment = useMutation({
    mutationFn: async (attachmentId: string) => {
      return await apiRequest('DELETE', `/api/deals/${dealId}/attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'attachments'] });
      toast({
        title: "Файл удалён",
        description: "Файл успешно удалён",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось удалить файл",
        variant: "destructive",
      });
    },
  });

  const createProjectFromInvoice = useMutation<Project, Error, { invoiceId: string; selectedPositions: number[]; editedPositions: any[]; positionStagesData: any }>({
    mutationFn: async ({ invoiceId, selectedPositions, editedPositions, positionStagesData }) => {
      const response = await apiRequest('POST', '/api/projects/from-invoice', {
        dealId,
        invoiceId,
        selectedPositions,
        editedPositions,
        positionStagesData,
      });
      return response as unknown as Project;
    },
    onSuccess: (project: Project) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/by-deal/${dealId}`] });
      toast({
        title: "Проект создан",
        description: "Проект успешно создан из счёта",
      });
      setCreateProjectDialogOpen(false);
      onOpenChange(false);
      setLocation(`/projects/${project.id}`);
    },
    onError: (error: any) => {
      let errorMessage = "Не удалось создать проект";
      
      if (error.message?.includes("Project already exists for this deal")) {
        errorMessage = "Проект для этой сделки уже создан";
      } else if (error.message?.includes("Document is not an invoice")) {
        errorMessage = "Выбран не счёт";
      }
      
      toast({
        title: "Ошибка",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const [uploadParametersMap, setUploadParametersMap] = useState<Record<string, string>>({});

  const handleGetUploadParameters = async () => {
    const response: any = await apiRequest('POST', '/api/objects/upload', {});
    // Store objectPath for later use, keyed by uploadURL
    setUploadParametersMap(prev => ({
      ...prev,
      [response.uploadURL]: response.objectPath
    }));
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const handleUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful || result.successful.length === 0) return;

    for (const file of result.successful) {
      const uploadURL = (file as any).uploadURL;
      const objectPath = uploadParametersMap[uploadURL];
      
      await apiRequest('POST', `/api/deals/${dealId}/attachments`, {
        deal_id: dealId,
        file_name: file.name,
        file_path: objectPath || uploadURL,
        file_size: file.size || 0,
        mime_type: file.type || 'application/octet-stream',
        uploaded_by: getCurrentUserId(),
      });
    }

    // Clear upload parameters map
    setUploadParametersMap({});
    
    queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'attachments'] });
    toast({
      title: "Файлы загружены",
      description: `Загружено ${result.successful.length} файл(ов)`,
    });
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    createMessage.mutate({
      message_type: messageType,
      content: messageText,
    });
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'task': return <CheckSquare className="w-4 h-4" />;
      case 'status_change': return <Activity className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (!open || !dealId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] p-0" data-testid="dialog-deal-card">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p>Загрузка...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_350px] h-full overflow-hidden">
            {/* Левая панель - информация */}
            <div className="border-r p-4 overflow-y-auto max-h-[30vh] lg:max-h-none" data-testid="panel-left-info">
              {deal && (
                <>
                  {/* Заголовок */}
                  <div className="mb-4">
                    <h2 className="font-semibold text-lg" data-testid="text-deal-name">
                      {deal.client_name || "Сделка без названия"}
                    </h2>
                    <p className="text-sm text-muted-foreground" data-testid="text-order-number">
                      Заказ #{deal.order_number || "не присвоен"}
                    </p>
                  </div>

                  <Separator className="my-4" />

                  {/* Этап */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Этап</p>
                    <Select
                      value={deal.stage}
                      onValueChange={(value) => updateStage.mutate(value)}
                      disabled={updateStage.isPending}
                    >
                      <SelectTrigger className="w-full" data-testid="select-stage">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.key}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="my-4" />

                  {/* Контакты */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Контактные данные</p>
                    {deal.contact_email && (
                      <div className="flex items-center gap-2 text-sm mb-1" data-testid="text-email">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{deal.contact_email}</span>
                      </div>
                    )}
                    {deal.contact_phone && (
                      <div className="flex items-center gap-2 text-sm mb-1" data-testid="text-phone">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{deal.contact_phone}</span>
                      </div>
                    )}
                    {deal.company && (
                      <div className="flex items-center gap-2 text-sm" data-testid="text-company">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{deal.company}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Сумма */}
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Сумма заказа</p>
                    <div className="flex items-center gap-2" data-testid="text-amount">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {deal.amount ? `${Number(deal.amount).toLocaleString('ru-RU')} ₽` : 'Не указана'}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Документы */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Документы</p>
                      <ObjectUploader
                        maxNumberOfFiles={10}
                        maxFileSize={52428800}
                        onGetUploadParameters={handleGetUploadParameters}
                        onComplete={handleUploadComplete}
                        buttonClassName="h-7"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        <span className="text-xs">Загрузить</span>
                      </ObjectUploader>
                    </div>
                    {attachments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Нет файлов</p>
                    ) : (
                      <div className="space-y-2">
                        {attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs hover-elevate"
                            data-testid={`attachment-${attachment.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{attachment.file_name}</p>
                              <p className="text-muted-foreground">
                                {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => window.open(attachment.file_path, '_blank')}
                                data-testid={`button-download-${attachment.id}`}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                onClick={() => deleteAttachment.mutate(attachment.id)}
                                disabled={deleteAttachment.isPending}
                                data-testid={`button-delete-${attachment.id}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Пользовательские поля */}
                  <DealCustomFields dealId={dealId} />
                </>
              )}
            </div>

            {/* Центральная панель - чат */}
            <div className="flex flex-col h-full min-h-[30vh] lg:min-h-0" data-testid="panel-center-chat">
              {/* История */}
              <div className="flex-1 p-4 overflow-y-auto" data-testid="list-messages">
                <h3 className="font-semibold mb-4">История сообщений</h3>
                {messagesLoading ? (
                  <p className="text-sm text-muted-foreground">Загрузка...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">История пуста. Добавьте первое сообщение</p>
                ) : (
                  <div className="space-y-3">
                    {[...messages].reverse().map((msg) => (
                      <div key={msg.id} className="flex gap-3" data-testid={`message-${msg.id}`}>
                        <div className="text-muted-foreground mt-1">
                          {getMessageIcon(msg.message_type)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: ru })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Форма */}
              <div className="border-t p-4" data-testid="form-new-message">
                <div className="flex gap-2 mb-2">
                  <Select value={messageType} onValueChange={(v) => setMessageType(v as any)}>
                    <SelectTrigger className="w-[150px]" data-testid="select-message-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Заметка</SelectItem>
                      <SelectItem value="call">Звонок</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="task">Задача</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Добавьте сообщение..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="mb-2"
                  data-testid="input-message"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || createMessage.isPending}
                  data-testid="button-send-message"
                >
                  {createMessage.isPending ? "Отправка..." : "Отправить"}
                </Button>
              </div>
            </div>

            {/* Правая панель - действия */}
            <div className="border-l p-4 overflow-y-auto flex flex-col max-h-[30vh] lg:max-h-none" data-testid="panel-right-actions">
              <h3 className="font-semibold mb-4">Действия</h3>

              {/* Кнопки воркфлоу */}
              <div className="space-y-2 mb-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2" 
                  onClick={() => setAiAssistantOpen(true)}
                  data-testid="button-ai-calculate"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Просчёт
                </Button>

                <Button 
                  className="w-full justify-start gap-2"
                  onClick={() => setQuoteDialogOpen(true)}
                  data-testid="button-create-quote"
                >
                  <Plus className="w-4 h-4" />
                  Создать КП
                </Button>

                {hasQuote && (
                  <>
                    <Button 
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setInvoiceDialogOpen(true)}
                      data-testid="button-create-invoice"
                    >
                      <FileText className="w-4 h-4" />
                      Выставить счёт
                    </Button>

                    <Button 
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => setContractDialogOpen(true)}
                      data-testid="button-create-contract"
                    >
                      <FileText className="w-4 h-4" />
                      Договор
                    </Button>
                  </>
                )}
              </div>

              <Separator className="my-4" />

              {/* Дерево документов */}
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-2">Дерево документов</h4>
                {documentsLoading ? (
                  <p className="text-sm text-muted-foreground">Загрузка...</p>
                ) : documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Документы отсутствуют</p>
                ) : (
                  <div className="space-y-2 text-sm" data-testid="tree-documents">
                    {quotes.length > 0 && (
                      <div>
                        <p className="font-medium">КП ({quotes.length})</p>
                        {quotes.map(q => (
                          <p key={q.id} className="text-muted-foreground ml-4">
                            • {q.name} (v{q.version})
                          </p>
                        ))}
                      </div>
                    )}
                    {invoices.length > 0 && (
                      <div>
                        <p className="font-medium">Счета ({invoices.length})</p>
                        {invoices.map(i => (
                          <p key={i.id} className="text-muted-foreground ml-4">
                            • {i.name}
                          </p>
                        ))}
                      </div>
                    )}
                    {contracts.length > 0 && (
                      <div>
                        <p className="font-medium">Договоры ({contracts.length})</p>
                        {contracts.map(c => (
                          <p 
                            key={c.id} 
                            className="text-muted-foreground ml-4 cursor-pointer hover:text-primary"
                            onClick={() => {
                              setEditingDocumentId(c.id);
                              setContractDialogOpen(true);
                            }}
                            data-testid={`contract-item-${c.id}`}
                          >
                            • {c.name} {c.is_signed && '✓'}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Кнопка документы */}
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => setAllDocumentsDialogOpen(true)}
                data-testid="button-all-documents"
              >
                <FolderOpen className="w-4 h-4" />
                Документы
              </Button>

              {/* Кнопка создать проект */}
              {invoices.length > 0 && !existingProject && (
                <>
                  <Button 
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setCreateProjectDialogOpen(true)}
                    data-testid="button-create-project"
                  >
                    <Plus className="w-4 h-4" />
                    Создать проект
                  </Button>
                </>
              )}

              {/* Кнопка удаления */}
              {currentUser?.can_delete_deals && (
                <>
                  <Separator className="my-4" />
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteDialogOpen(true)}
                    data-testid="button-delete-deal"
                  >
                    <Trash2 className="w-4 h-4" />
                    Удалить сделку
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      <DeleteDealDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => deleteDeal.mutate()}
        dealName={deal?.client_name || "Сделка"}
        isPending={deleteDeal.isPending}
      />

      <DocumentFormDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        dealId={dealId}
        documentType="quote"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'documents'] });
        }}
      />

      <DocumentFormDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        dealId={dealId}
        documentType="invoice"
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'documents'] });
        }}
      />

      <DocumentFormDialog
        open={contractDialogOpen}
        onOpenChange={(open) => {
          setContractDialogOpen(open);
          if (!open) setEditingDocumentId(undefined);
        }}
        dealId={dealId}
        documentType="contract"
        documentId={editingDocumentId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/deals', dealId, 'documents'] });
          setEditingDocumentId(undefined);
        }}
      />

      <AllDocumentsDialog
        open={allDocumentsDialogOpen}
        onOpenChange={setAllDocumentsDialogOpen}
        documents={documents}
        isLoading={documentsLoading}
      />

      <CreateProjectDialog
        open={createProjectDialogOpen}
        onOpenChange={setCreateProjectDialogOpen}
        invoicePositions={
          invoices.length > 0 && invoices[0].data && typeof invoices[0].data === 'object' && 'positions' in invoices[0].data && Array.isArray((invoices[0].data as any).positions)
            ? (invoices[0].data as any).positions
            : []
        }
        onCreateProject={(selectedPositions, editedPositions, positionStagesData) => {
          if (invoices.length > 0) {
            createProjectFromInvoice.mutate({
              invoiceId: invoices[0].id,
              selectedPositions,
              editedPositions,
              positionStagesData,
            });
          }
        }}
        isPending={createProjectFromInvoice.isPending}
        dealName={deal?.client_name || ""}
      />

      {dealId && (
        <AiAssistantDialog
          open={aiAssistantOpen}
          onOpenChange={setAiAssistantOpen}
          dealId={dealId}
          userId={getCurrentUserId()}
          dealName={deal?.client_name}
        />
      )}
    </Dialog>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, DollarSign, Send, Paperclip, FileText, Download, Play, CheckCircle, Upload, Image, FileSpreadsheet, File, Link2, TrendingUp } from "lucide-react";
import type { ProjectStage } from "@shared/schema";

interface StageDetailViewProps {
  stageId: string;
  stageName: string;
  stageStatus?: string;
  stageDescription?: string;
  stageDeadline?: string;
  stageCost?: string;
  projectId?: string;
  onStatusChange?: () => void;
}

export function StageDetailView({ 
  stageId, 
  stageName, 
  stageStatus,
  stageDescription,
  stageDeadline,
  stageCost,
  projectId,
  onStatusChange
}: StageDetailViewProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(stageStatus || "pending");
  const [isDragging, setIsDragging] = useState(false);
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/stages", stageId, "messages"],
    enabled: !!stageId,
  });

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ["/api/stages", stageId, "documents"],
    enabled: !!stageId,
  });

  const { data: allProjectDocuments = [] } = useQuery<any[]>({
    queryKey: ["/api/projects", projectId, "documents"],
    enabled: !!projectId,
  });

  // Получаем зависимости этапов
  const { data: dependencies = [] } = useQuery<any[]>({
    queryKey: ['/api/projects', projectId, 'dependencies'],
    enabled: !!projectId,
  });

  // Получаем все этапы проекта для отображения названий
  const { data: allStages = [] } = useQuery<ProjectStage[]>({
    queryKey: ['/api/projects', projectId, 'stages'],
    enabled: !!projectId,
  });

  // Находим зависимости текущего этапа
  const stageDependencies = dependencies.filter(d => d.dependent_stage_id === stageId);
  const dependentStages = dependencies.filter(d => d.depends_on_stage_id === stageId);

  // Функция для получения названия этапа по ID
  const getStageName = (id: string) => {
    const stage = allStages.find(s => s.id === id);
    return stage?.name || 'Неизвестный этап';
  };

  const createMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      await apiRequest(
        "POST",
        `/api/stages/${stageId}/messages`,
        { message, user_id: user.id }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stages", stageId, "messages"] });
      setNewMessage("");
      toast({ description: "Сообщение добавлено" });
    },
    onError: (error: Error) => {
      toast({ description: error.message || "Ошибка отправки", variant: "destructive" });
    },
  });

  const { data: stage } = useQuery<ProjectStage>({
    queryKey: ["/api/projects/stages", stageId],
    enabled: !!stageId,
  });

  const startStageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/stages/${stageId}/start`, {});
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "stages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "timeline"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/projects/stages", stageId] });
      onStatusChange?.();
      toast({ description: "Этап начат" });
    },
    onError: (error: Error) => {
      toast({ description: error.message || "Ошибка начала этапа", variant: "destructive" });
    },
  });

  const completeStageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/projects/stages/${stageId}/complete`, {});
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "stages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "timeline"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/projects/stages", stageId] });
      onStatusChange?.();
      toast({ description: "Этап завершен" });
    },
    onError: (error: Error) => {
      toast({ description: error.message || "Ошибка завершения этапа", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PUT", `/api/projects/stages/${stageId}`, { status });
      
      if (user?.id) {
        const statusText = status === 'pending' ? 'Ожидает' : status === 'in_progress' ? 'В работе' : 'Завершён';
        await apiRequest("POST", `/api/stages/${stageId}/messages`, {
          message: `Изменён статус на: ${statusText}`,
          user_id: user.id,
        });
      }
    },
    onSuccess: () => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "stages"] });
        queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/stages", stageId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects/stages", stageId] });
      onStatusChange?.();
      toast({ description: "Статус обновлен" });
    },
    onError: (error: Error) => {
      toast({ description: error.message || "Ошибка обновления статуса", variant: "destructive" });
    },
  });

  const handleStatusChange = (status: string) => {
    setCurrentStatus(status);
    updateStatusMutation.mutate(status);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !user?.id) return;
    createMessageMutation.mutate(newMessage);
  };

  const uploadFiles = async (files: FileList) => {
    if (!user?.id) {
      toast({ description: "Требуется авторизация", variant: "destructive" });
      return;
    }
    
    setUploadingFile(true);
    try {
      const uploadPromises = Array.from(files).map(file =>
        apiRequest("POST", "/api/documents", {
          name: file.name,
          type: "other",
          file_path: "",
          project_stage_id: stageId,
          uploaded_by: user.id,
        })
      );
      
      await Promise.all(uploadPromises);
      
      await apiRequest("POST", `/api/stages/${stageId}/messages`, {
        message: `Загружено файлов: ${Array.from(files).map(f => f.name).join(', ')}`,
        user_id: user.id,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/stages", stageId, "documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stages", stageId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "documents"] });
      toast({ description: `Загружено файлов: ${files.length}` });
    } catch (error) {
      toast({ description: "Ошибка загрузки файлов", variant: "destructive" });
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Определение иконки файла по расширению
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="w-4 h-4 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className={`border-l-4 ${
        currentStatus === 'completed' ? 'border-green-500 bg-green-50/30 dark:bg-green-950/20' :
        currentStatus === 'in_progress' ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20' :
        'border-gray-400 bg-accent/30'
      }`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle>{stageName}</CardTitle>
              {stageDescription && (
                <p className="text-sm text-muted-foreground mt-2">{stageDescription}</p>
              )}
            </div>
            <Select value={currentStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-40" data-testid="select-stage-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">⚪ Ожидает</SelectItem>
                <SelectItem value="in_progress">🔵 В работе</SelectItem>
                <SelectItem value="completed">🟢 Завершён</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 text-sm text-muted-foreground">
            {stageDeadline && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(stageDeadline).toLocaleDateString('ru-RU')}
              </div>
            )}
            {stageCost && (
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {parseFloat(stageCost).toLocaleString('ru-RU')} ₽
              </div>
            )}
          </div>

          {stage && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {stage.planned_start_date && (
                  <div>
                    <p className="text-muted-foreground">План начала</p>
                    <p className="font-medium">{new Date(stage.planned_start_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                )}
                {stage.planned_end_date && (
                  <div>
                    <p className="text-muted-foreground">План окончания</p>
                    <p className="font-medium">{new Date(stage.planned_end_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                )}
                {stage.actual_start_date && (
                  <div>
                    <p className="text-muted-foreground">Фактически начат</p>
                    <p className="font-medium">{new Date(stage.actual_start_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                )}
                {stage.actual_end_date && (
                  <div>
                    <p className="text-muted-foreground">Фактически завершен</p>
                    <p className="font-medium">{new Date(stage.actual_end_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                )}
              </div>

              {stage.status === 'in_progress' && stage.planned_end_date && (
                <div className="pt-2">
                  {(() => {
                    const now = new Date();
                    const deadline = new Date(stage.planned_end_date);
                    const diffTime = deadline.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isOverdue = diffDays < 0;
                    
                    return (
                      <div className={`p-3 rounded-md ${isOverdue ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                        <p className="text-sm font-medium">
                          {isOverdue ? (
                            <>Просрочка: {Math.abs(diffDays)} дн.</>
                          ) : (
                            <>Осталось: {diffDays} дн.</>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Крайний срок: {deadline.toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {!stage.actual_start_date && stage.status !== 'in_progress' && (
                  <Button
                    onClick={() => startStageMutation.mutate()}
                    disabled={startStageMutation.isPending}
                    data-testid="button-start-stage"
                    size="sm"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Начать этап
                  </Button>
                )}
                {stage.status === 'in_progress' && !stage.actual_end_date && (
                  <Button
                    onClick={() => completeStageMutation.mutate()}
                    disabled={completeStageMutation.isPending}
                    data-testid="button-complete-stage"
                    size="sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Завершить этап
                  </Button>
                )}
              </div>

              {/* Зависимости этапов */}
              {(stageDependencies.length > 0 || dependentStages.length > 0) && (
                <div className="space-y-3 pt-4 border-t mt-4">
                  {stageDependencies.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Link2 className="w-4 h-4 text-primary" />
                        <span>Этот этап зависит от:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-6">
                        {stageDependencies.map(dep => (
                          <Badge key={dep.id} variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20">
                            {getStageName(dep.depends_on_stage_id)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {dependentStages.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span>От этого этапа зависят:</span>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-6">
                        {dependentStages.map(dep => (
                          <Badge key={dep.id} variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/20">
                            {getStageName(dep.dependent_stage_id)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Документы этапа</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {documents.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Нет документов</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <Card
                  key={doc.id}
                  className="border-l-4 border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors"
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>{new Date(doc.created_at || Date.now()).toLocaleDateString('ru-RU')}</span>
                            {doc.uploaded_by_name && (
                              <>
                                <span>•</span>
                                <span>{doc.uploaded_by_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {doc.file_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid={`button-download-${doc.id}`}
                          className="flex-shrink-0"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.02]'
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className={`w-8 h-8 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="text-center">
                <p className="text-sm font-medium">
                  {uploadingFile ? "Загрузка..." : "Перетащите файлы сюда"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  или нажмите для выбора
                </p>
              </div>
              <Input
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="absolute inset-0 opacity-0 cursor-pointer"
                data-testid="input-file-upload"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {projectId && allProjectDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Все документы проекта</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {allProjectDocuments.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {allProjectDocuments.map((doc: any) => (
                  <Card
                    key={doc.id}
                    className="border-l-4 border-gray-400 bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getFileIcon(doc.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-xs">
                              {doc.stage_name}
                            </Badge>
                            <span>•</span>
                            <span>{doc.user_name || 'Неизвестно'}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Чат этапа</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {messages.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-6">
                  <Send className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">Нет сообщений</p>
                  <p className="text-xs text-muted-foreground mt-1">Начните обсуждение этапа</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <Card
                    key={msg.id}
                    className="border-l-4 border-primary bg-primary/5 dark:bg-primary/10"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {msg.user_name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">{msg.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.created_at).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Написать сообщение... (Enter для отправки, Shift+Enter для новой строки)"
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              data-testid="textarea-stage-message"
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || createMessageMutation.isPending}
              data-testid="button-send-message"
              className="h-auto"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

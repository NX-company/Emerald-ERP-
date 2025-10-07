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
import { Calendar, DollarSign, Send, Paperclip, FileText, Download } from "lucide-react";

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

  return (
    <div className="space-y-4">
      <Card>
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
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="completed">Завершён</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Документы этапа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">Нет документов</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{doc.name}</span>
                  </div>
                  {doc.file_url && (
                    <Button size="sm" variant="ghost" data-testid={`button-download-${doc.id}`}>
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div 
            className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Input
              type="file"
              multiple
              onChange={handleFileUpload}
              disabled={uploadingFile}
              className="cursor-pointer"
              data-testid="input-file-upload"
            />
            <p className="text-xs text-muted-foreground text-center mt-2">
              {uploadingFile ? "Загрузка..." : "Перетащите файлы или выберите"}
            </p>
          </div>
        </CardContent>
      </Card>

      {projectId && allProjectDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Все документы проекта</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {allProjectDocuments.map((doc: any) => (
                  <div key={doc.id} className="flex items-start gap-2 p-2 border rounded-md">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.stage_name} • {doc.user_name || 'Неизвестно'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Чат этапа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">Нет сообщений</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="border-l-2 border-primary pl-3 py-1">
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {msg.user_name} • {new Date(msg.created_at).toLocaleString('ru-RU')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Написать сообщение..."
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
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

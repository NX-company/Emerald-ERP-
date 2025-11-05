import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

interface ProjectMessage {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

interface ProjectChatProps {
  projectId: string;
}

export function ProjectChat({ projectId }: ProjectChatProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");

  // Get current user from API
  const { data: users } = useQuery<any[]>({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      return response;
    },
  });

  // Use first user as current user (temporary solution until proper auth is implemented)
  const user = users && users.length > 0 ? users[0] : null;

  // Debug logging
  console.log('ProjectChat loaded:', {
    projectId,
    user: user ? { id: user.id, username: user.username } : 'null',
    usersCount: users?.length || 0
  });

  const { data: messages = [], isLoading, isError, error } = useQuery<ProjectMessage[]>({
    queryKey: [`/api/projects/${projectId}/messages`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/projects/${projectId}/messages`);
      return response;
    },
    enabled: !!projectId,
  });

  const createMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      console.log('mutationFn called with:', { message, userId: user?.id, projectId });

      if (!user?.id) {
        console.error('mutationFn: User not authenticated');
        throw new Error("User not authenticated");
      }

      console.log('Sending POST request to:', `/api/projects/${projectId}/messages`);
      const result = await apiRequest(
        "POST",
        `/api/projects/${projectId}/messages`,
        { message, user_id: user.id }
      );
      console.log('POST response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/messages`] });
      setNewMessage("");
      toast({ description: "Сообщение добавлено" });
    },
    onError: (error: Error) => {
      toast({ description: error.message || "Ошибка отправки", variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    const trimmedMessage = newMessage.trim();

    if (!trimmedMessage) {
      toast({
        description: "Сообщение не может быть пустым",
        variant: "destructive"
      });
      return;
    }

    if (!user?.id) {
      toast({
        description: "Вы должны быть авторизованы для отправки сообщений",
        variant: "destructive"
      });
      console.error('User not authenticated:', user);
      return;
    }

    console.log('Sending message:', { message: trimmedMessage, userId: user.id, projectId });
    createMessageMutation.mutate(trimmedMessage);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Общий чат проекта</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {messages.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-6">
                <Loader2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2 animate-spin" />
                <p className="text-sm text-muted-foreground">Загрузка сообщений...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-6">
                <p className="text-sm text-destructive">Ошибка загрузки сообщений</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {error instanceof Error ? error.message : "Попробуйте обновить страницу"}
                </p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-6">
                <Send className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Нет сообщений</p>
                <p className="text-xs text-muted-foreground mt-1">Начните обсуждение проекта</p>
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
            data-testid="textarea-project-message"
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || createMessageMutation.isPending}
            data-testid="button-send-project-message"
            className="h-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

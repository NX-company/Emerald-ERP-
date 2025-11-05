import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2 } from "lucide-react";

interface StageMessage {
  id: string;
  stage_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
}

interface StageChatProps {
  stageId: string;
}

export function StageChat({ stageId }: StageChatProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get current user from localStorage
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const { data: messages = [], isLoading, isError, error } = useQuery<StageMessage[]>({
    queryKey: [`/api/stages/${stageId}/messages`],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/stages/${stageId}/messages`);
      return response;
    },
    enabled: !!stageId,
    refetchInterval: 3000, // Auto-refresh every 3 seconds
  });

  const createMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const result = await apiRequest(
        "POST",
        `/api/stages/${stageId}/messages`,
        { message, user_id: user.id }
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/stages/${stageId}/messages`] });
      setNewMessage("");
      toast({ description: "Сообщение отправлено" });
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
      return;
    }

    createMessageMutation.mutate(trimmedMessage);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-medium">Чат по задаче</h3>
        <Badge variant="secondary" className="text-xs">
          {messages.length}
        </Badge>
      </div>

      <ScrollArea ref={scrollAreaRef} className="h-[300px] pr-3">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2 animate-spin" />
              <p className="text-xs text-muted-foreground">Загрузка сообщений...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-sm text-destructive">Ошибка загрузки</p>
              <p className="text-xs text-muted-foreground mt-1">
                {error instanceof Error ? error.message : "Попробуйте обновить"}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Send className="w-10 h-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Нет сообщений</p>
              <p className="text-xs text-muted-foreground mt-1">Начните обсуждение</p>
            </div>
          ) : (
            messages.map((msg) => (
              <Card
                key={msg.id}
                className="border-l-4 border-primary bg-primary/5 dark:bg-primary/10"
              >
                <CardContent className="p-2.5">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {msg.user_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
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
          placeholder="Написать сообщение..."
          className="min-h-[60px] text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <Button
          size="icon"
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || createMessageMutation.isPending}
          className="h-[60px] w-[60px] flex-shrink-0"
        >
          {createMessageMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

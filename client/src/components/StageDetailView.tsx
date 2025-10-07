import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, DollarSign, Send, Paperclip } from "lucide-react";

interface StageDetailViewProps {
  stageId: string;
  stageName: string;
  stageStatus?: string;
  stageDescription?: string;
  stageDeadline?: string;
  stageCost?: string;
}

export function StageDetailView({ 
  stageId, 
  stageName, 
  stageStatus,
  stageDescription,
  stageDeadline,
  stageCost
}: StageDetailViewProps) {
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/stages", stageId, "messages"],
    enabled: !!stageId,
  });

  const createMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest(
        "POST",
        `/api/stages/${stageId}/messages`,
        { message, user_id: user?.id }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stages", stageId, "messages"] });
      setNewMessage("");
      toast({ description: "Сообщение добавлено" });
    },
    onError: () => {
      toast({ description: "Ошибка отправки", variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    createMessageMutation.mutate(newMessage);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{stageName}</CardTitle>
              {stageDescription && (
                <p className="text-sm text-muted-foreground mt-2">{stageDescription}</p>
              )}
            </div>
            {stageStatus && (
              <Badge variant={stageStatus === 'completed' ? 'default' : stageStatus === 'in_progress' ? 'secondary' : 'outline'}>
                {stageStatus === 'completed' ? 'Завершён' : stageStatus === 'in_progress' ? 'В работе' : 'Ожидает'}
              </Badge>
            )}
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
                      {new Date(msg.created_at).toLocaleString('ru-RU')}
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
            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || createMessageMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                data-testid="button-attach-file"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

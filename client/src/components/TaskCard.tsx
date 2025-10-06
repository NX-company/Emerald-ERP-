import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Paperclip, MessageSquare } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

interface TaskCardProps {
  id: string;
  title: string;
  assignee: string;
  priority: "low" | "medium" | "high" | "critical";
  deadline: string;
  completed?: boolean;
  attachments?: number;
  comments?: number;
}

const priorityConfig = {
  low: { label: "Низкий", variant: "outline" as const },
  medium: { label: "Средний", variant: "secondary" as const },
  high: { label: "Высокий", variant: "default" as const },
  critical: { label: "Критический", variant: "destructive" as const },
};

export function TaskCard({ id, title, assignee, priority, deadline, completed = false, attachments = 0, comments = 0 }: TaskCardProps) {
  const config = priorityConfig[priority];

  return (
    <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-task-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Checkbox 
            checked={completed} 
            className="mt-1"
            data-testid={`checkbox-task-${id}`}
          />
          <div className="flex-1 min-w-0">
            <h3 className={`font-medium text-sm ${completed ? 'line-through text-muted-foreground' : ''}`}>
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={config.variant} className="text-xs">
                {config.label}
              </Badge>
              <Badge variant="outline" className="text-xs font-mono">#{id}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span className="text-xs">{deadline}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar name={assignee} size="sm" />
            <span className="text-xs">{assignee.split(" ")[0]}</span>
          </div>
        </div>

        {(attachments > 0 || comments > 0) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
            {attachments > 0 && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span>{attachments}</span>
              </div>
            )}
            {comments > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                <span>{comments}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

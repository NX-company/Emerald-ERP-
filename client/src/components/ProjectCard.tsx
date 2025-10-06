import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Building2, Calendar, User } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { UserAvatar } from "./UserAvatar";

interface ProjectCardProps {
  id: string;
  name: string;
  client: string;
  progress: number;
  status: "pending" | "in_progress" | "completed" | "overdue";
  deadline: string;
  manager: string;
  stages: { name: string; status: "pending" | "in_progress" | "completed" }[];
}

export function ProjectCard({ id, name, client, progress, status, deadline, manager, stages }: ProjectCardProps) {
  return (
    <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-project-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{name}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{client}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="outline" className="text-xs font-mono">#{id}</Badge>
            <StatusBadge status={status} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Срок</span>
          </div>
          <span className="text-xs">{deadline}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>РОП</span>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar name={manager} size="sm" />
            <span className="text-xs">{manager.split(" ")[0]}</span>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Этапы ({stages.filter(s => s.status === "completed").length}/{stages.length})</p>
          <div className="flex flex-wrap gap-1">
            {stages.map((stage, i) => (
              <Badge 
                key={i} 
                variant={stage.status === "completed" ? "default" : "outline"}
                className="text-xs"
              >
                {stage.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

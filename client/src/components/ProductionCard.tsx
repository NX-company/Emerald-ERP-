import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Clock, DollarSign, User, CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "./UserAvatar";

interface ProductionStage {
  name: string;
  status: "completed" | "in_progress" | "pending";
}

interface ProductionCardProps {
  id: string;
  itemName: string;
  stages: ProductionStage[];
  progress: number;
  worker: string;
  payment: number;
  deadline: string;
  qrCode?: boolean;
}

export function ProductionCard({ id, itemName, stages, progress, worker, payment, deadline, qrCode = false }: ProductionCardProps) {
  const currentStage = stages.find((s) => s.status === "in_progress")?.name || stages[stages.length - 1].name;

  return (
    <Card className="hover-elevate active-elevate-2" data-testid={`card-production-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{itemName}</h3>
            <Badge variant="default" className="text-xs mt-2">{currentStage}</Badge>
          </div>
          {qrCode && (
            <div className="flex items-center justify-center w-16 h-16 bg-muted rounded">
              <QrCode className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-2">
          <span className="text-xs text-muted-foreground">Этапы производства:</span>
          <div className="flex flex-wrap gap-1">
            {stages.map((stage, index) => {
              const isCompleted = stage.status === "completed";
              const isInProgress = stage.status === "in_progress";
              const isPending = stage.status === "pending";

              return (
                <div
                  key={index}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                    isCompleted
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      : isInProgress
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`stage-${stage.name}`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Circle className={`h-3 w-3 ${isInProgress ? "fill-current" : ""}`} />
                  )}
                  <span>{stage.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span className="text-xs">Исполнитель</span>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar name={worker} size="sm" />
            <span className="text-xs">{worker.split(" ")[0]}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span className="text-xs">Оплата</span>
          </div>
          <span className="text-xs font-medium">₽{payment.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="text-xs">Срок</span>
          </div>
          <span className="text-xs">{deadline}</span>
        </div>

        <Badge variant="outline" className="text-xs font-mono w-full justify-center">
          Задание #{id}
        </Badge>
      </CardContent>
    </Card>
  );
}

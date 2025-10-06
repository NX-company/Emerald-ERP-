import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Clock, DollarSign, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "./UserAvatar";

interface ProductionCardProps {
  id: string;
  itemName: string;
  stage: string;
  progress: number;
  worker: string;
  payment: number;
  deadline: string;
  qrCode?: boolean;
}

export function ProductionCard({ id, itemName, stage, progress, worker, payment, deadline, qrCode = false }: ProductionCardProps) {
  return (
    <Card className="hover-elevate active-elevate-2" data-testid={`card-production-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{itemName}</h3>
            <Badge variant="default" className="text-xs mt-2">{stage}</Badge>
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
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Прогресс</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>Исполнитель</span>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar name={worker} size="sm" />
            <span className="text-xs">{worker.split(" ")[0]}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Оплата</span>
          </div>
          <span className="text-xs font-medium">₽{payment.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Срок</span>
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

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, DollarSign, User } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

interface DealCardProps {
  id: string;
  clientName: string;
  company: string;
  amount: number;
  deadline: string;
  manager: string;
  tags?: string[];
}

export function DealCard({ id, clientName, company, amount, deadline, manager, tags = [] }: DealCardProps) {
  return (
    <Card className="hover-elevate active-elevate-2 cursor-pointer" data-testid={`card-deal-${id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{clientName}</h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{company}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono">#{id}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Сумма</span>
          </div>
          <span className="font-semibold">₽{amount.toLocaleString()}</span>
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
            <span>Менеджер</span>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar name={manager} size="sm" />
            <span className="text-xs">{manager.split(" ")[0]}</span>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

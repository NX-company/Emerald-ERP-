import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface KanbanColumn {
  id: string;
  title: string;
  count: number;
  items: ReactNode[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
}

export function KanbanBoard({ columns }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                <Badge variant="secondary">{column.count}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {column.items.map((item, index) => (
                <div key={index}>{item}</div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

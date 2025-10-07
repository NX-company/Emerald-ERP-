import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StageDetailView } from "@/components/StageDetailView";
import { Calendar, DollarSign } from "lucide-react";

export default function MyTasks() {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const [selectedStage, setSelectedStage] = useState<any>(null);

  const { data: tasks = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/my-tasks", user?.id],
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div className="p-6">Загрузка...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Мои задачи</h1>
        <p className="text-muted-foreground">Этапы, назначенные мне</p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground text-center">Нет назначенных задач</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card 
              key={task.id} 
              data-testid={`task-${task.id}`}
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedStage(task)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{task.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Проект: {task.project?.name}
                    </p>
                  </div>
                  <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in_progress' ? 'secondary' : 'outline'}>
                    {task.status === 'completed' ? 'Завершён' : task.status === 'in_progress' ? 'В работе' : 'Ожидает'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {task.description && (
                    <p className="text-sm">{task.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {task.end_date && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(task.end_date).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                    {task.cost && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {parseFloat(task.cost).toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedStage} onOpenChange={(open) => !open && setSelectedStage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Детали этапа</DialogTitle>
          </DialogHeader>
          {selectedStage && (
            <StageDetailView
              stageId={selectedStage.id}
              stageName={selectedStage.name}
              stageStatus={selectedStage.status}
              stageDescription={selectedStage.description}
              stageDeadline={selectedStage.end_date}
              stageCost={selectedStage.cost}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

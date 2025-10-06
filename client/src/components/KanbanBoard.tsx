import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanColumn {
  id: string;
  title: string;
  count: number;
  items: { id: string; content: ReactNode }[];
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  activeId: string | null;
  onDragStart: (event: DragStartEvent) => void;
  onDragOver: (event: DragOverEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  activeItem?: ReactNode;
}

interface SortableItemProps {
  id: string;
  children: ReactNode;
}

function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

interface DroppableColumnProps {
  id: string;
  title: string;
  count: number;
  items: { id: string; content: ReactNode }[];
}

function DroppableColumn({ id, title, count, items }: DroppableColumnProps) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80" data-testid={`column-${id}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium" data-testid={`text-column-title-${id}`}>
              {title}
            </CardTitle>
            <Badge variant="secondary" data-testid={`text-column-count-${id}`}>{count}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 min-h-[200px]">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id}>
              {item.content}
            </SortableItem>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function KanbanBoard({ 
  columns, 
  activeId, 
  onDragStart, 
  onDragOver, 
  onDragEnd,
  activeItem 
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const allItemIds = columns.flatMap((col) => col.items.map((item) => item.id));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        <SortableContext items={allItemIds} strategy={verticalListSortingStrategy}>
          {columns.map((column) => (
            <DroppableColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={column.count}
              items={column.items}
            />
          ))}
        </SortableContext>
      </div>
      <DragOverlay>
        {activeId && activeItem ? (
          <div style={{ opacity: 0.8, cursor: "grabbing" }}>
            {activeItem}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

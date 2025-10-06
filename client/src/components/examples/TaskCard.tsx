import { TaskCard } from '../TaskCard'

export default function TaskCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <TaskCard
        id="101"
        title="Согласовать чертежи с клиентом"
        assignee="Петр Козлов"
        priority="high"
        deadline="10.11.2025"
        attachments={3}
        comments={5}
      />
      <TaskCard
        id="102"
        title="Заказать фурнитуру у поставщика"
        assignee="Ольга Смирнова"
        priority="medium"
        deadline="12.11.2025"
        attachments={1}
        comments={2}
      />
      <TaskCard
        id="103"
        title="Подготовить смету по проекту #567"
        assignee="Иван Морозов"
        priority="critical"
        deadline="08.11.2025"
        completed={true}
        comments={8}
      />
    </div>
  )
}

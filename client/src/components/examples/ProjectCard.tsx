import { ProjectCard } from '../ProjectCard'

export default function ProjectCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <ProjectCard
        id="567"
        name="Кухонный гарнитур Модерн"
        client="ООО Интерьер Плюс"
        progress={65}
        status="in_progress"
        deadline="25.11.2025"
        manager="Петр Козлов"
        stages={[
          { name: "Замер", status: "completed" },
          { name: "ТЗ", status: "completed" },
          { name: "КД", status: "in_progress" },
          { name: "Согласование", status: "pending" },
          { name: "Закупка", status: "pending" },
        ]}
      />
      <ProjectCard
        id="568"
        name="Шкаф-купе 3м"
        client="ИП Иванова Е.А."
        progress={30}
        status="pending"
        deadline="30.11.2025"
        manager="Анна Волкова"
        stages={[
          { name: "Замер", status: "completed" },
          { name: "ТЗ", status: "in_progress" },
          { name: "КД", status: "pending" },
          { name: "Закупка", status: "pending" },
        ]}
      />
    </div>
  )
}

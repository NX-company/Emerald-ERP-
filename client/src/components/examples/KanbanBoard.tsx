import { KanbanBoard } from '../KanbanBoard'
import { DealCard } from '../DealCard'

export default function KanbanBoardExample() {
  const columns = [
    {
      id: "new",
      title: "Новые",
      count: 3,
      items: [
        <DealCard
          key="1"
          id="1234"
          clientName="Александр Сергеев"
          company="ООО Интерьер Плюс"
          amount={450000}
          deadline="15.11.2025"
          manager="Мария Петрова"
          tags={["Кухня", "VIP"]}
        />,
        <DealCard
          key="2"
          id="1235"
          clientName="Елена Иванова"
          company="ИП Иванова Е.А."
          amount={280000}
          deadline="20.11.2025"
          manager="Иван Сидоров"
          tags={["Шкаф"]}
        />,
      ],
    },
    {
      id: "meeting",
      title: "Встреча назначена",
      count: 2,
      items: [
        <DealCard
          key="3"
          id="1236"
          clientName="Дмитрий Ковалев"
          company="ООО Дизайн Студия"
          amount={620000}
          deadline="18.11.2025"
          manager="Мария Петрова"
          tags={["Гостиная", "Кухня"]}
        />,
      ],
    },
    {
      id: "proposal",
      title: "КП отправлено",
      count: 4,
      items: [
        <DealCard
          key="4"
          id="1237"
          clientName="Ольга Смирнова"
          company="ИП Смирнова О.В."
          amount={185000}
          deadline="12.11.2025"
          manager="Иван Сидоров"
          tags={["Прихожая"]}
        />,
      ],
    },
    {
      id: "contract",
      title: "Договор",
      count: 1,
      items: [
        <DealCard
          key="5"
          id="1238"
          clientName="Сергей Волков"
          company="ООО Строй Групп"
          amount={890000}
          deadline="10.11.2025"
          manager="Мария Петрова"
          tags={["Офис", "Корпоративный"]}
        />,
      ],
    },
  ];

  return <KanbanBoard columns={columns} />
}

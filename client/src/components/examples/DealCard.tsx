import { DealCard } from '../DealCard'

export default function DealCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <DealCard
        id="1234"
        clientName="Александр Сергеев"
        company="ООО Интерьер Плюс"
        amount={450000}
        deadline="15.11.2025"
        manager="Мария Петрова"
        tags={["Кухня", "VIP"]}
      />
      <DealCard
        id="1235"
        clientName="Елена Иванова"
        company="ИП Иванова Е.А."
        amount={280000}
        deadline="20.11.2025"
        manager="Иван Сидоров"
        tags={["Шкаф"]}
      />
    </div>
  )
}

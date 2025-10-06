import { ProductionCard } from '../ProductionCard'

export default function ProductionCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <ProductionCard
        id="301"
        itemName="Кухонный фасад верхний"
        stage="Раскрой"
        progress={100}
        worker="Андрей Кузнецов"
        payment={3500}
        deadline="08.11.2025"
        qrCode={true}
      />
      <ProductionCard
        id="302"
        itemName="Столешница 3000мм"
        stage="Фрезеровка"
        progress={45}
        worker="Михаил Соколов"
        payment={5000}
        deadline="09.11.2025"
        qrCode={true}
      />
      <ProductionCard
        id="303"
        itemName="Дверца шкафа-купе"
        stage="Покраска"
        progress={20}
        worker="Дмитрий Попов"
        payment={4200}
        deadline="10.11.2025"
        qrCode={true}
      />
    </div>
  )
}

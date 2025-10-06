import { WarehouseItemCard } from '../WarehouseItemCard'

export default function WarehouseItemCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
      <WarehouseItemCard
        id="MAT001"
        name="МДФ 18мм белый"
        quantity={15}
        unit="листов"
        location="Склад А-12"
        status="critical"
        minStock={20}
      />
      <WarehouseItemCard
        id="MAT002"
        name="Фурнитура Blum"
        quantity={45}
        unit="компл."
        location="Склад Б-03"
        status="low"
        minStock={30}
      />
      <WarehouseItemCard
        id="MAT003"
        name="Кромка ПВХ 2мм"
        quantity={250}
        unit="м.п."
        location="Склад А-05"
        status="normal"
        minStock={100}
      />
    </div>
  )
}

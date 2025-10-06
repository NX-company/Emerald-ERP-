import { StatCard } from '../StatCard'
import { ShoppingCart, DollarSign, Package, Factory } from 'lucide-react'

export default function StatCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Активные сделки"
        value="24"
        change="+12% от прошлого месяца"
        changeType="positive"
        icon={ShoppingCart}
      />
      <StatCard
        title="Выручка"
        value="₽4.2М"
        change="+8% от прошлого месяца"
        changeType="positive"
        icon={DollarSign}
      />
      <StatCard
        title="В производстве"
        value="18"
        change="3 просрочено"
        changeType="negative"
        icon={Factory}
      />
      <StatCard
        title="На складе"
        value="156"
        change="15 критический остаток"
        changeType="neutral"
        icon={Package}
      />
    </div>
  )
}

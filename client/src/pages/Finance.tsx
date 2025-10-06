import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Badge } from "@/components/ui/badge";

export default function Finance() {
  // todo: remove mock functionality
  const expenses = [
    { category: "Аренда", amount: 150000, type: "fixed" },
    { category: "Зарплата", amount: 850000, type: "fixed" },
    { category: "Материалы", amount: 420000, type: "variable" },
    { category: "Электричество", amount: 35000, type: "fixed" },
    { category: "Доставка", amount: 28000, type: "variable" },
  ];

  const projects = [
    {
      id: "567",
      name: "Кухонный гарнитур Модерн",
      revenue: 450000,
      costs: 285000,
      profit: 165000,
      margin: 36.7,
    },
    {
      id: "568",
      name: "Шкаф-купе 3м",
      revenue: 280000,
      costs: 195000,
      profit: 85000,
      margin: 30.4,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Финансы и отчеты</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление расходами и доходами</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Выручка за месяц"
          value="₽4.2М"
          change="+8% от прошлого"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Расходы за месяц"
          value="₽2.8М"
          change="+5% от прошлого"
          changeType="negative"
          icon={TrendingDown}
        />
        <StatCard
          title="Прибыль"
          value="₽1.4М"
          change="+12% от прошлого"
          changeType="positive"
          icon={TrendingUp}
        />
        <StatCard
          title="Рентабельность"
          value="33.3%"
          change="+2% от прошлого"
          changeType="positive"
          icon={Wallet}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Структура расходов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {expenses.map((expense, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{expense.category}</span>
                    <Badge variant="outline" className="text-xs w-fit">
                      {expense.type === "fixed" ? "Постоянный" : "Переменный"}
                    </Badge>
                  </div>
                </div>
                <span className="text-sm font-semibold">₽{expense.amount.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Рентабельность проектов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.map((project) => (
              <div key={project.id} className="p-3 rounded-md bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{project.name}</span>
                  <Badge variant="outline" className="font-mono">#{project.id}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Выручка:</span>
                    <span className="ml-2 font-medium">₽{project.revenue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Расходы:</span>
                    <span className="ml-2 font-medium">₽{project.costs.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Прибыль:</span>
                    <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                      ₽{project.profit.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Маржа:</span>
                    <span className="ml-2 font-medium">{project.margin}%</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

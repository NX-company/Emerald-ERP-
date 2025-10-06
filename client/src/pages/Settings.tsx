import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Settings() {
  // todo: remove mock functionality
  const users = [
    { id: "1", name: "Иван Петров", role: "Директор", email: "i.petrov@emerald.ru", status: "active" },
    { id: "2", name: "Мария Петрова", role: "Менеджер по продажам", email: "m.petrova@emerald.ru", status: "active" },
    { id: "3", name: "Петр Козлов", role: "РОП", email: "p.kozlov@emerald.ru", status: "active" },
    { id: "4", name: "Анна Волкова", role: "Конструктор", email: "a.volkova@emerald.ru", status: "active" },
  ];

  const roles = [
    "Директор",
    "Менеджер по продажам",
    "РОП",
    "Конструктор",
    "Сметчик",
    "Замерщик",
    "Руководитель проекта",
    "Финансист",
    "Снабженец",
    "Кладовщик",
    "Монтажник",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Настройки</h1>
        <p className="text-sm text-muted-foreground mt-1">Управление системой и пользователями</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="company">Компания</TabsTrigger>
          <TabsTrigger value="integrations">Интеграции</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Управление пользователями и их правами доступа</p>
            <Button data-testid="button-invite-user">
              <Plus className="h-4 w-4 mr-2" />
              Пригласить пользователя
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Сотрудники</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                    data-testid={`user-${user.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={user.name} size="md" />
                      <div>
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{user.role}</Badge>
                      <Button variant="ghost" size="icon" data-testid={`button-delete-user-${user.id}`}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Роли в системе</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-sm">
                    {role}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация о компании</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Название компании</Label>
                  <Input id="company-name" defaultValue="Мебельная фабрика Emerald" data-testid="input-company-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-inn">ИНН</Label>
                  <Input id="company-inn" defaultValue="7701234567" data-testid="input-company-inn" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Адрес</Label>
                  <Input id="company-address" defaultValue="г. Москва, ул. Производственная, 10" data-testid="input-company-address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-phone">Телефон</Label>
                  <Input id="company-phone" defaultValue="+7 (495) 123-45-67" data-testid="input-company-phone" />
                </div>
              </div>
              <Button data-testid="button-save-company">Сохранить изменения</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Подключенные интеграции</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <p className="text-sm font-medium">Google Drive</p>
                  <p className="text-xs text-muted-foreground">Хранилище документов</p>
                </div>
                <Badge variant="default">Подключено</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <p className="text-sm font-medium">Telegram Bot</p>
                  <p className="text-xs text-muted-foreground">Уведомления монтажникам</p>
                </div>
                <Badge variant="secondary">Не настроено</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border">
                <div>
                  <p className="text-sm font-medium">Email (IMAP/SMTP)</p>
                  <p className="text-xs text-muted-foreground">Интеграция почты</p>
                </div>
                <Badge variant="secondary">Не настроено</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

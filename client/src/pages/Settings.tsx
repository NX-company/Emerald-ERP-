import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { ManageCustomFields } from "@/components/ManageCustomFields";
import { Plus, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { User, CompanySettings } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();

  const { data: users = [], isLoading: usersLoading, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: companySettings, isLoading: settingsLoading, error: settingsError } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
  });

  useEffect(() => {
    if (usersError || settingsError) {
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить настройки",
        variant: "destructive",
      });
    }
  }, [usersError, settingsError, toast]);

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
        <h1 className="text-xl md:text-2xl font-semibold">Настройки</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Управление системой и пользователями</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="company">Компания</TabsTrigger>
          <TabsTrigger value="custom-fields">Поля сделок</TabsTrigger>
          <TabsTrigger value="integrations">Интеграции</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-xs md:text-sm text-muted-foreground">Управление пользователями и их правами доступа</p>
            <div className="flex items-center gap-2">
              <Button 
                size="icon"
                className="md:hidden"
                data-testid="button-invite-user"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button 
                className="hidden md:flex"
                data-testid="button-invite-user-desktop"
              >
                <Plus className="h-4 w-4 mr-2" />
                Пригласить пользователя
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Сотрудники</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <Skeleton className="h-64" />
              ) : users.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Нет пользователей</p>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 rounded-md border hover-elevate"
                      data-testid={`user-${user.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.full_name || user.username} size="md" />
                        <div>
                          <p className="text-sm font-medium">{user.full_name || user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email || user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{user.role || "Сотрудник"}</Badge>
                        <Button variant="ghost" size="icon" data-testid={`button-delete-user-${user.id}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              {settingsLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Название компании</Label>
                      <Input 
                        id="company-name" 
                        defaultValue={companySettings?.company_name || "Мебельная фабрика Emerald"} 
                        data-testid="input-company-name" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-inn">ИНН</Label>
                      <Input 
                        id="company-inn" 
                        defaultValue={companySettings?.inn || ""} 
                        data-testid="input-company-inn" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-address">Адрес</Label>
                      <Input 
                        id="company-address" 
                        defaultValue={companySettings?.address || ""} 
                        data-testid="input-company-address" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-phone">Телефон</Label>
                      <Input 
                        id="company-phone" 
                        defaultValue={companySettings?.phone || ""} 
                        data-testid="input-company-phone" 
                      />
                    </div>
                  </div>
                  <Button data-testid="button-save-company">Сохранить изменения</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom-fields" className="mt-6">
          <ManageCustomFields />
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

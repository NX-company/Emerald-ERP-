import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { ManageCustomFields } from "@/components/ManageCustomFields";
import { UserFormDialog } from "@/components/UserFormDialog";
import { RolePermissionsDialog } from "@/components/RolePermissionsDialog";
import { Plus, Trash2, Shield, Edit, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { User, Role, CompanySettings } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [userDialogMode, setUserDialogMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User & { role?: Role } | undefined>();

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: usersWithRoles = [], isLoading: usersLoading, error: usersError } = useQuery<Array<User & { role?: Role }>>({
    queryKey: ["/api/users", { includeRoles: true }],
    queryFn: async () => {
      const response = await fetch("/api/users?includeRoles=true", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  const { data: roles = [], isLoading: rolesLoading } = useQuery<Role[]>({
    queryKey: ["/api/roles"],
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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete user");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Пользователь удален",
        description: "Пользователь успешно удален из системы",
      });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setUserDialogMode("create");
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: User & { role?: Role }) => {
    setSelectedUser(user);
    setUserDialogMode("edit");
    setUserDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleViewRolePermissions = (role: Role) => {
    setSelectedRole(role);
    setRoleDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold">Настройки</h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">Управление системой и пользователями</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="overflow-x-auto">
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="roles">Роли и права</TabsTrigger>
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
                onClick={handleCreateUser}
                data-testid="button-invite-user"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                className="hidden md:flex"
                onClick={handleCreateUser}
                data-testid="button-invite-user-desktop"
              >
                <Plus className="h-4 w-4 mr-2" />
                Добавить пользователя
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
              ) : usersWithRoles.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Нет пользователей</p>
              ) : (
                <div className="space-y-3">
                  {usersWithRoles.map((user) => (
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
                        {!user.is_active && (
                          <Badge variant="destructive">Неактивен</Badge>
                        )}
                        <Badge variant="secondary">
                          {user.role?.name || "Без роли"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user)}
                          data-testid={`button-delete-user-${user.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-6 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <p className="text-xs md:text-sm text-muted-foreground">
              Управление ролями и их правами доступа к модулям системы
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Роли в системе</CardTitle>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <Skeleton className="h-64" />
              ) : roles.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">Нет ролей</p>
              ) : (
                <div className="space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-4 rounded-md border hover-elevate"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{role.name}</p>
                            {role.is_system && (
                              <Badge variant="outline" className="text-xs">
                                Системная
                              </Badge>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {role.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewRolePermissions(role)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Права доступа
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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

      <UserFormDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={selectedUser}
        mode={userDialogMode}
      />

      <RolePermissionsDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={selectedRole}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить пользователя {userToDelete?.full_name || userToDelete?.username}?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

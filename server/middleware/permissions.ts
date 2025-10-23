import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users, roles, role_permissions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export type PermissionType = "can_create_deals" | "can_edit_deals" | "can_delete_deals";

export function checkPermission(permission: PermissionType) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get userId from header or query parameter
      // In production, this should come from authenticated session
      const userId = req.header("X-User-Id") || req.query.userId as string;

      if (!userId) {
        return res.status(401).json({
          error: "Не авторизован",
          message: "User ID not provided"
        });
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId));

      if (!user) {
        return res.status(401).json({ error: "Пользователь не найден" });
      }

      // Admin user has all permissions
      if (user.username === 'admin') {
        (req as any).currentUser = user;
        return next();
      }

      // Check permissions through role_permissions table
      if (user.role_id) {
        const [rolePermission] = await db
          .select()
          .from(role_permissions)
          .where(
            and(
              eq(role_permissions.role_id, user.role_id),
              eq(role_permissions.module, 'deals')
            )
          );

        // Map permission names to role_permissions fields
        const permissionField = permission === 'can_create_deals' ? 'can_create' :
                               permission === 'can_edit_deals' ? 'can_edit' :
                               permission === 'can_delete_deals' ? 'can_delete' : null;

        if (rolePermission && permissionField && rolePermission[permissionField]) {
          // Store user in request for later use
          (req as any).currentUser = user;
          return next();
        }
      }

      // If no role or no permission, deny access
      return res.status(403).json({
        error: "Доступ запрещен",
        message: `У вас нет прав для этого действия`
      });
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Ошибка проверки прав доступа" });
    }
  };
}

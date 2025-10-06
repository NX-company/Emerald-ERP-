import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

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

      if (!user[permission]) {
        return res.status(403).json({ 
          error: "Доступ запрещен",
          message: `У вас нет прав для этого действия`
        });
      }

      // Store user in request for later use
      (req as any).currentUser = user;
      
      next();
    } catch (error) {
      console.error("Permission check error:", error);
      res.status(500).json({ error: "Ошибка проверки прав доступа" });
    }
  };
}

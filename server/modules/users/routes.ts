import { Router } from "express";
import { usersRepository } from "./repository";
import { insertUserSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export const router = Router();

// GET /api/users - Get all users
router.get("/api/users", async (req, res) => {
  try {
    const users = await usersRepository.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// GET /api/users/:id - Get user by ID
router.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await usersRepository.getUser(id);
    
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// PUT /api/users/:id - Update user
router.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const validationResult = insertUserSchema.partial().safeParse(req.body);
    
    if (!validationResult.success) {
      const errorMessage = fromZodError(validationResult.error).toString();
      res.status(400).json({ error: errorMessage });
      return;
    }
    
    if (validationResult.data.password !== undefined && validationResult.data.password.trim() === "") {
      res.status(400).json({ error: "Password cannot be empty" });
      return;
    }
    
    const updatedUser = await usersRepository.updateUser(id, validationResult.data);
    
    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/users/:id - Delete user
router.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await usersRepository.deleteUser(id);
    
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

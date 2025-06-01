import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("freemium"), // "freemium" | "premium"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  morphology: text("morphology").notNull(),
  skinTone: text("skin_tone").notNull(),
  preferredStyles: text("preferred_styles").array().notNull(),
  size: text("size").notNull(),
  colorPalette: text("color_palette").array().notNull(),
  restrictions: text("restrictions").array().notNull(),
});

export const clothingItems = pgTable("clothing_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(), // "hauts" | "bas" | "chaussures" | "accessoires"
  color: text("color").notNull(),
  material: text("material").notNull(),
  formality: integer("formality").notNull().default(3),
  imagePath: text("image_path"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const outfitRecommendations = pgTable("outfit_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  items: jsonb("items").notNull(), // Array of clothing item IDs with details
  colorPalette: text("color_palette").array().notNull(),
  justification: text("justification").notNull(),
  weatherContext: jsonb("weather_context"),
  eventType: text("event_type"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dailyUsage = pgTable("daily_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  recommendationsCount: integer("recommendations_count").notNull().default(0),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
});

export const insertClothingItemSchema = createInsertSchema(clothingItems).omit({
  id: true,
  createdAt: true,
});

export const insertOutfitRecommendationSchema = createInsertSchema(outfitRecommendations).omit({
  id: true,
  createdAt: true,
});

export const insertDailyUsageSchema = createInsertSchema(dailyUsage).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type ClothingItem = typeof clothingItems.$inferSelect;
export type InsertClothingItem = z.infer<typeof insertClothingItemSchema>;
export type OutfitRecommendation = typeof outfitRecommendations.$inferSelect;
export type InsertOutfitRecommendation = z.infer<typeof insertOutfitRecommendationSchema>;
export type DailyUsage = typeof dailyUsage.$inferSelect;
export type InsertDailyUsage = z.infer<typeof insertDailyUsageSchema>;

// Additional validation schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const generateRecommendationSchema = z.object({
  eventType: z.string(),
  location: z.string(),
  stylePreference: z.string().optional(),
});

export const authResponseSchema = z.object({
  user: z.object({
    id: z.number(),
    email: z.string(),
    name: z.string(),
    type: z.string(),
  }),
  token: z.string(),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type GenerateRecommendationRequest = z.infer<typeof generateRecommendationSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;

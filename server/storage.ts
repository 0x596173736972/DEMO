import { 
  users, userProfiles, clothingItems, outfitRecommendations, dailyUsage,
  type User, type InsertUser, type UserProfile, type InsertUserProfile, 
  type ClothingItem, type InsertClothingItem, type OutfitRecommendation, 
  type InsertOutfitRecommendation, type DailyUsage, type InsertDailyUsage
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // User Profiles
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: number, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  // Clothing Items
  getUserClothingItems(userId: number): Promise<ClothingItem[]>;
  getClothingItem(id: number): Promise<ClothingItem | undefined>;
  createClothingItem(item: InsertClothingItem): Promise<ClothingItem>;
  deleteClothingItem(id: number, userId: number): Promise<boolean>;

  // Outfit Recommendations
  getUserRecommendations(userId: number): Promise<OutfitRecommendation[]>;
  createRecommendation(recommendation: InsertOutfitRecommendation): Promise<OutfitRecommendation>;
  toggleFavoriteRecommendation(id: number, userId: number): Promise<boolean>;

  // Daily Usage
  getDailyUsage(userId: number, date: string): Promise<DailyUsage | undefined>;
  updateDailyUsage(userId: number, date: string): Promise<DailyUsage>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userProfiles: Map<number, UserProfile>;
  private clothingItems: Map<number, ClothingItem>;
  private outfitRecommendations: Map<number, OutfitRecommendation>;
  private dailyUsage: Map<string, DailyUsage>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.clothingItems = new Map();
    this.outfitRecommendations = new Map();
    this.dailyUsage = new Map();
    this.currentId = 1;

    // Initialize with demo user (async)
    this.initializeDemoData().catch(console.error);
  }

  private async initializeDemoData() {
    // Hash the demo password
    const hashedPassword = await bcrypt.hash("password123", 10);

    const demoUser: User = {
      id: 1,
      email: "demo@ankhara.com",
      password: hashedPassword,
      name: "Alex Johnson",
      type: "premium",
      createdAt: new Date(),
    };
    this.users.set(1, demoUser);

    const demoProfile: UserProfile = {
      id: 1,
      userId: 1,
      morphology: "triangle inversé",
      skinTone: "#FFDAB9",
      preferredStyles: ["élégant", "casual"],
      size: "M",
      colorPalette: ["#FF5E5B", "#3F88C5", "#F49D37"],
      restrictions: ["pas de motifs fluorescents"],
    };
    this.userProfiles.set(1, demoProfile);

    // Add demo clothing items with stylish images
    const demoClothingItems: ClothingItem[] = [
      {
        id: 1,
        userId: 1,
        name: "T-shirt blanc",
        category: "hauts",
        color: "#FFFFFF",
        material: "coton",
        formality: 2,
        imagePath: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&crop=center",
        createdAt: new Date(),
      },
      {
        id: 2,
        userId: 1,
        name: "Jean bleu",
        category: "bas",
        color: "#4682B4",
        material: "denim",
        formality: 2,
        imagePath: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&crop=center",
        createdAt: new Date(),
      },
      {
        id: 3,
        userId: 1,
        name: "Sneakers blanches",
        category: "chaussures",
        color: "#FFFFFF",
        material: "cuir",
        formality: 2,
        imagePath: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&crop=center",
        createdAt: new Date(),
      },
      {
        id: 4,
        userId: 1,
        name: "Chemise bleue",
        category: "hauts",
        color: "#3F88C5",
        material: "coton",
        formality: 4,
        imagePath: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop&crop=center",
        createdAt: new Date(),
      },
      {
        id: 5,
        userId: 1,
        name: "Pantalon chino",
        category: "bas",
        color: "#8B4513",
        material: "coton",
        formality: 4,
        imagePath: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop&crop=center",
        createdAt: new Date(),
      },
      {
        id: 6,
        userId: 1,
        name: "Chaussures en cuir",
        category: "chaussures",
        color: "#000000",
        material: "cuir",
        formality: 5,
        imagePath: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=400&fit=crop&crop=center",
        createdAt: new Date(),
      },
      {
        id: 7,
        userId: 1,
        name: "Pull en cachemire",
        category: "hauts",
        color: "#FF5E5B",
        material: "cashmere",
        formality: 4,
        imagePath: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=400&fit=crop&crop=center",
        createdAt: new Date(),
      },
      {
        id: 8,
        userId: 1,
        name: "Jupe noire",
        category: "bas",
        color: "#000000",
        material: "polyester",
        formality: 4,
        imagePath: null,
        createdAt: new Date(),
      }
    ];

    demoClothingItems.forEach(item => {
      this.clothingItems.set(item.id, item);
    });

    this.currentId = 9;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      type: insertUser.type || "freemium",
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    return Array.from(this.userProfiles.values()).find(profile => profile.userId === userId);
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const id = this.currentId++;
    const userProfile: UserProfile = { ...profile, id };
    this.userProfiles.set(id, userProfile);
    return userProfile;
  }

  async updateUserProfile(userId: number, profileUpdate: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const existing = await this.getUserProfile(userId);
    if (!existing) return undefined;

    const updated: UserProfile = { ...existing, ...profileUpdate };
    this.userProfiles.set(existing.id, updated);
    return updated;
  }

  async getUserClothingItems(userId: number): Promise<ClothingItem[]> {
    return Array.from(this.clothingItems.values()).filter(item => item.userId === userId);
  }

  async getClothingItem(id: number): Promise<ClothingItem | undefined> {
    return this.clothingItems.get(id);
  }

  async createClothingItem(item: InsertClothingItem): Promise<ClothingItem> {
    const id = this.currentId++;
    const clothingItem: ClothingItem = { 
      ...item, 
      id, 
      formality: item.formality || 3,
      imagePath: item.imagePath || null,
      createdAt: new Date() 
    };
    this.clothingItems.set(id, clothingItem);
    return clothingItem;
  }

  async deleteClothingItem(id: number, userId: number): Promise<boolean> {
    const item = this.clothingItems.get(id);
    if (!item || item.userId !== userId) return false;

    return this.clothingItems.delete(id);
  }

  async getUserRecommendations(userId: number): Promise<OutfitRecommendation[]> {
    return Array.from(this.outfitRecommendations.values())
      .filter(rec => rec.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createRecommendation(recommendation: InsertOutfitRecommendation): Promise<OutfitRecommendation> {
    const id = this.currentId++;
    const outfitRecommendation: OutfitRecommendation = { 
      ...recommendation, 
      id, 
      eventType: recommendation.eventType || null,
      weatherContext: recommendation.weatherContext || null,
      isFavorite: recommendation.isFavorite || false,
      createdAt: new Date() 
    };
    this.outfitRecommendations.set(id, outfitRecommendation);
    return outfitRecommendation;
  }

  async toggleFavoriteRecommendation(id: number, userId: number): Promise<boolean> {
    const recommendation = this.outfitRecommendations.get(id);
    if (!recommendation || recommendation.userId !== userId) return false;

    recommendation.isFavorite = !recommendation.isFavorite;
    this.outfitRecommendations.set(id, recommendation);
    return true;
  }

  async getDailyUsage(userId: number, date: string): Promise<DailyUsage | undefined> {
    const key = `${userId}-${date}`;
    return this.dailyUsage.get(key);
  }

  async updateDailyUsage(userId: number, date: string): Promise<DailyUsage> {
    const key = `${userId}-${date}`;
    const existing = this.dailyUsage.get(key);

    if (existing) {
      existing.recommendationsCount++;
      this.dailyUsage.set(key, existing);
      return existing;
    } else {
      const id = this.currentId++;
      const newUsage: DailyUsage = {
        id,
        userId,
        date,
        recommendationsCount: 1,
      };
      this.dailyUsage.set(key, newUsage);
      return newUsage;
    }
  }
}

export const storage = new MemStorage();
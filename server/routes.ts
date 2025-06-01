import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  loginSchema, 
  insertUserSchema, 
  insertUserProfileSchema, 
  insertClothingItemSchema,
  generateRecommendationSchema,
  type AuthResponse 
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "ankhara_secret_key";
const upload = multer({ 
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Helper to call Python services
const callPythonService = (scriptName: string, args: any[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    // Try different Python executables that might be available
    const pythonCommands = ['python3', 'python', 'python3.11', 'python3.10'];
    let pythonCmd = 'python3';
    
    // For now, let's use a simple approach and try python3 first
    const python = spawn(pythonCmd, [path.join(__dirname, scriptName), ...args]);
    let data = '';
    let error = '';

    python.stdout.on('data', (chunk) => {
      data += chunk;
    });

    python.stderr.on('data', (chunk) => {
      error += chunk;
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python service error: ${error || 'Unknown error'}`));
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      }
    });

    python.on('error', (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure images directory exists
  const imagesDir = path.join(process.cwd(), "images");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  // Serve uploaded images
  app.use("/images", (req, res, next) => {
    // Add security headers for images
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  }, express.static(imagesDir));

  // CORS middleware
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Generate token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type,
        },
        token,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          type: user.type,
        },
        token,
      };

      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User profile routes
  app.get("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const profile = await storage.getUserProfile(req.user.userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      res.json(profile);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/profile", authenticateToken, async (req: any, res) => {
    try {
      const profileData = insertUserProfileSchema.parse({
        ...req.body,
        userId: req.user.userId,
      });
      
      const existingProfile = await storage.getUserProfile(req.user.userId);
      
      let profile;
      if (existingProfile) {
        profile = await storage.updateUserProfile(req.user.userId, profileData);
      } else {
        profile = await storage.createUserProfile(profileData);
      }
      
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clothing items routes
  app.get("/api/user/clothing", authenticateToken, async (req: any, res) => {
    try {
      const items = await storage.getUserClothingItems(req.user.userId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user/clothing", authenticateToken, upload.single("image"), async (req: any, res) => {
    try {
      const itemData = insertClothingItemSchema.parse({
        ...req.body,
        userId: req.user.userId,
        formality: parseInt(req.body.formality) || 3,
      });

      let imagePath = null;
      if (req.file) {
        // Create user-specific directory
        const userDir = path.join(imagesDir, req.user.userId.toString());
        if (!fs.existsSync(userDir)) {
          fs.mkdirSync(userDir, { recursive: true });
        }

        // Move file to permanent location
        const fileName = `${Date.now()}_${req.file.originalname}`;
        const finalPath = path.join(userDir, fileName);
        fs.renameSync(req.file.path, finalPath);
        imagePath = `/images/${req.user.userId}/${fileName}`;
      }

      const item = await storage.createClothingItem({
        ...itemData,
        imagePath,
      });

      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/user/clothing/:id", authenticateToken, async (req: any, res) => {
    try {
      const itemId = parseInt(req.params.id);
      const success = await storage.deleteClothingItem(itemId, req.user.userId);
      
      if (!success) {
        return res.status(404).json({ message: "Item not found" });
      }

      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Weather route
  app.get("/api/weather/:location", async (req, res) => {
    try {
      const location = req.params.location;
      
      // Call Python weather service
      const weatherData = await callPythonService("weather_service.py", [location]);
      
      if (!weatherData) {
        return res.status(404).json({ message: "Weather data not available" });
      }

      res.json(weatherData);
    } catch (error) {
      console.error("Weather service error:", error);
      // Return fallback weather data
      const fallbackWeather = {
        location: req.params.location,
        temperature: 20,
        condition: "partly_cloudy",
        description: "Weather data unavailable",
        humidity: 50,
        wind_speed: 10,
        timestamp: new Date().toISOString()
      };
      res.json(fallbackWeather);
    }
  });

  // Clothing analysis endpoint using Gemini Vision
  app.post("/api/analyze-clothing", async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      // Extraire la partie base64 de l'image
      const base64Data = imageUrl.split(',')[1];
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDjZbG1OnO6xqeLeKrw_BU4q-2SUbv3XWo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `Analysez cette image de vêtement et retournez UNIQUEMENT un JSON avec cette structure exacte :
{
  "category": "hauts|bas|chaussures|accessoires",
  "name": "nom précis du vêtement en français",
  "color": "couleur hexadécimale #XXXXXX de la couleur principale",
  "material": "matière principale (coton, laine, denim, cuir, polyester, etc.)",
  "formality": 1-5 (1=très décontracté, 5=très formel)
}

Catégories :
- hauts: t-shirt, chemise, pull, veste, blazer, sweat, top
- bas: jean, pantalon, short, jupe, legging
- chaussures: baskets, chaussures de ville, bottes, sandales
- accessoires: sac, ceinture, chapeau, bijoux

Analysez précisément l'image et retournez SEULEMENT le JSON valide, rien d'autre.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      
      // Nettoyer la réponse pour extraire le JSON
      let cleanContent = content.trim();
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.split('```json')[1].split('```')[0].trim();
      } else if (cleanContent.includes('```')) {
        cleanContent = cleanContent.split('```')[1].split('```')[0].trim();
      }
      
      const analysis = JSON.parse(cleanContent);
      
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing clothing:", error);
      res.status(500).json({ 
        error: "Failed to analyze clothing",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Recommendations routes
  app.post("/api/recommendations", authenticateToken, async (req: any, res) => {
    try {
      const { eventType, location, stylePreference } = generateRecommendationSchema.parse(req.body);
      
      // Check quota
      const today = new Date().toISOString().split('T')[0];
      const dailyUsage = await storage.getDailyUsage(req.user.userId, today);
      const user = await storage.getUser(req.user.userId);
      
      const maxRecommendations = user?.type === "premium" ? 8 : 3;
      const currentUsage = dailyUsage?.recommendationsCount || 0;
      
      if (currentUsage >= maxRecommendations) {
        return res.status(429).json({ 
          message: "Daily recommendation limit reached",
          limit: maxRecommendations,
          used: currentUsage
        });
      }

      // Get user's clothing items and profile
      const clothingItems = await storage.getUserClothingItems(req.user.userId);
      const userProfile = await storage.getUserProfile(req.user.userId);
      
      if (clothingItems.length === 0) {
        return res.status(400).json({ message: "No clothing items found. Please add some items to your wardrobe first." });
      }

      // Get weather data
      let weatherData;
      try {
        weatherData = await callPythonService("weather_service.py", [location]);
      } catch (error) {
        console.error("Weather service fallback:", error);
        weatherData = {
          location: location,
          temperature: 20,
          condition: "partly_cloudy",
          description: "Weather data unavailable",
          humidity: 50,
          wind_speed: 10,
          timestamp: new Date().toISOString()
        };
      }

      // Generate AI recommendations with fallback
      let recommendations;
      try {
        recommendations = await callPythonService("ai_recommendations.py", [
          JSON.stringify(weatherData),
          eventType,
          JSON.stringify(clothingItems),
          JSON.stringify(userProfile)
        ]);
        
        if (recommendations.error) {
          throw new Error(recommendations.error);
        }
      } catch (error) {
        console.error("AI recommendations error:", error);
        console.error("Error details:", {
          message: error.message,
          stack: error.stack
        });
        
        // Create smart fallback recommendation based on weather and wardrobe
        const temp = weatherData.temp || 20;
        const isWarm = temp > 20;
        const isCold = temp < 15;
        
        const tops = clothingItems.filter(item => item.category === 'hauts');
        const bottoms = clothingItems.filter(item => item.category === 'bas');
        const shoes = clothingItems.filter(item => item.category === 'chaussures');
        
        // Smart fallback that creates proper outfit structure
        const selectedItems = [];
        if (tops.length > 0) selectedItems.push(tops[0]);
        if (bottoms.length > 0) selectedItems.push(bottoms[0]);
        if (shoes.length > 0) selectedItems.push(shoes[0]);
        
        recommendations = {
          outfits: [{
            name: `${eventType} outfit for ${weatherData.conditions || 'current weather'}`,
            items: selectedItems.map(item => ({
              id: item.id,
              category: item.category,
              name: item.name
            })),
            color_palette: selectedItems.map(item => item.color).slice(0, 3),
            justification: `Perfect ${eventType} look combining comfort and style${isCold ? '. Layer up for warmth!' : isWarm ? '. Light and breathable pieces!' : '.'} Ideal for ${temp}°C ${weatherData.conditions || 'weather'}.`
          }]
        };
      }

      // Save recommendations and update usage
      const savedRecommendations = [];
      for (const outfit of recommendations.outfits) {
        // Get full item details for the outfit
        const fullItems = [];
        for (const outfitItem of outfit.items) {
          // Handle both ID-based and object-based items
          const itemId = typeof outfitItem === 'object' ? outfitItem.id : outfitItem;
          const item = clothingItems.find(item => item.id === itemId);
          if (item) {
            // Ensure all item properties including imagePath are preserved
            fullItems.push({
              id: item.id,
              name: item.name,
              category: item.category,
              color: item.color,
              material: item.material,
              formality: item.formality,
              imagePath: item.imagePath,
              userId: item.userId,
              createdAt: item.createdAt
            });
          }
        }
        
        const savedRec = await storage.createRecommendation({
          userId: req.user.userId,
          name: outfit.name,
          items: fullItems,
          colorPalette: outfit.color_palette || [],
          justification: outfit.justification || outfit.style_notes || 'AI generated outfit recommendation',
          weatherContext: weatherData,
          eventType,
          isFavorite: false,
        });
        savedRecommendations.push(savedRec);
      }

      // Update daily usage
      await storage.updateDailyUsage(req.user.userId, today);

      res.json({
        recommendations: savedRecommendations,
        weatherContext: weatherData,
        quotaUsed: currentUsage + 1,
        quotaLimit: maxRecommendations,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/recommendations", authenticateToken, async (req: any, res) => {
    try {
      const recommendations = await storage.getUserRecommendations(req.user.userId);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/recommendations/:id/favorite", authenticateToken, async (req: any, res) => {
    try {
      const recommendationId = parseInt(req.params.id);
      const success = await storage.toggleFavoriteRecommendation(recommendationId, req.user.userId);
      
      if (!success) {
        return res.status(404).json({ message: "Recommendation not found" });
      }

      res.json({ message: "Favorite status updated" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User quota route
  app.get("/api/user/quota", authenticateToken, async (req: any, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyUsage = await storage.getDailyUsage(req.user.userId, today);
      const user = await storage.getUser(req.user.userId);
      
      const maxRecommendations = user?.type === "premium" ? 8 : 3;
      const used = dailyUsage?.recommendationsCount || 0;
      
      res.json({
        used,
        limit: maxRecommendations,
        remaining: maxRecommendations - used,
        userType: user?.type || "freemium",
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

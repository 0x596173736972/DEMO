import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Brain } from "lucide-react";
import type { OutfitRecommendation } from "@shared/schema";
import { cn } from "@/lib/utils";

interface OutfitCardProps {
  outfit: OutfitRecommendation;
  onToggleFavorite?: (id: number) => void;
  onShare?: (id: number) => void;
}

export function OutfitCard({ outfit, onToggleFavorite, onShare }: OutfitCardProps) {
  return (
    <Card className="outfit-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">{outfit.name}</h3>
          <div className="flex items-center space-x-2">
            {onToggleFavorite && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onToggleFavorite(outfit.id)}
                className={cn(
                  "border-gray-300 hover:border-accent",
                  outfit.isFavorite && "border-accent bg-accent/5"
                )}
              >
                <Heart
                  className={cn(
                    "w-4 h-4",
                    outfit.isFavorite ? "fill-accent text-accent" : "text-gray-400"
                  )}
                />
              </Button>
            )}
            
            {onShare && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onShare(outfit.id)}
                className="border-gray-300 hover:border-accent"
              >
                <Share2 className="w-4 h-4 text-gray-400" />
              </Button>
            )}
          </div>
        </div>

        {/* Outfit Items */}
        <div className="outfit-items-grid mb-4">
          {Array.isArray(outfit.items) && outfit.items.map((item: any, index: number) => {
            console.log('Outfit item:', item); // Debug log
            return (
              <div key={index} className="text-center">
                <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 overflow-hidden">
                  {item.imagePath ? (
                    <img
                      src={item.imagePath}
                      alt={item.name || 'Clothing item'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load:', item.imagePath);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <p className="text-xs font-medium truncate">{item.name || 'Unnamed Item'}</p>
                <p className="text-xs text-gray-500 truncate">{item.category || 'Unknown'}</p>
              </div>
            );
          })}
        </div>

        {/* Color Palette */}
        {outfit.colorPalette && outfit.colorPalette.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Color Palette</p>
            <div className="flex space-x-2">
              {outfit.colorPalette.map((color, index) => (
                <div
                  key={index}
                  className="color-dot"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        {/* AI Justification */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-medium text-sm mb-2 flex items-center">
            <Brain className="w-4 h-4 text-accent mr-2" />
            Style Analysis
          </h4>
          <p className="text-sm text-gray-600">{outfit.justification}</p>
        </div>

        {/* Weather Context */}
        {outfit.weatherContext && (
          <div className="mt-3 text-xs text-gray-500 text-center">
            Generated for {outfit.eventType} • {(outfit.weatherContext as any).temp}°C • {(outfit.weatherContext as any).conditions}
          </div>
        )}
      </div>
    </Card>
  );
}

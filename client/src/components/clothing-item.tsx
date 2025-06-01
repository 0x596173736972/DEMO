import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2 } from "lucide-react";
import type { ClothingItem } from "@shared/schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClothingItemCardProps {
  item: ClothingItem;
  onDelete?: (id: number) => void;
}

export function ClothingItemCard({ item, onDelete }: ClothingItemCardProps) {
  const categoryLabels = {
    hauts: "Tops",
    bas: "Bottoms", 
    chaussures: "Shoes",
    accessoires: "Accessories",
  };

  return (
    <Card className="ankhara-card clothing-item">
      {item.imagePath && (
        <div className="aspect-square w-full overflow-hidden rounded-t-xl">
          <img
            src={item.imagePath}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm truncate">{item.name}</h4>
          <div
            className="color-dot flex-shrink-0"
            style={{ backgroundColor: item.color }}
          />
        </div>
        
        <p className="text-xs text-gray-500 mb-1">
          {categoryLabels[item.category as keyof typeof categoryLabels]} • {item.material}
        </p>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className={`w-1 h-1 rounded-full ${
                  i < item.formality ? "bg-accent" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onDelete(item.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </Card>
  );
}

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ClothingItemCard } from "@/components/clothing-item";
import { FileUpload } from "@/components/file-upload";
import { clothingApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { analyzeClothingImage, convertImageToUrl } from "@/lib/clothing-recognition";
import { Plus, Filter, Shirt, Zap, Brain } from "lucide-react";
import type { ClothingItem } from "@shared/schema";

const categories = [
  { value: "all", label: "All Items", icon: "grid" },
  { value: "hauts", label: "Tops", icon: "shirt" },
  { value: "bas", label: "Bottoms", icon: "package" },
  { value: "chaussures", label: "Shoes", icon: "footprints" },
  { value: "accessoires", label: "Accessories", icon: "watch" },
];

const materials = [
  "cotton", "wool", "silk", "linen", "denim", "leather", "synthetic", "polyester", "cashmere"
];

export default function WardrobePage() {
  const { toast } = useToast();
  
  const [activeFilter, setActiveFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    color: "#000000",
    material: "",
    formality: 3,
  });

  const { data: clothingItems = [], isLoading } = useQuery({
    queryKey: ["/api/user/clothing"],
    queryFn: () => clothingApi.getItems(),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ itemData, imageFile }: { itemData: any; imageFile?: File }) => 
      clothingApi.addItem(itemData, imageFile),
    onSuccess: () => {
      toast({ title: "Item added!", description: "Your clothing item has been added to your wardrobe." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/clothing"] });
      setIsAddModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to add item",
        description: error instanceof Error ? error.message : "Could not add item",
        variant: "destructive",
      });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => clothingApi.deleteItem(id),
    onSuccess: () => {
      toast({ title: "Item deleted", description: "Item removed from your wardrobe." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/clothing"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete item",
        description: error instanceof Error ? error.message : "Could not delete item",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      color: "#000000",
      material: "",
      formality: 3,
    });
    setSelectedFile(null);
    setIsAnalyzing(false);
  };

  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      setIsAnalyzing(true);
      toast({
        title: "🧠 Analyse en cours...",
        description: "L'IA analyse votre vêtement pour remplir automatiquement les champs.",
      });

      try {
        // Convertir l'image en URL pour l'analyse
        const imageUrl = await convertImageToUrl(file);
        
        // Analyser l'image avec Puter.ai
        const analysis = await analyzeClothingImage(imageUrl);
        
        // Remplir automatiquement les champs
        setFormData({
          name: analysis.name,
          category: analysis.category,
          color: analysis.color,
          material: analysis.material,
          formality: analysis.formality,
        });

        toast({
          title: "✨ Analyse terminée !",
          description: `Vêtement détecté : ${analysis.name}. Vous pouvez modifier les champs si nécessaire.`,
        });
      } catch (error) {
        console.error('Erreur lors de l\'analyse:', error);
        toast({
          title: "Analyse impossible",
          description: "Impossible d'analyser l'image. Veuillez remplir les champs manuellement.",
          variant: "destructive",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.material) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    addItemMutation.mutate({
      itemData: formData,
      imageFile: selectedFile || undefined,
    });
  };

  const filteredItems = clothingItems.filter((item: ClothingItem) => 
    activeFilter === "all" || item.category === activeFilter
  );

  if (isLoading) {
    return (
      <div className="mobile-container pt-20 pb-20 section-spacing">
        <div className="loading-shimmer h-8 w-32 rounded mb-4"></div>
        <div className="clothing-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="loading-shimmer h-48 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pt-20 pb-20 section-spacing">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">My Wardrobe</h2>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
            {clothingItems.length} items
          </span>
        </div>
        <p className="text-gray-600">Upload and organize your clothing collection.</p>
      </div>

      {/* Add New Item Card */}
      <Card className="ankhara-card p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1 flex items-center">
              <Plus className="w-5 h-5 text-accent mr-2" />
              Add New Item
            </h3>
            <p className="text-sm text-gray-600">Upload photos and organize your clothes</p>
          </div>
          
          <Sheet open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <SheetTrigger asChild>
              <Button className="ankhara-button">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Add New Item</SheetTitle>
              </SheetHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    accept="image/*"
                    maxSize={10 * 1024 * 1024}
                  />
                  {isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                      <Brain className="w-4 h-4 animate-pulse" />
                      <span>Analyse automatique en cours...</span>
                    </div>
                  )}
                  {selectedFile && !isAnalyzing && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                      <Zap className="w-4 h-4" />
                      <span>Image analysée ! Les champs ont été remplis automatiquement.</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., White Cotton T-Shirt"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger className="form-select">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hauts">Tops</SelectItem>
                          <SelectItem value="bas">Bottoms</SelectItem>
                          <SelectItem value="chaussures">Shoes</SelectItem>
                          <SelectItem value="accessoires">Accessories</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="color">Color</Label>
                      <input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full h-12 border border-gray-200 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="material">Material *</Label>
                    <Select 
                      value={formData.material} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, material: value }))}
                    >
                      <SelectTrigger className="form-select">
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials.map(material => (
                          <SelectItem key={material} value={material}>
                            {material.charAt(0).toUpperCase() + material.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="formality">Formality Level: {formData.formality}/5</Label>
                    <input
                      id="formality"
                      type="range"
                      min="1"
                      max="5"
                      value={formData.formality}
                      onChange={(e) => setFormData(prev => ({ ...prev, formality: parseInt(e.target.value) }))}
                      className="w-full mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Casual</span>
                      <span>Formal</span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 ankhara-button"
                    disabled={addItemMutation.isPending}
                  >
                    {addItemMutation.isPending ? "Adding..." : "Add Item"}
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-50 rounded-xl p-1 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category.value}
            onClick={() => setActiveFilter(category.value)}
            className={`flex-shrink-0 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === category.value
                ? "bg-white text-black shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Wardrobe Grid */}
      {filteredItems.length === 0 ? (
        <Card className="ankhara-card p-8 text-center">
          <Shirt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600 mb-4">
            {activeFilter === "all" 
              ? "Start building your wardrobe by adding your first item."
              : `No items in the ${categories.find(c => c.value === activeFilter)?.label.toLowerCase()} category yet.`
            }
          </p>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="ankhara-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Item
          </Button>
        </Card>
      ) : (
        <div className="clothing-grid">
          {filteredItems.map((item: ClothingItem) => (
            <ClothingItemCard
              key={item.id}
              item={item}
              onDelete={(id) => deleteItemMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

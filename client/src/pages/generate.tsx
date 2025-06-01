import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OutfitCard } from "@/components/outfit-card";
import { Zap, MapPin, Calendar, Palette, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { recommendationsApi, clothingApi, quotaApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { OutfitRecommendation } from "@shared/schema";

export default function GeneratePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [location, setLocationInput] = useState("Paris");
  const [eventType, setEventType] = useState("");
  const [stylePreference, setStylePreference] = useState("");
  const [freshRecommendations, setFreshRecommendations] = useState<OutfitRecommendation[]>([]);

  // Get user's clothing items to check if they have any
  const { data: clothingItems = [] } = useQuery({
    queryKey: ["/api/user/clothing"],
    queryFn: () => clothingApi.getItems(),
  });

  // Get quota information
  const { data: quota } = useQuery({
    queryKey: ["/api/user/quota"],
    queryFn: () => quotaApi.getQuota(),
  });

  const generateMutation = useMutation({
    mutationFn: (data: { eventType: string; location: string; stylePreference: string }) =>
      recommendationsApi.generate(data.eventType, data.location, data.stylePreference),
    onSuccess: (response) => {
      setFreshRecommendations(response.recommendations);
      queryClient.invalidateQueries({ queryKey: ["/api/user/quota"] });
      toast({
        title: "Outfits generated!",
        description: `${response.recommendations.length} outfit${response.recommendations.length !== 1 ? 's' : ''} created for your ${eventType}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation failed",
        description: error.response?.data?.message || "Failed to generate outfits. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (!eventType) {
      toast({
        title: "Missing information",
        description: "Please select an event type.",
        variant: "destructive",
      });
      return;
    }

    if (clothingItems.length === 0) {
      toast({
        title: "No clothing items",
        description: "Please add some clothing items to your wardrobe first.",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({ eventType, location, stylePreference });
  };

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: number) => recommendationsApi.toggleFavorite(id),
    onSuccess: () => {
      setFreshRecommendations(prev => 
        prev.map(rec => 
          rec.id === toggleFavoriteMutation.variables 
            ? { ...rec, isFavorite: !rec.isFavorite }
            : rec
        )
      );
      toast({ title: "Updated!", description: "Favorite status updated." });
    },
  });

  return (
    <div className="mobile-container pt-20 pb-20 section-spacing">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
          className="mr-3"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Generate Outfits</h2>
          <p className="text-sm text-gray-600">
            {quota ? `${quota.remaining} of ${quota.limit} generations remaining today` : ''}
          </p>
        </div>
      </div>

      {clothingItems.length === 0 && (
        <Card className="ankhara-card p-6 mb-6 border-amber-200 bg-amber-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center">
              <Palette className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-amber-800">Add clothing items first</h3>
              <p className="text-sm text-amber-700">
                You need to add some clothing items to your wardrobe before generating outfits.
              </p>
            </div>
          </div>
          <Button
            onClick={() => setLocation("/wardrobe")}
            className="mt-4 bg-amber-600 hover:bg-amber-700"
          >
            Go to Wardrobe
          </Button>
        </Card>
      )}

      <Card className="ankhara-card p-6 mb-6">
        <div className="space-y-6">
          {/* Location Input */}
          <div>
            <Label htmlFor="location" className="flex items-center space-x-2 mb-2">
              <MapPin className="w-4 h-4 text-accent" />
              <span>Location</span>
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Enter your city (e.g., Paris, London)"
              className="border-gray-200 focus:border-accent"
            />
          </div>

          {/* Event Type */}
          <div>
            <Label htmlFor="event-type" className="flex items-center space-x-2 mb-2">
              <Calendar className="w-4 h-4 text-accent" />
              <span>Event Type</span>
            </Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="border-gray-200 focus:border-accent">
                <SelectValue placeholder="Select an event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="travail">Work</SelectItem>
                <SelectItem value="décontracté">Casual</SelectItem>
                <SelectItem value="soirée">Evening/Party</SelectItem>
                <SelectItem value="sport">Sport/Active</SelectItem>
                <SelectItem value="rendez-vous">Date</SelectItem>
                <SelectItem value="formel">Formal</SelectItem>
                <SelectItem value="voyage">Travel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Style Preference */}
          <div>
            <Label htmlFor="style" className="flex items-center space-x-2 mb-2">
              <Palette className="w-4 h-4 text-accent" />
              <span>Style Preference (Optional)</span>
            </Label>
            <Select value={stylePreference} onValueChange={setStylePreference}>
              <SelectTrigger className="border-gray-200 focus:border-accent">
                <SelectValue placeholder="Choose a style preference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No preference</SelectItem>
                <SelectItem value="minimaliste">Minimalist</SelectItem>
                <SelectItem value="bohème">Bohemian</SelectItem>
                <SelectItem value="classique">Classic</SelectItem>
                <SelectItem value="streetwear">Streetwear</SelectItem>
                <SelectItem value="élégant">Elegant</SelectItem>
                <SelectItem value="décontracté">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !eventType || clothingItems.length === 0 || (quota?.remaining || 0) <= 0}
            className="ankhara-button w-full"
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Outfits
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Fresh Recommendations Display */}
      {freshRecommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Your New Outfits</h3>
            <Button
              variant="outline"
              onClick={() => setLocation("/recommendations")}
              className="text-accent border-accent hover:bg-accent/5"
            >
              View All History
            </Button>
          </div>
          <div className="space-y-6">
            {freshRecommendations.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
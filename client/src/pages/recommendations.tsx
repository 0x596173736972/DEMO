import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OutfitCard } from "@/components/outfit-card";
import { recommendationsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ArrowLeft, Heart, Clock } from "lucide-react";
import type { OutfitRecommendation } from "@shared/schema";

export default function RecommendationsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["/api/recommendations"],
    queryFn: () => recommendationsApi.getRecommendations(),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (id: number) => recommendationsApi.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      toast({ title: "Updated!", description: "Favorite status updated." });
    },
    onError: (error) => {
      toast({
        title: "Failed to update",
        description: error instanceof Error ? error.message : "Could not update favorite",
        variant: "destructive",
      });
    },
  });

  const handleShare = (id: number) => {
    // In a real app, this would generate a shareable link
    toast({ title: "Share link copied!", description: "Outfit link copied to clipboard." });
  };

  

  const filteredRecommendations = recommendations.filter((rec: OutfitRecommendation) => {
    if (activeTab === "favorites") return rec.isFavorite;
    if (activeTab === "recent") {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(rec.createdAt) > weekAgo;
    }
    return true; // "all"
  });

  if (isLoading) {
    return (
      <div className="mobile-container pt-20 pb-20 section-spacing">
        <div className="loading-shimmer h-8 w-32 rounded mb-4"></div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="loading-shimmer h-64 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

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
        <div className="flex-1">
          <h2 className="text-xl font-semibold">Your Outfits</h2>
          <p className="text-sm text-gray-600">
            {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} generated
          </p>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <Card className="ankhara-card p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No outfits yet</h3>
          <p className="text-gray-600 mb-4">
            Generate your first AI-powered outfit recommendation to get started.
          </p>
          <Button
            onClick={() => setLocation("/generate")}
            className="ankhara-button"
          >
            Generate Outfit
          </Button>
        </Card>
      ) : (
        <>
          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 bg-gray-50">
              <TabsTrigger value="all" className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>All</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Recent</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredRecommendations.length === 0 ? (
                <Card className="ankhara-card p-8 text-center">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">
                    No {activeTab} outfits
                  </h3>
                  <p className="text-gray-600">
                    {activeTab === "favorites" 
                      ? "Mark outfits as favorites to see them here."
                      : "No recent outfits found."
                    }
                  </p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredRecommendations.map((outfit: OutfitRecommendation) => (
                    <OutfitCard
                      key={outfit.id}
                      outfit={outfit}
                      onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          
        </>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Plus, Sun, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { quotaApi, weatherApi, recommendationsApi } from "@/lib/api";

export default function HomePage() {
  const { user } = useAuth();

  const { data: quota } = useQuery({
    queryKey: ["/api/user/quota"],
    queryFn: () => quotaApi.getQuota(),
  });

  const { data: weather } = useQuery({
    queryKey: ["/api/weather/Paris"],
    queryFn: () => weatherApi.getWeather("Paris"),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: recentRecommendations } = useQuery({
    queryKey: ["/api/recommendations"],
    queryFn: () => recommendationsApi.getRecommendations(),
  });

  return (
    <div className="mobile-container pt-20 pb-20">
      {/* Header */}
      <div className="section-spacing bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-black">Good morning</h2>
            <p className="text-gray-500 text-sm">{user?.name}</p>
          </div>
          
          <div className="text-right">
            <p className="text-xs text-gray-400">Daily recommendations</p>
            <div className="flex items-center space-x-1">
              <span className="text-lg font-bold text-accent">
                {quota?.remaining || 0}
              </span>
              <span className="text-sm text-gray-400">/ {quota?.limit || 0}</span>
            </div>
          </div>
        </div>

        {/* Weather Card */}
        {weather && (
          <Card className="weather-card mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Sun className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">{weather.location}</p>
                  <p className="text-sm text-gray-600">{weather.conditions}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{weather.temp}°C</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <div className="section-spacing">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/generate">
            <Button className="ankhara-button w-full h-20 flex-col space-y-2">
              <Zap className="w-6 h-6" />
              <span className="font-medium">Generate Outfit</span>
            </Button>
          </Link>
          
          <Link href="/wardrobe">
            <Button
              variant="outline"
              className="w-full h-20 flex-col space-y-2 border-gray-200 hover:border-gray-300"
            >
              <Plus className="w-6 h-6 text-gray-500" />
              <span className="font-medium text-black">Add Item</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Outfits */}
      {recentRecommendations && recentRecommendations.length > 0 && (
        <div className="section-spacing">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Outfits</h3>
            <Link href="/recommendations">
              <Button variant="ghost" size="sm" className="text-accent">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {recentRecommendations.slice(0, 2).map((outfit: any) => (
              <Card key={outfit.id} className="ankhara-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-black">{outfit.name}</h4>
                    <p className="text-sm text-gray-500">
                      Generated {new Date(outfit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    {outfit.colorPalette?.slice(0, 3).map((color: string, index: number) => (
                      <div
                        key={index}
                        className="w-3 h-3 rounded-full border border-gray-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                {Array.isArray(outfit.items) && (
                  <div className="flex -space-x-2">
                    {outfit.items.slice(0, 3).map((item: any, index: number) => (
                      <div
                        key={index}
                        className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs overflow-hidden"
                      >
                        {item.imagePath ? (
                          <img
                            src={item.imagePath}
                            alt={item.name || 'Item'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs">
                            {item.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="section-spacing">
        <h3 className="text-lg font-semibold mb-4">This Week</h3>
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-black">{quota?.used || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Outfits Generated</p>
          </Card>
          
          <Card className="bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-black">-</p>
            <p className="text-xs text-gray-500 mt-1">Items Added</p>
          </Card>
          
          <Card className="bg-gray-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {recentRecommendations?.filter((r: any) => r.isFavorite).length || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">Favorites</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

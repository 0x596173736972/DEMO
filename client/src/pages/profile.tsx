import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { profileApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { User, Palette, Star } from "lucide-react";

const morphologyOptions = [
  { value: "triangle inversé", label: "Triangle inversé" },
  { value: "triangle", label: "Triangle" },
  { value: "rectangle", label: "Rectangle" },
  { value: "sablier", label: "Sablier" },
  { value: "pomme", label: "Pomme" },
];

const skinTones = [
  { value: "#FFDAB9", name: "Fair" },
  { value: "#DEB887", name: "Light" },
  { value: "#D2B48C", name: "Medium" },
  { value: "#CD853F", name: "Tan" },
  { value: "#A0522D", name: "Brown" },
  { value: "#8B4513", name: "Deep" },
];

const styleOptions = [
  "élégant", "casual", "classique", "streetwear", "boho/bohème",
  "rock/grunge", "preppy", "sportif/atheleisure", "vintage/retro",
  "chic urbain", "glamour", "avant garde", "business/pro", "romantique", "casual chic"
];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    morphology: "",
    skinTone: "#FFDAB9",
    preferredStyles: [] as string[],
    size: "M",
    colorPalette: ["#FF5E5B", "#3F88C5", "#F49D37"],
    restrictions: [] as string[],
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: () => profileApi.getProfile(),
  });

  // Synchroniser les données du profil avec le formulaire
  useEffect(() => {
    if (profile) {
      setFormData({
        morphology: profile.morphology || "",
        skinTone: profile.skinTone || "#FFDAB9",
        preferredStyles: profile.preferredStyles ? 
          (typeof profile.preferredStyles === 'string' ? 
            profile.preferredStyles.split(',').filter(Boolean) : 
            profile.preferredStyles) : [],
        size: profile.size || "M",
        colorPalette: profile.colorPalette ? 
          (typeof profile.colorPalette === 'string' ? 
            JSON.parse(profile.colorPalette) : 
            profile.colorPalette) : ["#FF5E5B", "#3F88C5", "#F49D37"],
        restrictions: profile.restrictions ? 
          (typeof profile.restrictions === 'string' ? 
            profile.restrictions.split(',').filter(Boolean) : 
            profile.restrictions) : [],
      });
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => profileApi.updateProfile(data),
    onSuccess: () => {
      toast({ title: "Profile updated!", description: "Your style profile has been saved." });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const toggleStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      preferredStyles: prev.preferredStyles.includes(style)
        ? prev.preferredStyles.filter(s => s !== style)
        : [...prev.preferredStyles, style]
    }));
  };

  if (isLoading) {
    return (
      <div className="mobile-container pt-20 pb-20 section-spacing">
        <div className="loading-shimmer h-8 w-32 rounded mb-4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="loading-shimmer h-32 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container pt-20 pb-20 section-spacing">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Style Profile</h2>
        <p className="text-gray-600">Help us understand your preferences to create perfect outfits.</p>
      </div>

      {/* Profile Header */}
      <Card className="ankhara-gradient p-6 mb-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold">{user?.name?.charAt(0)}</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold">{user?.name}</h3>
            <p className="text-white text-opacity-80">{user?.email}</p>
            <div className="flex items-center space-x-2 mt-2">
              <span className={user?.type === "premium" ? "badge-premium" : "badge-freemium"}>
                {user?.type?.charAt(0).toUpperCase() + user?.type?.slice(1)}
              </span>
              <span className="text-white text-opacity-60 text-xs">
                Member since {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="ankhara-card p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 text-accent mr-2" />
            Personal Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="morphology">Body Type</Label>
              <Select 
                value={formData.morphology} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, morphology: value }))}
              >
                <SelectTrigger className="form-select">
                  <SelectValue placeholder="Select your body type" />
                </SelectTrigger>
                <SelectContent>
                  {morphologyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Select 
                value={formData.size} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
              >
                <SelectTrigger className="form-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map(size => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Skin Tone</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {skinTones.map(tone => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, skinTone: tone.value }))}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.skinTone === tone.value
                        ? "border-accent scale-110"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: tone.value }}
                    title={tone.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Style Preferences */}
        <Card className="ankhara-card p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Star className="w-5 h-5 text-accent mr-2" />
            Style Preferences
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            {styleOptions.map(style => (
              <label
                key={style}
                className={`flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                  formData.preferredStyles.includes(style)
                    ? "border-accent bg-accent/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Checkbox
                  checked={formData.preferredStyles.includes(style)}
                  onCheckedChange={() => toggleStyle(style)}
                />
                <span className="text-sm font-medium">{style}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Save Button */}
        <Button
          type="submit"
          className="w-full ankhara-button"
          disabled={updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}

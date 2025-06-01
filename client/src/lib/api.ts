import { queryClient } from "./queryClient";

const API_BASE = "/api";

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem("ankhara_token");
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem("ankhara_token", token);
};

// Clear auth token
export const clearAuthToken = (): void => {
  localStorage.removeItem("ankhara_token");
};

// API request helper with auth
export const apiRequest = async (
  method: string,
  url: string,
  data?: unknown | FormData,
  isFormData = false
): Promise<Response> => {
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData && data) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: isFormData ? data as FormData : (data ? JSON.stringify(data) : undefined),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Network error" }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response;
};

// Authentication API
export const authApi = {
  async login(email: string, password: string) {
    const response = await apiRequest("POST", "/auth/login", { email, password });
    const data = await response.json();
    setAuthToken(data.token);
    return data;
  },

  async register(email: string, password: string, name: string, type: "freemium" | "premium" = "freemium") {
    const response = await apiRequest("POST", "/auth/register", { email, password, name, type });
    const data = await response.json();
    setAuthToken(data.token);
    return data;
  },

  async logout() {
    clearAuthToken();
    queryClient.clear();
  },

  isAuthenticated(): boolean {
    return !!getAuthToken();
  },
};

// User profile API
export const profileApi = {
  async getProfile() {
    const response = await apiRequest("GET", "/user/profile");
    return response.json();
  },

  async updateProfile(profile: any) {
    const response = await apiRequest("POST", "/user/profile", profile);
    return response.json();
  },
};

// Clothing items API
export const clothingApi = {
  async getItems() {
    const response = await apiRequest("GET", "/user/clothing");
    return response.json();
  },

  async addItem(itemData: any, imageFile?: File) {
    const formData = new FormData();

    Object.keys(itemData).forEach(key => {
      formData.append(key, itemData[key]);
    });

    if (imageFile) {
      formData.append("image", imageFile);
    }

    const response = await apiRequest("POST", "/user/clothing", formData, true);
    return response.json();
  },

  async deleteItem(id: number) {
    const response = await apiRequest("DELETE", `/user/clothing/${id}`);
    return response.json();
  },
};

// Weather API
export const weatherApi = {
  async getWeather(location: string) {
    const response = await apiRequest("GET", `/weather/${encodeURIComponent(location)}`);
    return response.json();
  },
};

// Recommendations API
export const recommendationsApi = {
  async generate(eventType: string, location: string, stylePreference?: string) {
    const response = await apiRequest("POST", "/recommendations", {
      eventType,
      location,
      stylePreference,
    });
    return response.json();
  },

  async getRecommendations() {
    const response = await apiRequest("GET", "/recommendations");
    return response.json();
  },

  async toggleFavorite(id: number) {
    const response = await apiRequest("POST", `/recommendations/${id}/favorite`);
    return response.json();
  },
};

export const quotaApi = {
  async getQuota() {
    const response = await apiRequest("GET", "/user/quota");
    return response.json();
  },
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let error;
    try {
      error = await response.text();
    } catch {
      error = `HTTP error! status: ${response.status}`;
    }
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }

  try {
    return await response.json();
  } catch {
    throw new Error('Invalid JSON response');
  }
};

const safeApiCall = async (apiCall: () => Promise<any>) => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

export const api = {
  // Auth
  register: (data: InsertUser) => 
    safeApiCall(() =>
      fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse)
    ),
login: (data: { email: string; password: string }) =>
    safeApiCall(() =>
      fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse)
    ),

  // User Profile
  getUserProfile: () =>
    safeApiCall(() =>
      fetch('/api/user/profile', {
        headers: getAuthHeaders(),
      }).then(handleResponse)
    ),

  createUserProfile: (data: InsertUserProfile) =>
    safeApiCall(() =>
      fetch('/api/user/profile', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse)
    ),

  // Clothing Items
  getUserClothing: () =>
    safeApiCall(() =>
      fetch('/api/user/clothing', {
        headers: getAuthHeaders(),
      }).then(handleResponse)
    ),

  createClothingItem: (data: FormData) =>
    safeApiCall(() =>
      fetch('/api/user/clothing', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: data,
      }).then(handleResponse)
    ),

  deleteClothingItem: (id: number) =>
    safeApiCall(() =>
      fetch(`/api/user/clothing/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      }).then(handleResponse)
    ),

  // Weather
  getWeather: (location: string) =>
    safeApiCall(() =>
      fetch(`/api/weather/${encodeURIComponent(location)}`).then(handleResponse)
    ),

  // Recommendations
  generateRecommendations: (data: { eventType: string; location: string; stylePreference?: string }) =>
    safeApiCall(() =>
      fetch('/api/recommendations', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(handleResponse)
    ),

  getUserRecommendations: () =>
    safeApiCall(() =>
      fetch('/api/recommendations', {
        headers: getAuthHeaders(),
      }).then(handleResponse)
    ),

  toggleFavoriteRecommendation: (id: number) =>
    safeApiCall(() =>
      fetch(`/api/recommendations/${id}/favorite`, {
        method: 'POST',
        headers: getAuthHeaders(),
      }).then(handleResponse)
    ),

  // User Quota
  getUserQuota: () =>
    safeApiCall(() =>
      fetch('/api/user/quota', {
        headers: getAuthHeaders(),
      }).then(handleResponse)
    ),
};
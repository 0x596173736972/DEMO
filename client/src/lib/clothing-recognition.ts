// Clothing recognition service using Gemini Vision

export interface ClothingAnalysis {
  category: string;
  name: string;
  color: string;
  material: string;
  formality: number;
}

export async function analyzeClothingImage(imageUrl: string): Promise<ClothingAnalysis> {
  try {
    console.log('Démarrage de l\'analyse avec Gemini Vision...');
    
    const response = await fetch('/api/analyze-clothing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const analysis = await response.json();
    console.log('Analyse reçue:', analysis);
    
    // Validation des données
    const validCategories = ['hauts', 'bas', 'chaussures', 'accessoires'];
    if (!validCategories.includes(analysis.category)) {
      analysis.category = 'hauts';
    }
    
    // S'assurer que la couleur est au format hex
    if (!analysis.color || !analysis.color.startsWith('#')) {
      analysis.color = '#000000';
    }
    
    // S'assurer que la formalité est entre 1 et 5
    analysis.formality = Math.max(1, Math.min(5, parseInt(analysis.formality) || 3));
    
    return analysis;
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse de l\'image:', error);
    
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      category: 'hauts',
      name: 'Vêtement détecté',
      color: '#000000',
      material: 'coton',
      formality: 3
    };
  }
}

export function convertImageToUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Redimensionner l'image pour optimiser la vitesse d'analyse
      const maxSize = 1024;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convertir en base64 avec compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => reject(new Error('Erreur lors du traitement de l\'image'));
    
    const reader = new FileReader();
    reader.onload = (event) => {
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    reader.readAsDataURL(file);
  });
}
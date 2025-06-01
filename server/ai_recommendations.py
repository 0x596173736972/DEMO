#!/usr/bin/env python3
import json
import sys
import os

# Add the project root to the Python path to import groq
sys.path.insert(0, '/home/runner/workspace')

try:
    from groq import Groq
except ImportError:
    # Fallback if groq is not available
    Groq = None

# Your specific API key
GROQ_API_KEY = "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"

def generate_ai_recommendation(weather_data, event_type, user_clothes, client_profile):
    """Generate AI outfit recommendations using advanced Groq API logic"""
    
    if not weather_data:
        return {"error": "Weather data missing"}
    
    # Prepare available items for AI analysis
    available_items = []
    for item in user_clothes:
        available_items.append({
            'id': item.get('id'),
            'category': item.get('category'),
            'name': item.get('name'),
            'color': item.get('color'),
            'material': item.get('material'),
            'formality': item.get('formality', 3)
        })
    
    # Advanced styling prompt with professional fashion expertise
    prompt = f"""
[ROLE]
Tu es un styliste expert qui DOIT utiliser exclusivement les articles de la garde-robe fournie. Tu dois savoir construire une palette harmonieuse avec : Le cercle chromatique (complémentaires, analogues, triadiques…), Les sous-tons de peau (froid, chaud, neutre), Les tendances de saison. Savoir personnaliser chaque look pour sublimer la personne. Créer des styles cohérents et uniques, en accord avec l'identité du client.

[GARDE-ROBE DISPONIBLE]
{json.dumps(available_items, indent=2)}

[CONTEXTE]
Événement: {event_type}
Température: {weather_data.get('temp')}°C
Conditions: {weather_data.get('conditions')}
Profil client: {json.dumps(client_profile, indent=2)}

[INSTRUCTIONS STRICTES]
1. Utilise UNIQUEMENT les articles de la garde-robe ci-dessus
2. Retourne 2 tenues complètes avec:
   - 1 haut + 1 bas + 1 paire de chaussures + 0-1 accessoire
3. Format de réponse JSON:

{{
  "outfits": [
    {{
      "name": "Nom de la tenue",
      "items": [
        {{
          "id": "ID_ARTICLE",
          "category": "catégorie",
          "name": "nom exact"
        }}
      ],
      "color_palette": ["#HEX"],
      "justification": "Explication technique détaillée de pourquoi cette combinaison fonctionne"
    }}
  ]
}}
"""

    try:
        if Groq is None:
            return {"error": "Groq library not available"}
            
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model="deepseek-r1-distill-llama-70b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        raw_json = response.choices[0].message.content
        try:
            if raw_json.startswith('```json'):
                raw_json = raw_json[7:-3].strip()
            return json.loads(raw_json)
        except json.JSONDecodeError:
            return {"error": "Format JSON invalide", "raw": raw_json}
            
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print(json.dumps({"error": "Usage: python3 ai_recommendations.py <weather_json> <event_type> <clothes_json> <profile_json>"}))
        sys.exit(1)
    
    try:
        weather_data = json.loads(sys.argv[1])
        event_type = sys.argv[2]
        user_clothes = json.loads(sys.argv[3])
        client_profile = json.loads(sys.argv[4])
        
        result = generate_ai_recommendation(weather_data, event_type, user_clothes, client_profile)
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"error": f"Script error: {str(e)}"}))
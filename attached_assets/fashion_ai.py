# fashion_ai.py
import streamlit as st
import pandas as pd
import requests
import random
import json
import logging
from groq import Groq
import geocoder
import hashlib

# Configuration
logging.basicConfig(level=logging.INFO)
GROQ_API_KEY = "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"
WEATHERSTACK_API_KEY = "36184e95c5aaf0a5a8a537b098221575"

# ----------------------------------------------------------
# 1. Base de données de vêtements
# ----------------------------------------------------------
def generate_clothing_database():
    categories = {
        'hauts': ['T-shirt', 'Chemise', 'Top', 'Débardeur', 'Crop top', 'Sweatshirt', 'Pull', 'Cardigan', 'Blazer', 'Veste en jean', 'Veste en cuir', 'Hoodie', 'Chemisier', 'Gilet', 'Body', 'Bustier','Tailleur'],
        'bas': ['Jean', 'Pantalon classique', 'Jogging', 'Short', 'Jupe', 'Mini-jupe', 'Jupe longue', 'Pantalon cargo', 'Pantalon flare', 'Legging', 'Pantalon palazzo', 'Jupe-culotte', 'Cycliste'],
        'chaussures': ['Baskets', 'Talons', 'Sandales', 'Tongs', 'Bottes', 'Cuissardes', 'Derbies', 'Richelieus', 'Mocassins', 'Espadrilles', 'Chaussures compensées', 'Chaussures de sport', 'Sabots', 'Chaussures bateau'],
        'accessoires': ['Sac à main', 'Sac banane', 'Sac à dos', 'Lunettes de soleil', 'Ceinture', 'Montre', 'Chapeau', 'Casquette', 'Bonnet', 'Bijoux (colliers, bracelets, boucles)', 'Écharpe', 'Gants', 'Bandeau', 'Broche', 'Pince à cheveux']
    }
    
    clothes = []
    colors = ['#FF5E5B', '#D72638', '#3F88C5', '#FFF1C1', '#F49D37', '#05668D', '#028090', '#00A896', '#02C39A', '#F0F3BD', '#FFD6E0', '#F2C6B4', '#E4B3A1', '#C2B9B0', '#8E8D8A', '#2E294E', '#541388', '#F1E9DA', '#FFD400', '#D90368', '#ED6A5A', '#F4F1BB', '#9BC1BC', '#5D576B', '#E6EBE0', '#011627', '#2EC4B6', '#E71D36', '#FF9F1C', '#FDFFFC', '#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD', '#FF2E63', '#08D9D6', '#252A34', '#EAEAEA', '#3A4750', '#A68A64', '#D9BF77', '#FFEBC9', '#A9B18F', '#5A524C', '#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E']
    materials = {
        'hauts': ['lin', 'coton', 'soie', 'laine'],
        'bas': ['denim', 'laine', 'coton'],
        'chaussures': ['cuir', 'toile', 'synthétique'],
        'accessoires': ['cuir', 'soie', 'coton']
    }
    
    for i in range(50):
        category = random.choice(list(categories.keys()))
        clothes.append({
            'id': i,
            'category': category,
            'name': random.choice(categories[category]),
            'color': random.choice(colors),
            'material': random.choice(materials[category]),
            'formality': random.randint(1, 5)
        })
    return pd.DataFrame(clothes)

# ----------------------------------------------------------
# 2. Profil client
# ----------------------------------------------------------
client_profile = {
    'morphology': 'triangle inversé',
    'skin_tone': '#FFDAB9',
    'preferred_styles': ['élégant', 'classique','casual','streatwear','boho/bohème','rock/grunge','preppy','sportif/atheleisure','vintage/retro','chic urbain','glamour','avant garde','business/pro','romantique','casual chic'],
    'size': 'M',
    'color_palette': ['#FF5E5B', '#D72638', '#3F88C5', '#FFF1C1', '#F49D37', '#05668D', '#028090', '#00A896', '#02C39A', '#F0F3BD', '#FFD6E0', '#F2C6B4', '#E4B3A1', '#C2B9B0', '#8E8D8A', '#2E294E', '#541388', '#F1E9DA', '#FFD400', '#D90368', '#ED6A5A', '#F4F1BB', '#9BC1BC', '#5D576B', '#E6EBE0', '#011627', '#2EC4B6', '#E71D36', '#FF9F1C', '#FDFFFC', '#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD', '#FF2E63', '#08D9D6', '#252A34', '#EAEAEA', '#3A4750', '#A68A64', '#D9BF77', '#FFEBC9', '#A9B18F', '#5A524C', '#FFFFFF', '#F5F5F5', '#E0E0E0', '#BDBDBD', '#9E9E9E'],
    'restrictions': ['pas de motifs fluorescents']
}

# ----------------------------------------------------------
# 3. Services externes
# ----------------------------------------------------------
def get_user_location():
    try:
        g = geocoder.ip('me')
        return g.city if g.ok else "Paris"
    except Exception:
        return "Paris"

def get_weather(location):
    try:
        url = f"http://api.weatherstack.com/current?access_key={WEATHERSTACK_API_KEY}&query={location}"
        response = requests.get(url, timeout=5)
        data = response.json()
        return {
            'temp': data['current']['temperature'],
            'conditions': data['current']['weather_descriptions'][0],
            'precip': data['current']['precip']
        }
    except Exception:
        return None

# ----------------------------------------------------------
# 4. Système de recommandation
# ----------------------------------------------------------
def generate_ai_recommendation(weather, event, df_clothes):
    if not weather:
        return {"error": "Données météo manquantes"}
    
    # Préparer la liste des articles disponibles
    available_items = []
    for _, item in df_clothes.iterrows():
        available_items.append({
            'id': item['id'],
            'category': item['category'],
            'name': item['name'],
            'color': item['color'],
            'material': item['material'],
            'formality': item['formality']
        })
    
    prompt = f"""
[ROLE]
Tu es un styliste expert qui DOIT utiliser exclusivement les articles de la garde-robe fournie(tu dois savoir construire une palette harmonieuse avec : Le cercle chromatique (complémentaires, analogues, triadiques…), Les sous-tons de peau (froid, chaud, neutre),Les tendances de saison. Savoir personnaliser chaque look pour sublimer la personne. Créer des styles cohérents et uniques, en accord avec l’identité du client).

[GARDE-ROBE DISPONIBLE]
{json.dumps(available_items, indent=2)}

[CONTEXTE]
Événement: {event}
Température: {weather['temp']}°C
Conditions: {weather['conditions']}
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
      "justification": "Explication technique"
    }}
  ]
}}
"""

    try:
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

# ----------------------------------------------------------
# 5. Interface utilisateur (CORRIGÉE)
# ----------------------------------------------------------
def display_outfit(outfit, df_clothes, outfit_index):
    with st.container():
        # Header avec nom de la tenue
        st.subheader(f"👗 Tenue {outfit_index + 1}: {outfit.get('name', 'Sans nom')}")
        
        # Récupération des détails complets des articles
        complete_items = []
        for item in outfit.get('items', []):
            matched_item = df_clothes[df_clothes['id'] == item.get('id')]
            if not matched_item.empty:
                complete_items.append(matched_item.iloc[0])
        
        # Affichage des articles par catégorie
        categories = {
            'hauts': "👕 Hauts",
            'bas': "👖 Bas",
            'chaussures': "👟 Chaussures",
            'accessoires': "🧣 Accessoires"
        }
        
        for cat_name, cat_display in categories.items():
            cat_items = [item for item in complete_items if item['category'] == cat_name]
            if cat_items:
                with st.expander(cat_display):
                    for item in cat_items:
                        col1, col2 = st.columns([1, 3])
                        with col1:
                            st.color_picker(
                                f"Couleur {item['name']}",
                                item['color'],
                                disabled=True,
                                key=f"color_{outfit_index}_{item['id']}"
                            )
                        with col2:
                            st.markdown(f"**{item['name']}**")
                            st.caption(f"Matière: {item['material'].capitalize()}")
                            st.caption(f"Formalité: {item['formality']}/5")
        
        # Palette de couleurs
        if 'color_palette' in outfit:
            st.markdown("🎨 Palette de couleurs dominante:")
            cols = st.columns(len(outfit['color_palette']))
            for i, color in enumerate(outfit['color_palette']):
                cols[i].color_picker(
                    f"Couleur {i+1}",
                    color,
                    disabled=True,
                    key=f"palette_{outfit_index}_{i}"
                )
        
        # Justification
        with st.expander("📝 Analyse stylistique"):
            st.write(outfit.get('justification', 'Non spécifié'))
        
        st.divider()

def main():
    st.set_page_config(page_title="AI Stylist Pro", layout="wide")
    st.title("👔 Assistant Style Personnel")
    
    # Initialisation des données
    df_clothes = generate_clothing_database()
    
    # Interface
    col1, col2 = st.columns(2)
    with col1:
        location = st.text_input("📍 Ville", value=get_user_location())
    with col2:
        event_type = st.selectbox(
            "🎭 Événement",
            ["Anniversaire", "Mariage", "Baptême", "Fiançailles", "Baby shower", "Enterrement de vie de garçon/fille", "Fête de remise de diplôme", "Réveillon (Noël, Nouvel An)", "Fête nationale / feu d’artifice", "Fête traditionnelle (Egungun, Gèlèdé, etc.)", "Concert live", "Festival de musique", "Projection ciné / avant-première", "Théâtre", "Stand-up / Comédie club", "Spectacle de danse", "Expo artistique / vernissage", "Lecture publique / slam / poésie", "Musée ou galerie d’art", "Escape game", "Dîner au resto", "Brunch", "Apéro entre potes", "Sortie street food", "Bar à thème / lounge", "Pique-nique au parc", "Dégustation (vin, café, chocolat, etc.)", "Food festival / salon culinaire", "Conférence", "Séminaire / masterclass", "Atelier créatif (peinture, poterie, etc.)", "Salon professionnel / forum", "Meetup business ou tech", "Afterwork networking", "Soirée pitch / concours de startups", "Soirée en boîte / club", "Soirée à thème (années 90, afrobeat, etc.)", "Karaoké night", "Pool party", "Rooftop party / garden party"]
        )
    
    if st.button("✨ Générer des tenues", type="primary"):
        with st.spinner("Analyse de votre garde-robe..."):
            weather_data = get_weather(location)
            
            if weather_data:
                st.info(f"🌤️ Météo à {location}: {weather_data['temp']}°C | {weather_data['conditions']}")
                
                recommendations = generate_ai_recommendation(weather_data, event_type, df_clothes)
                
                if "outfits" in recommendations:
                    st.success("🎉 Tenues générées avec succès!")
                    
                    for i, outfit in enumerate(recommendations["outfits"]):
                        display_outfit(outfit, df_clothes, i)
                    
                    # Export JSON
                    st.download_button(
                        "💾 Télécharger les recommandations",
                        json.dumps(recommendations, indent=2, ensure_ascii=False),
                        file_name="recommandations_style.json",
                        mime="application/json",
                        key="download_json"
                    )
                else:
                    st.error(f"❌ {recommendations.get('error', 'Erreur inconnue')}")
                    if "raw" in recommendations:
                        with st.expander("Réponse brute pour débogage"):
                            st.code(recommendations["raw"])
            else:
                st.error("Impossible d'obtenir les données météo")

if __name__ == "__main__":
    main()
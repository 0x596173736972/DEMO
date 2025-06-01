#!/usr/bin/env python3
import json
import sys
import urllib.request
import urllib.parse

# Your specific API key
WEATHERSTACK_API_KEY = "8b6a84483f486488b4207c15d2a73b55"

def get_weather(location):
    """Get real weather data from Weatherstack API"""
    try:
        encoded_location = urllib.parse.quote(location)
        url = f"http://api.weatherstack.com/current?access_key={WEATHERSTACK_API_KEY}&query={encoded_location}"
        
        with urllib.request.urlopen(url, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        if 'current' in data:
            return {
                'temp': data['current']['temperature'],
                'conditions': data['current']['weather_descriptions'][0],
                'precip': data['current']['precip'],
                'location': location
            }
        else:
            error_info = data.get('error', {}).get('info', 'Unknown error')
            return {"error": f"Weather API error: {error_info}"}
            
    except Exception as e:
        return {"error": f"Weather service error: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python3 weather_service.py <location>"}))
        sys.exit(1)
    
    location = sys.argv[1]
    result = get_weather(location)
    print(json.dumps(result))
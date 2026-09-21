"""
Script de prueba para verificar AWS Rekognition con una imagen de prueba
"""
import base64
import requests

# Usar una imagen de prueba pequeña (1x1 pixel rojo en JPG)
# Esta es una imagen JPG válida mínima para prueba
test_image_base64 = "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA//2Q=="

print("🧪 Probando detección de rostro con AWS Rekognition...")
print("-" * 60)

try:
    response = requests.post(
        "http://localhost:8000/api/v1/facial/test-image",
        json={"image_base64": test_image_base64},
        headers={"Content-Type": "application/json"}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Respuesta: {response.json()}")
    
except Exception as e:
    print(f"❌ Error: {e}")

print("\n💡 Ahora prueba con tu imagen real en el frontend")
print("   Los logs deberían aparecer en la terminal del backend")

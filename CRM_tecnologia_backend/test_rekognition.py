import os
import boto3
from dotenv import load_dotenv

# Cargar las variables del archivo .env
load_dotenv()

# Verificar que las credenciales se cargaron
access_key = os.getenv("AWS_ACCESS_KEY_ID")
if access_key:
    print(f"Access Key cargada: {access_key[:5]}...")
else:
    print(" NO se cargó la Access Key. Revisa tu archivo .env")

# Crear el cliente de Rekognition
client = boto3.client(
    'rekognition',
    region_name=os.getenv("AWS_DEFAULT_REGION", "us-east-1")
)

# Probar la conexión
try:
    response = client.list_collections()
    print("¡Conexión exitosa a AWS Rekognition!")
    print("Colecciones existentes:", response['CollectionIds'])
except Exception as e:
    print("Error al conectar:", str(e))

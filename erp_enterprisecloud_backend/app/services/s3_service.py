"""
Servicio para manejo de archivos en AWS S3
"""
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import os

from app.core.config import settings


class S3Service:
    """Servicio para operaciones con AWS S3"""
    
    def __init__(self):
        """Inicializa el cliente de S3"""
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_DEFAULT_REGION
        )
        self.bucket_name = settings.AWS_S3_BUCKET
    
    def upload_file(
        self,
        file_content: bytes,
        file_name: str,
        folder: str = "documentos",
        content_type: str = "application/octet-stream"
    ) -> Dict[str, Any]:
        """
        Sube un archivo a S3
        
        Args:
            file_content: Contenido del archivo en bytes
            file_name: Nombre original del archivo
            folder: Carpeta en S3 donde guardar
            content_type: Tipo MIME del archivo
        
        Returns:
            Diccionario con información del archivo subido
        
        Raises:
            Exception: Si hay error al subir
        """
        try:
            # Generar nombre único para el archivo
            file_extension = os.path.splitext(file_name)[1]
            unique_filename = f"{uuid.uuid4().hex}{file_extension}"
            
            # Construir la key (ruta) en S3
            s3_key = f"{folder}/{datetime.now().strftime('%Y/%m')}/{unique_filename}"
            
            # Subir archivo a S3
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type,
                ServerSideEncryption='AES256'  # Encriptación en reposo
            )
            
            # Generar URL del archivo
            file_url = f"https://{self.bucket_name}.s3.{settings.AWS_DEFAULT_REGION}.amazonaws.com/{s3_key}"
            
            return {
                "success": True,
                "s3_key": s3_key,
                "s3_bucket": self.bucket_name,
                "file_name": file_name,
                "unique_filename": unique_filename,
                "file_url": file_url,
                "size": len(file_content)
            }
            
        except NoCredentialsError:
            raise Exception("Credenciales de AWS no configuradas correctamente")
        except ClientError as e:
            raise Exception(f"Error al subir archivo a S3: {str(e)}")
        except Exception as e:
            raise Exception(f"Error inesperado: {str(e)}")
    
    def download_file(self, s3_key: str) -> Optional[bytes]:
        """
        Descarga un archivo de S3
        
        Args:
            s3_key: Ruta del archivo en S3
        
        Returns:
            Contenido del archivo en bytes o None si no existe
        """
        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return response['Body'].read()
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchKey':
                return None
            raise Exception(f"Error al descargar archivo: {str(e)}")
        except Exception as e:
            raise Exception(f"Error inesperado: {str(e)}")
    
    def generate_presigned_url(
        self,
        s3_key: str,
        expiration: int = 3600
    ) -> Optional[str]:
        """
        Genera una URL pre-firmada para acceder al archivo
        
        Args:
            s3_key: Ruta del archivo en S3
            expiration: Tiempo de expiración en segundos (default: 1 hora)
        
        Returns:
            URL pre-firmada o None si hay error
        """
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': s3_key
                },
                ExpiresIn=expiration
            )
            return url
            
        except ClientError as e:
            print(f"Error al generar URL pre-firmada: {str(e)}")
            return None
    
    def delete_file(self, s3_key: str) -> bool:
        """
        Elimina un archivo de S3
        
        Args:
            s3_key: Ruta del archivo en S3
        
        Returns:
            True si se eliminó correctamente, False si no
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
            
        except ClientError as e:
            print(f"Error al eliminar archivo: {str(e)}")
            return False
    
    def list_files(
        self,
        folder: str = "",
        max_files: int = 1000
    ) -> list:
        """
        Lista archivos en un folder de S3
        
        Args:
            folder: Carpeta a listar (vacío para raíz)
            max_files: Máximo número de archivos a retornar
        
        Returns:
            Lista de diccionarios con información de archivos
        """
        try:
            prefix = f"{folder}/" if folder else ""
            
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix,
                MaxKeys=max_files
            )
            
            if 'Contents' not in response:
                return []
            
            files = []
            for obj in response['Contents']:
                files.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat(),
                    'url': f"https://{self.bucket_name}.s3.{settings.AWS_DEFAULT_REGION}.amazonaws.com/{obj['Key']}"
                })
            
            return files
            
        except ClientError as e:
            print(f"Error al listar archivos: {str(e)}")
            return []
    
    def file_exists(self, s3_key: str) -> bool:
        """
        Verifica si un archivo existe en S3
        
        Args:
            s3_key: Ruta del archivo en S3
        
        Returns:
            True si existe, False si no
        """
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
            
        except ClientError:
            return False


# Instancia global del servicio
s3_service = S3Service()

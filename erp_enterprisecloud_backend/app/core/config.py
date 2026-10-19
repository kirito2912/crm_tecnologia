"""
Configuración central de la aplicación ERP EnterpriseCloud
"""
from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Configuración de la aplicación"""
    
    # Aplicación
    APP_NAME: str = "ERP EnterpriseCloud"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Base de Datos
    DATABASE_URL: str
    DB_USER: str = "erp_admin"
    DB_PASSWORD: str = "password"
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "erp_enterprisecloud"
    
    # Seguridad JWT
    JWT_SECRET_KEY: str = "tu-clave-super-secreta-cambiar-en-produccion"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # AWS
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_DEFAULT_REGION: str = "us-east-1"
    AWS_S3_BUCKET: str = "erp-enterprisecloud-documents"
    
    # Empresa
    EMPRESA_RUC: str = "20123456789"
    EMPRESA_RAZON_SOCIAL: str = "Mi Empresa S.A.C."
    EMPRESA_NOMBRE_COMERCIAL: str = "Mi Empresa"
    
    # Parámetros de Negocio
    IGV_PORCENTAJE: float = 18.0
    LIMITE_APROBACION_OC: float = 5000.0
    DIAS_CREDITO_DEFAULT: int = 30
    STOCK_MINIMO_DEFAULT: int = 10
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Instancia global de configuración
settings = Settings()

"""
Endpoints de Autenticación
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.services.auth_service import auth_service
from app.core.security import get_current_active_user
from app.models.usuario import Usuario


router = APIRouter()


@router.post("/login", response_model=TokenResponse, tags=["Autenticación"])
async def login(
    credentials: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Iniciar sesión con email y contraseña
    
    Retorna un token JWT válido por 60 minutos
    """
    # Autenticar usuario
    usuario = auth_service.authenticate_user(
        db=db,
        email=credentials.email,
        password=credentials.password
    )
    
    # Crear respuesta con token
    token_response = auth_service.create_token_response(db=db, usuario=usuario)
    
    return token_response


@router.post("/register", response_model=TokenResponse, tags=["Autenticación"])
async def register(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Registrar un nuevo usuario
    
    El usuario se crea con estado 'activo' y sin roles asignados.
    Un administrador debe asignar los roles posteriormente.
    """
    # Registrar usuario
    usuario = auth_service.register_user(db=db, data=user_data)
    
    # Crear respuesta con token
    token_response = auth_service.create_token_response(db=db, usuario=usuario)
    
    return token_response


@router.get("/me", tags=["Autenticación"])
async def get_current_user_info(
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener información del usuario actual
    
    Requiere token JWT válido
    """
    # Obtener roles del usuario
    roles = [ur.rol.nombre for ur in current_user.usuario_roles]
    
    return {
        "id": current_user.id,
        "usuario_codigo": current_user.usuario_codigo,
        "nombre_completo": current_user.nombre_completo,
        "email": current_user.email,
        "telefono": current_user.telefono,
        "foto_perfil": current_user.foto_perfil,
        "estado": current_user.estado,
        "ultimo_acceso": current_user.ultimo_acceso,
        "roles": roles
    }


@router.post("/logout", tags=["Autenticación"])
async def logout(
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Cerrar sesión (invalidar token)
    
    En una implementación real, se agregaría el token a una blacklist.
    Por ahora, el cliente debe eliminar el token localmente.
    """
    return {
        "message": "Sesión cerrada exitosamente",
        "user": current_user.email
    }

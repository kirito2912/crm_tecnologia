"""
Servicio de Autenticación
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime, timedelta

from app.models.usuario import Usuario
from app.core.security import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, TokenResponse, UserResponse


class AuthService:
    """Servicio para lógica de autenticación"""
    
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> Usuario:
        """
        Autentica un usuario por email y contraseña
        
        Args:
            db: Sesión de base de datos
            email: Email del usuario
            password: Contraseña sin encriptar
        
        Returns:
            Usuario autenticado
        
        Raises:
            HTTPException: Si las credenciales son inválidas
        """
        # Buscar usuario por email
        usuario = db.query(Usuario).filter(Usuario.email == email).first()
        
        if not usuario:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos"
            )
        
        # Verificar contraseña
        if not verify_password(password, usuario.password_hash):
            # Incrementar intentos fallidos
            usuario.intentos_fallidos += 1
            
            # Bloquear usuario después de 5 intentos
            if usuario.intentos_fallidos >= 5:
                usuario.estado = "bloqueado"
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Usuario bloqueado por múltiples intentos fallidos"
                )
            
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email o contraseña incorrectos"
            )
        
        # Verificar estado del usuario
        if usuario.estado != "activo":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Usuario {usuario.estado}"
            )
        
        # Resetear intentos fallidos
        usuario.intentos_fallidos = 0
        usuario.ultimo_acceso = datetime.now()
        db.commit()
        
        return usuario
    
    @staticmethod
    def register_user(db: Session, data: RegisterRequest) -> Usuario:
        """
        Registra un nuevo usuario
        
        Args:
            db: Sesión de base de datos
            data: Datos del nuevo usuario
        
        Returns:
            Usuario creado
        
        Raises:
            HTTPException: Si el email ya existe
        """
        # Verificar si el email ya existe
        existing_user = db.query(Usuario).filter(Usuario.email == data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está registrado"
            )
        
        # Generar código de usuario
        last_user = db.query(Usuario).order_by(Usuario.id.desc()).first()
        next_id = (last_user.id + 1) if last_user else 1
        usuario_codigo = f"USR-{next_id:06d}"
        
        # Crear nuevo usuario
        nuevo_usuario = Usuario(
            usuario_codigo=usuario_codigo,
            nombre_completo=data.nombre_completo,
            email=data.email,
            password_hash=hash_password(data.password),
            telefono=data.telefono,
            estado="activo"
        )
        
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
        
        return nuevo_usuario
    
    @staticmethod
    def create_token_response(db: Session, usuario: Usuario) -> TokenResponse:
        """
        Crea la respuesta con token JWT
        
        Args:
            db: Sesión de base de datos
            usuario: Usuario autenticado
        
        Returns:
            Respuesta con token y datos del usuario
        """
        # Obtener roles del usuario
        roles = [ur.rol.nombre for ur in usuario.usuario_roles]
        
        # Crear token JWT
        token_data = {
            "usuario_id": usuario.id,
            "email": usuario.email,
            "roles": roles
        }
        access_token = create_access_token(token_data)
        
        # Crear respuesta del usuario
        user_response = UserResponse(
            id=usuario.id,
            usuario_codigo=usuario.usuario_codigo,
            nombre_completo=usuario.nombre_completo,
            email=usuario.email,
            telefono=usuario.telefono,
            foto_perfil=usuario.foto_perfil,
            estado=usuario.estado,
            roles=roles
        )
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )


# Instancia global del servicio
auth_service = AuthService()

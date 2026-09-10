from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.conexion import get_db
from app.core.security import hash_password
from app.models.usuario import Usuario
from app.models.user import User
from app.models.otp_code import OTPCode
from app.models.invitacion import Invitacion
from app.api.admin_access import require_admin
from app.core.roles import normalize_role, database_role
from sqlalchemy import or_
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=List[UsuarioResponse])
def listar_usuarios(
    skip: int = 0,
    limit: int = 100,
    rol: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Obtiene el listado de todos los usuarios registrados."""
    query = db.query(Usuario)
    if rol:
        query = query.filter(Usuario.rol == database_role(rol))
    return query.offset(skip).limit(limit).all()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def obtener_usuario(usuario_id: str, db: Session = Depends(get_db)):
    """Obtiene los detalles de un usuario por su ID."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID '{usuario_id}' no encontrado",
        )
    return usuario


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED)
def crear_usuario(usuario_in: UsuarioCreate, db: Session = Depends(get_db)):
    """Crea un nuevo usuario en el sistema."""
    # Verificar si el email ya existe
    existe = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El correo electrónico '{usuario_in.email}' ya está registrado",
        )

    # Generar ID si no viene proporcionado
    user_id = usuario_in.id
    if not user_id:
        total = db.query(Usuario).count()
        user_id = f"USR-{total + 1:03d}"

    # Generar avatar predeterminado a partir del nombre
    avatar = usuario_in.avatar
    if not avatar and usuario_in.nombre:
        parts = usuario_in.nombre.strip().split()
        avatar = "".join([p[0].upper() for p in parts[:2]])

    nuevo_usuario = Usuario(
        id=user_id,
        nombre=usuario_in.nombre,
        email=usuario_in.email,
        password_hash=hash_password(usuario_in.password) if usuario_in.password else None,
        rol=usuario_in.rol or "Senior B2B Sales Executive",
        empresa=usuario_in.empresa or "HardCRM Enterprise",
        avatar=avatar,
        biometric_verified=usuario_in.biometric_verified or False,
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.put("/{usuario_id}", response_model=UsuarioResponse)
def actualizar_usuario(
    usuario_id: str,
    usuario_in: UsuarioUpdate,
    db: Session = Depends(get_db),
):
    """Actualiza la información de un usuario existente."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID '{usuario_id}' no encontrado",
        )

    update_data = usuario_in.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != usuario.email:
        existe = db.query(Usuario).filter(Usuario.email == update_data["email"]).first()
        if existe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El correo '{update_data['email']}' ya pertenece a otro usuario",
            )

    if "password" in update_data:
        update_data["password_hash"] = hash_password(update_data.pop("password"))

    for field, value in update_data.items():
        setattr(usuario, field, value)

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_200_OK)
def eliminar_usuario(usuario_id: str, db: Session = Depends(get_db), admin: Usuario = Depends(require_admin)):
    """Elimina solo colaboradores deshabilitados y sus credenciales vinculadas."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).with_for_update().first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID '{usuario_id}' no encontrado",
        )
    if usuario.id == admin.id or normalize_role(usuario.rol) != "colaborador":
        raise HTTPException(403, "Solo puedes eliminar cuentas de colaboradores.")
    if usuario.habilitado or usuario.estado != "deshabilitado":
        raise HTTPException(409, "Primero debes deshabilitar la cuenta del colaborador.")
    account = db.query(User).filter(User.email.ilike(usuario.email)).with_for_update().first()
    if account and normalize_role(account.role) == "administrador":
        raise HTTPException(409, "La cuenta vinculada tiene permisos de administrador. Revisa sus roles antes de eliminarla.")
    otp_filter = OTPCode.email.ilike(usuario.email)
    if account:
        otp_filter = or_(otp_filter, OTPCode.user_id == account.id)
    db.query(OTPCode).filter(otp_filter).delete(synchronize_session=False)
    if account:
        db.delete(account)
    db.query(Invitacion).filter(Invitacion.email.ilike(usuario.email), Invitacion.estado == "pendiente").update({"estado": "cancelado"}, synchronize_session=False)
    db.delete(usuario)
    db.commit()
    return {"message": f"Usuario '{usuario_id}' eliminado exitosamente"}

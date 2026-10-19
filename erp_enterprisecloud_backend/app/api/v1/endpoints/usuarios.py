"""
Endpoints de Usuarios
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse, UsuarioList
from app.models.usuario import Usuario, UsuarioRol
from app.core.security import get_current_active_user, hash_password, require_role


router = APIRouter()


@router.get("/", response_model=UsuarioList, tags=["Usuarios"])
async def listar_usuarios(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=100),
    buscar: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(["Administrador"]))
):
    """
    Listar usuarios con paginación y filtros
    
    Requiere rol: Administrador
    """
    # Query base
    query = db.query(Usuario)
    
    # Filtros
    if buscar:
        query = query.filter(
            (Usuario.nombre_completo.ilike(f"%{buscar}%")) |
            (Usuario.email.ilike(f"%{buscar}%")) |
            (Usuario.usuario_codigo.ilike(f"%{buscar}%"))
        )
    
    if estado:
        query = query.filter(Usuario.estado == estado)
    
    # Total de registros
    total = query.count()
    
    # Paginación
    offset = (pagina - 1) * por_pagina
    usuarios = query.offset(offset).limit(por_pagina).all()
    
    # Construir respuesta con roles
    usuarios_response = []
    for usuario in usuarios:
        roles = [ur.rol.nombre for ur in usuario.usuario_roles]
        usuario_data = UsuarioResponse(
            id=usuario.id,
            usuario_codigo=usuario.usuario_codigo,
            nombre_completo=usuario.nombre_completo,
            email=usuario.email,
            telefono=usuario.telefono,
            foto_perfil=usuario.foto_perfil,
            estado=usuario.estado,
            ultimo_acceso=usuario.ultimo_acceso,
            fecha_creacion=usuario.fecha_creacion,
            roles=roles
        )
        usuarios_response.append(usuario_data)
    
    return UsuarioList(
        total=total,
        usuarios=usuarios_response,
        pagina=pagina,
        por_pagina=por_pagina
    )


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
async def crear_usuario(
    usuario_data: UsuarioCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(["Administrador"]))
):
    """
    Crear un nuevo usuario
    
    Requiere rol: Administrador
    """
    # Verificar si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == usuario_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Generar código de usuario
    last_user = db.query(Usuario).order_by(Usuario.id.desc()).first()
    next_id = (last_user.id + 1) if last_user else 1
    usuario_codigo = f"USR-{next_id:06d}"
    
    # Crear usuario
    nuevo_usuario = Usuario(
        usuario_codigo=usuario_codigo,
        nombre_completo=usuario_data.nombre_completo,
        email=usuario_data.email,
        password_hash=hash_password(usuario_data.password),
        telefono=usuario_data.telefono,
        estado="activo",
        creado_por=current_user.id
    )
    
    db.add(nuevo_usuario)
    db.flush()  # Para obtener el ID
    
    # Asignar roles
    if usuario_data.roles:
        for rol_id in usuario_data.roles:
            usuario_rol = UsuarioRol(
                usuario_id=nuevo_usuario.id,
                rol_id=rol_id,
                asignado_por=current_user.id
            )
            db.add(usuario_rol)
    
    db.commit()
    db.refresh(nuevo_usuario)
    
    # Obtener roles para la respuesta
    roles = [ur.rol.nombre for ur in nuevo_usuario.usuario_roles]
    
    return UsuarioResponse(
        id=nuevo_usuario.id,
        usuario_codigo=nuevo_usuario.usuario_codigo,
        nombre_completo=nuevo_usuario.nombre_completo,
        email=nuevo_usuario.email,
        telefono=nuevo_usuario.telefono,
        foto_perfil=nuevo_usuario.foto_perfil,
        estado=nuevo_usuario.estado,
        ultimo_acceso=nuevo_usuario.ultimo_acceso,
        fecha_creacion=nuevo_usuario.fecha_creacion,
        roles=roles
    )


@router.get("/{usuario_id}", response_model=UsuarioResponse, tags=["Usuarios"])
async def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener un usuario por ID
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Obtener roles
    roles = [ur.rol.nombre for ur in usuario.usuario_roles]
    
    return UsuarioResponse(
        id=usuario.id,
        usuario_codigo=usuario.usuario_codigo,
        nombre_completo=usuario.nombre_completo,
        email=usuario.email,
        telefono=usuario.telefono,
        foto_perfil=usuario.foto_perfil,
        estado=usuario.estado,
        ultimo_acceso=usuario.ultimo_acceso,
        fecha_creacion=usuario.fecha_creacion,
        roles=roles
    )


@router.put("/{usuario_id}", response_model=UsuarioResponse, tags=["Usuarios"])
async def actualizar_usuario(
    usuario_id: int,
    usuario_data: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(["Administrador"]))
):
    """
    Actualizar un usuario
    
    Requiere rol: Administrador
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Actualizar campos
    if usuario_data.nombre_completo:
        usuario.nombre_completo = usuario_data.nombre_completo
    if usuario_data.email:
        # Verificar que el email no esté en uso
        existing = db.query(Usuario).filter(
            Usuario.email == usuario_data.email,
            Usuario.id != usuario_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El email ya está en uso"
            )
        usuario.email = usuario_data.email
    if usuario_data.telefono is not None:
        usuario.telefono = usuario_data.telefono
    if usuario_data.foto_perfil is not None:
        usuario.foto_perfil = usuario_data.foto_perfil
    if usuario_data.estado:
        usuario.estado = usuario_data.estado
    
    usuario.modificado_por = current_user.id
    
    # Actualizar roles si se proporcionan
    if usuario_data.roles is not None:
        # Eliminar roles actuales
        db.query(UsuarioRol).filter(UsuarioRol.usuario_id == usuario_id).delete()
        
        # Agregar nuevos roles
        for rol_id in usuario_data.roles:
            usuario_rol = UsuarioRol(
                usuario_id=usuario_id,
                rol_id=rol_id,
                asignado_por=current_user.id
            )
            db.add(usuario_rol)
    
    db.commit()
    db.refresh(usuario)
    
    # Obtener roles para la respuesta
    roles = [ur.rol.nombre for ur in usuario.usuario_roles]
    
    return UsuarioResponse(
        id=usuario.id,
        usuario_codigo=usuario.usuario_codigo,
        nombre_completo=usuario.nombre_completo,
        email=usuario.email,
        telefono=usuario.telefono,
        foto_perfil=usuario.foto_perfil,
        estado=usuario.estado,
        ultimo_acceso=usuario.ultimo_acceso,
        fecha_creacion=usuario.fecha_creacion,
        roles=roles
    )


@router.delete("/{usuario_id}", tags=["Usuarios"])
async def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role(["Administrador"]))
):
    """
    Eliminar un usuario (cambiar estado a 'inactivo')
    
    Requiere rol: Administrador
    """
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # No permitir eliminar al usuario actual
    if usuario_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes eliminar tu propio usuario"
        )
    
    # Cambiar estado a inactivo en lugar de eliminar
    usuario.estado = "inactivo"
    usuario.modificado_por = current_user.id
    
    db.commit()
    
    return {
        "message": "Usuario eliminado exitosamente",
        "usuario_id": usuario_id
    }

"""
Endpoints de Clientes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.db.session import get_db
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse, ClienteList
from app.models.cliente import Cliente
from app.models.usuario import Usuario
from app.core.security import get_current_active_user


router = APIRouter()


@router.get("/", response_model=ClienteList, tags=["Clientes"])
async def listar_clientes(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=100),
    buscar: Optional[str] = None,
    tipo_documento: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar clientes con paginación y filtros
    """
    # Query base
    query = db.query(Cliente)
    
    # Filtros
    if buscar:
        query = query.filter(
            (Cliente.razon_social.ilike(f"%{buscar}%")) |
            (Cliente.numero_documento.ilike(f"%{buscar}%")) |
            (Cliente.cliente_codigo.ilike(f"%{buscar}%"))
        )
    
    if tipo_documento:
        query = query.filter(Cliente.tipo_documento == tipo_documento)
    
    if estado:
        query = query.filter(Cliente.estado == estado)
    else:
        # Por defecto, solo mostrar clientes activos
        query = query.filter(Cliente.estado == "activo")
    
    # Total de registros
    total = query.count()
    
    # Paginación
    offset = (pagina - 1) * por_pagina
    clientes = query.order_by(Cliente.fecha_creacion.desc()).offset(offset).limit(por_pagina).all()
    
    return ClienteList(
        total=total,
        clientes=clientes,
        pagina=pagina,
        por_pagina=por_pagina
    )


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED, tags=["Clientes"])
async def crear_cliente(
    cliente_data: ClienteCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Crear un nuevo cliente
    """
    # Verificar si el número de documento ya existe
    existing = db.query(Cliente).filter(
        Cliente.numero_documento == cliente_data.numero_documento
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un cliente con el {cliente_data.tipo_documento} {cliente_data.numero_documento}"
        )
    
    # Generar código de cliente
    last_cliente = db.query(Cliente).order_by(Cliente.id.desc()).first()
    next_id = (last_cliente.id + 1) if last_cliente else 1
    cliente_codigo = f"CLI-{next_id:06d}"
    
    # Crear cliente
    nuevo_cliente = Cliente(
        cliente_codigo=cliente_codigo,
        tipo_documento=cliente_data.tipo_documento,
        numero_documento=cliente_data.numero_documento,
        razon_social=cliente_data.razon_social,
        nombre_comercial=cliente_data.nombre_comercial,
        email=cliente_data.email,
        telefono=cliente_data.telefono,
        celular=cliente_data.celular,
        direccion=cliente_data.direccion,
        distrito=cliente_data.distrito,
        provincia=cliente_data.provincia,
        departamento=cliente_data.departamento,
        limite_credito=cliente_data.limite_credito,
        dias_credito=cliente_data.dias_credito,
        observaciones=cliente_data.observaciones,
        estado="activo",
        creado_por=current_user.id
    )
    
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    
    return nuevo_cliente


@router.get("/{cliente_id}", response_model=ClienteResponse, tags=["Clientes"])
async def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener un cliente por ID
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse, tags=["Clientes"])
async def actualizar_cliente(
    cliente_id: int,
    cliente_data: ClienteUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Actualizar un cliente
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    # Actualizar campos proporcionados
    update_data = cliente_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(cliente, field, value)
    
    cliente.modificado_por = current_user.id
    
    db.commit()
    db.refresh(cliente)
    
    return cliente


@router.delete("/{cliente_id}", tags=["Clientes"])
async def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Eliminar un cliente (cambiar estado a 'inactivo')
    """
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    # Verificar que no tenga operaciones pendientes
    # TODO: Agregar validación de facturas pendientes, pedidos, etc.
    
    cliente.estado = "inactivo"
    cliente.modificado_por = current_user.id
    
    db.commit()
    
    return {
        "message": "Cliente eliminado exitosamente",
        "cliente_id": cliente_id
    }


@router.get("/documento/{numero_documento}", response_model=ClienteResponse, tags=["Clientes"])
async def buscar_cliente_por_documento(
    numero_documento: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Buscar un cliente por número de documento (RUC, DNI, etc.)
    """
    cliente = db.query(Cliente).filter(
        Cliente.numero_documento == numero_documento
    ).first()
    
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    return cliente

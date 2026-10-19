"""
Endpoints de Productos
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db.session import get_db
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse, ProductoList, StockResponse
from app.models.producto import Producto, CategoriaProducto, UnidadMedida
from app.models.stock import Stock
from app.models.almacen import Almacen
from app.models.usuario import Usuario
from app.core.security import get_current_active_user


router = APIRouter()


@router.get("/", response_model=ProductoList, tags=["Productos"])
async def listar_productos(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=100),
    buscar: Optional[str] = None,
    categoria_id: Optional[int] = None,
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar productos con paginación y filtros
    """
    # Query base
    query = db.query(Producto)
    
    # Filtros
    if buscar:
        query = query.filter(
            (Producto.nombre.ilike(f"%{buscar}%")) |
            (Producto.producto_codigo.ilike(f"%{buscar}%")) |
            (Producto.codigo_barras.ilike(f"%{buscar}%"))
        )
    
    if categoria_id:
        query = query.filter(Producto.categoria_id == categoria_id)
    
    if tipo:
        query = query.filter(Producto.tipo == tipo)
    
    if estado:
        query = query.filter(Producto.estado == estado)
    else:
        # Por defecto, solo mostrar productos activos
        query = query.filter(Producto.estado == "activo")
    
    # Total de registros
    total = query.count()
    
    # Paginación
    offset = (pagina - 1) * por_pagina
    productos = query.order_by(Producto.fecha_creacion.desc()).offset(offset).limit(por_pagina).all()
    
    # Agregar nombres de categoría y unidad de medida
    productos_response = []
    for producto in productos:
        producto_data = ProductoResponse.from_orm(producto)
        if producto.categoria:
            producto_data.categoria_nombre = producto.categoria.nombre
        if producto.unidad_medida:
            producto_data.unidad_medida_nombre = producto.unidad_medida.nombre
        productos_response.append(producto_data)
    
    return ProductoList(
        total=total,
        productos=productos_response,
        pagina=pagina,
        por_pagina=por_pagina
    )


@router.post("/", response_model=ProductoResponse, status_code=status.HTTP_201_CREATED, tags=["Productos"])
async def crear_producto(
    producto_data: ProductoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Crear un nuevo producto
    """
    # Verificar que la unidad de medida existe
    unidad = db.query(UnidadMedida).filter(
        UnidadMedida.id == producto_data.unidad_medida_id
    ).first()
    if not unidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unidad de medida no válida"
        )
    
    # Verificar código de barras único si se proporciona
    if producto_data.codigo_barras:
        existing = db.query(Producto).filter(
            Producto.codigo_barras == producto_data.codigo_barras
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ya existe un producto con el código de barras {producto_data.codigo_barras}"
            )
    
    # Generar código de producto
    last_producto = db.query(Producto).order_by(Producto.id.desc()).first()
    next_id = (last_producto.id + 1) if last_producto else 1
    producto_codigo = f"PROD-{next_id:06d}"
    
    # Crear producto
    nuevo_producto = Producto(
        producto_codigo=producto_codigo,
        nombre=producto_data.nombre,
        descripcion=producto_data.descripcion,
        categoria_id=producto_data.categoria_id,
        unidad_medida_id=producto_data.unidad_medida_id,
        tipo=producto_data.tipo,
        precio_compra=producto_data.precio_compra,
        precio_venta=producto_data.precio_venta,
        margen_utilidad=producto_data.margen_utilidad,
        stock_minimo=producto_data.stock_minimo,
        stock_maximo=producto_data.stock_maximo,
        afecto_igv=producto_data.afecto_igv,
        codigo_barras=producto_data.codigo_barras,
        observaciones=producto_data.observaciones,
        estado="activo",
        creado_por=current_user.id
    )
    
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    
    # Agregar nombres para la respuesta
    producto_response = ProductoResponse.from_orm(nuevo_producto)
    if nuevo_producto.categoria:
        producto_response.categoria_nombre = nuevo_producto.categoria.nombre
    if nuevo_producto.unidad_medida:
        producto_response.unidad_medida_nombre = nuevo_producto.unidad_medida.nombre
    
    return producto_response


@router.get("/{producto_id}", response_model=ProductoResponse, tags=["Productos"])
async def obtener_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener un producto por ID
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Agregar nombres para la respuesta
    producto_response = ProductoResponse.from_orm(producto)
    if producto.categoria:
        producto_response.categoria_nombre = producto.categoria.nombre
    if producto.unidad_medida:
        producto_response.unidad_medida_nombre = producto.unidad_medida.nombre
    
    return producto_response


@router.put("/{producto_id}", response_model=ProductoResponse, tags=["Productos"])
async def actualizar_producto(
    producto_id: int,
    producto_data: ProductoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Actualizar un producto
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Actualizar campos proporcionados
    update_data = producto_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(producto, field, value)
    
    producto.modificado_por = current_user.id
    
    db.commit()
    db.refresh(producto)
    
    # Agregar nombres para la respuesta
    producto_response = ProductoResponse.from_orm(producto)
    if producto.categoria:
        producto_response.categoria_nombre = producto.categoria.nombre
    if producto.unidad_medida:
        producto_response.unidad_medida_nombre = producto.unidad_medida.nombre
    
    return producto_response


@router.delete("/{producto_id}", tags=["Productos"])
async def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Eliminar un producto (cambiar estado a 'inactivo')
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    producto.estado = "inactivo"
    producto.modificado_por = current_user.id
    
    db.commit()
    
    return {
        "message": "Producto eliminado exitosamente",
        "producto_id": producto_id
    }


@router.get("/{producto_id}/stock", response_model=List[StockResponse], tags=["Productos"])
async def obtener_stock_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener el stock de un producto por almacén
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Obtener stocks por almacén
    stocks = db.query(Stock).filter(Stock.producto_id == producto_id).all()
    
    # Construir respuesta con nombres
    stocks_response = []
    for stock in stocks:
        almacen = db.query(Almacen).filter(Almacen.id == stock.almacen_id).first()
        stock_data = StockResponse(
            producto_id=producto.id,
            producto_codigo=producto.producto_codigo,
            producto_nombre=producto.nombre,
            almacen_id=stock.almacen_id,
            almacen_nombre=almacen.nombre if almacen else "Sin almacén",
            cantidad=stock.cantidad,
            cantidad_reservada=stock.cantidad_reservada,
            cantidad_disponible=stock.cantidad_disponible,
            fecha_actualizacion=stock.fecha_actualizacion
        )
        stocks_response.append(stock_data)
    
    return stocks_response


@router.get("/codigo-barras/{codigo_barras}", response_model=ProductoResponse, tags=["Productos"])
async def buscar_producto_por_codigo_barras(
    codigo_barras: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Buscar un producto por código de barras
    """
    producto = db.query(Producto).filter(
        Producto.codigo_barras == codigo_barras
    ).first()
    
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado"
        )
    
    # Agregar nombres para la respuesta
    producto_response = ProductoResponse.from_orm(producto)
    if producto.categoria:
        producto_response.categoria_nombre = producto.categoria.nombre
    if producto.unidad_medida:
        producto_response.unidad_medida_nombre = producto.unidad_medida.nombre
    
    return producto_response

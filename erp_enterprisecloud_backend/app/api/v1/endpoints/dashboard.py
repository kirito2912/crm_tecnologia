"""
Endpoints de Dashboard
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from decimal import Decimal

from app.db.session import get_db
from app.models.usuario import Usuario
from app.models.cliente import Cliente
from app.models.producto import Producto
from app.models.factura import Factura
from app.models.orden_compra import OrdenCompra
from app.models.stock import Stock
from app.models.cuenta_por_cobrar import CuentaPorCobrar
from app.models.cuenta_por_pagar import CuentaPorPagar
from app.core.security import get_current_active_user


router = APIRouter()


@router.get("/", tags=["Dashboard"])
async def obtener_dashboard(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener datos principales del dashboard
    
    Incluye KPIs, estadísticas y gráficos
    """
    # Fecha actual y rangos
    hoy = datetime.now().date()
    inicio_mes = hoy.replace(day=1)
    hace_30_dias = hoy - timedelta(days=30)
    
    # KPIs Generales
    total_clientes = db.query(func.count(Cliente.id)).filter(Cliente.estado == "activo").scalar() or 0
    total_productos = db.query(func.count(Producto.id)).filter(Producto.estado == "activo").scalar() or 0
    total_usuarios = db.query(func.count(Usuario.id)).filter(Usuario.estado == "activo").scalar() or 0
    
    # Ventas del mes
    ventas_mes = db.query(func.sum(Factura.total)).filter(
        Factura.fecha_emision >= inicio_mes,
        Factura.estado != "anulada"
    ).scalar() or Decimal("0")
    
    # Ventas de los últimos 30 días
    ventas_30_dias = db.query(func.sum(Factura.total)).filter(
        Factura.fecha_emision >= hace_30_dias,
        Factura.estado != "anulada"
    ).scalar() or Decimal("0")
    
    # Compras del mes
    compras_mes = db.query(func.sum(OrdenCompra.total)).filter(
        OrdenCompra.fecha_emision >= inicio_mes,
        OrdenCompra.estado != "cancelada"
    ).scalar() or Decimal("0")
    
    # Cuentas por cobrar
    total_por_cobrar = db.query(func.sum(CuentaPorCobrar.monto_pendiente)).filter(
        CuentaPorCobrar.estado.in_(["pendiente", "pagada_parcial"])
    ).scalar() or Decimal("0")
    
    cuentas_vencidas = db.query(func.count(CuentaPorCobrar.id)).filter(
        CuentaPorCobrar.estado.in_(["pendiente", "pagada_parcial"]),
        CuentaPorCobrar.fecha_vencimiento < hoy
    ).scalar() or 0
    
    # Cuentas por pagar
    total_por_pagar = db.query(func.sum(CuentaPorPagar.monto_pendiente)).filter(
        CuentaPorPagar.estado.in_(["pendiente", "pagada_parcial"])
    ).scalar() or Decimal("0")
    
    # Productos con stock bajo
    productos_stock_bajo = db.query(Producto).filter(
        Producto.stock_actual <= Producto.stock_minimo,
        Producto.estado == "activo"
    ).count()
    
    # Últimas ventas
    ultimas_facturas = db.query(Factura).filter(
        Factura.estado != "anulada"
    ).order_by(Factura.fecha_emision.desc()).limit(5).all()
    
    ultimas_ventas = []
    for factura in ultimas_facturas:
        ultimas_ventas.append({
            "id": factura.id,
            "numero": factura.factura_numero,
            "cliente": factura.cliente.razon_social if factura.cliente else "N/A",
            "fecha": factura.fecha_emision.isoformat(),
            "total": float(factura.total),
            "estado": factura.estado
        })
    
    # Top 5 productos más vendidos (últimos 30 días)
    # TODO: Implementar cuando se tenga tabla de detalles de ventas
    
    # Top 5 clientes (por monto)
    top_clientes = db.query(
        Cliente.id,
        Cliente.razon_social,
        func.sum(Factura.total).label("total_compras")
    ).join(Factura).filter(
        Factura.fecha_emision >= hace_30_dias,
        Factura.estado != "anulada"
    ).group_by(Cliente.id, Cliente.razon_social).order_by(
        func.sum(Factura.total).desc()
    ).limit(5).all()
    
    clientes_top = []
    for cliente in top_clientes:
        clientes_top.append({
            "id": cliente.id,
            "nombre": cliente.razon_social,
            "total_compras": float(cliente.total_compras)
        })
    
    # Ventas por día (últimos 7 días)
    ventas_por_dia = []
    for i in range(6, -1, -1):
        fecha = hoy - timedelta(days=i)
        total_dia = db.query(func.sum(Factura.total)).filter(
            Factura.fecha_emision == fecha,
            Factura.estado != "anulada"
        ).scalar() or Decimal("0")
        
        ventas_por_dia.append({
            "fecha": fecha.isoformat(),
            "total": float(total_dia)
        })
    
    # Respuesta del dashboard
    return {
        "kpis": {
            "total_clientes": total_clientes,
            "total_productos": total_productos,
            "total_usuarios": total_usuarios,
            "ventas_mes": float(ventas_mes),
            "ventas_30_dias": float(ventas_30_dias),
            "compras_mes": float(compras_mes),
            "total_por_cobrar": float(total_por_cobrar),
            "total_por_pagar": float(total_por_pagar),
            "cuentas_vencidas": cuentas_vencidas,
            "productos_stock_bajo": productos_stock_bajo
        },
        "ultimas_ventas": ultimas_ventas,
        "top_clientes": clientes_top,
        "ventas_por_dia": ventas_por_dia,
        "alertas": {
            "stock_bajo": productos_stock_bajo > 0,
            "cuentas_vencidas": cuentas_vencidas > 0,
            "mensaje": f"{productos_stock_bajo} productos con stock bajo, {cuentas_vencidas} cuentas vencidas"
        }
    }


@router.get("/ventas", tags=["Dashboard"])
async def obtener_dashboard_ventas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Dashboard específico de ventas
    """
    hoy = datetime.now().date()
    inicio_mes = hoy.replace(day=1)
    mes_anterior = (inicio_mes - timedelta(days=1)).replace(day=1)
    
    # Ventas del mes actual
    ventas_mes_actual = db.query(func.sum(Factura.total)).filter(
        Factura.fecha_emision >= inicio_mes,
        Factura.estado != "anulada"
    ).scalar() or Decimal("0")
    
    # Ventas del mes anterior
    ventas_mes_anterior = db.query(func.sum(Factura.total)).filter(
        Factura.fecha_emision >= mes_anterior,
        Factura.fecha_emision < inicio_mes,
        Factura.estado != "anulada"
    ).scalar() or Decimal("0")
    
    # Calcular variación porcentual
    if ventas_mes_anterior > 0:
        variacion = ((ventas_mes_actual - ventas_mes_anterior) / ventas_mes_anterior) * 100
    else:
        variacion = 100 if ventas_mes_actual > 0 else 0
    
    # Número de facturas emitidas
    total_facturas_mes = db.query(func.count(Factura.id)).filter(
        Factura.fecha_emision >= inicio_mes,
        Factura.estado != "anulada"
    ).scalar() or 0
    
    # Ticket promedio
    ticket_promedio = (ventas_mes_actual / total_facturas_mes) if total_facturas_mes > 0 else Decimal("0")
    
    return {
        "ventas_mes_actual": float(ventas_mes_actual),
        "ventas_mes_anterior": float(ventas_mes_anterior),
        "variacion_porcentual": float(variacion),
        "total_facturas": total_facturas_mes,
        "ticket_promedio": float(ticket_promedio),
        "estado_facturas": {
            "emitidas": total_facturas_mes,
            "pagadas": db.query(func.count(Factura.id)).filter(
                Factura.fecha_emision >= inicio_mes,
                Factura.estado == "pagada"
            ).scalar() or 0,
            "pendientes": db.query(func.count(Factura.id)).filter(
                Factura.fecha_emision >= inicio_mes,
                Factura.estado == "emitida"
            ).scalar() or 0
        }
    }


@router.get("/inventario", tags=["Dashboard"])
async def obtener_dashboard_inventario(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Dashboard específico de inventario
    """
    # Valor total del inventario
    valor_inventario = db.query(
        func.sum(Producto.stock_actual * Producto.precio_compra)
    ).filter(
        Producto.estado == "activo"
    ).scalar() or Decimal("0")
    
    # Productos con stock crítico
    productos_criticos = db.query(Producto).filter(
        Producto.stock_actual <= Producto.stock_minimo,
        Producto.stock_actual > 0,
        Producto.estado == "activo"
    ).all()
    
    criticos_lista = []
    for producto in productos_criticos:
        criticos_lista.append({
            "id": producto.id,
            "codigo": producto.producto_codigo,
            "nombre": producto.nombre,
            "stock_actual": float(producto.stock_actual),
            "stock_minimo": float(producto.stock_minimo)
        })
    
    # Productos sin stock
    productos_sin_stock = db.query(func.count(Producto.id)).filter(
        Producto.stock_actual == 0,
        Producto.estado == "activo"
    ).scalar() or 0
    
    # Total de productos activos
    total_productos = db.query(func.count(Producto.id)).filter(
        Producto.estado == "activo"
    ).scalar() or 0
    
    return {
        "valor_total_inventario": float(valor_inventario),
        "total_productos": total_productos,
        "productos_stock_critico": len(criticos_lista),
        "productos_sin_stock": productos_sin_stock,
        "productos_criticos": criticos_lista[:10],  # Primeros 10
        "alertas": {
            "critico": len(criticos_lista) > 0,
            "sin_stock": productos_sin_stock > 0
        }
    }

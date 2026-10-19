"""
Modelos de base de datos - ERP EnterpriseCloud
Todos los modelos SQLAlchemy del sistema
"""

# Importar todos los modelos
from app.models.usuario import Usuario, Rol, Permiso, UsuarioRol, RolPermiso, Sesion, Auditoria
from app.models.cliente import Cliente
from app.models.proveedor import Proveedor
from app.models.producto import Producto, CategoriaProducto, UnidadMedida
from app.models.cotizacion import Cotizacion, CotizacionDetalle
from app.models.pedido import Pedido, PedidoDetalle
from app.models.factura import Factura, FacturaDetalle
from app.models.orden_compra import OrdenCompra, OrdenCompraDetalle, SolicitudCompra
from app.models.recepcion import Recepcion, RecepcionDetalle
from app.models.almacen import Almacen
from app.models.stock import Stock
from app.models.movimiento_inventario import MovimientoInventario, AjusteInventario
from app.models.cuenta_por_cobrar import CuentaPorCobrar
from app.models.cuenta_por_pagar import CuentaPorPagar
from app.models.documento_s3 import DocumentoS3, CategoriaDocumento
from app.models.empresa import Empresa
from app.models.parametro_sistema import ParametroSistema, Secuencia

# Lista de exportación
__all__ = [
    # Seguridad y Usuarios
    "Usuario", "Rol", "Permiso", "UsuarioRol", "RolPermiso", "Sesion", "Auditoria",
    # Maestros
    "Cliente", "Proveedor", "Empresa",
    # Productos e Inventario
    "Producto", "CategoriaProducto", "UnidadMedida",
    "Almacen", "Stock", "MovimientoInventario", "AjusteInventario",
    # Ventas
    "Cotizacion", "CotizacionDetalle",
    "Pedido", "PedidoDetalle",
    "Factura", "FacturaDetalle",
    # Compras
    "SolicitudCompra", "OrdenCompra", "OrdenCompraDetalle",
    "Recepcion", "RecepcionDetalle",
    # Finanzas
    "CuentaPorCobrar", "CuentaPorPagar",
    # Documentos
    "DocumentoS3", "CategoriaDocumento",
    # Sistema
    "ParametroSistema", "Secuencia"
]

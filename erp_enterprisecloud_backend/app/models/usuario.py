"""
Modelos de Usuario y Seguridad
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.db.session import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_codigo = Column(String(20), unique=True, nullable=False, index=True)
    nombre_completo = Column(String(200), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    telefono = Column(String(20))
    foto_perfil = Column(String(255))
    estado = Column(String(20), default="activo")  # activo, inactivo, bloqueado
    intentos_fallidos = Column(Integer, default=0)
    ultimo_acceso = Column(DateTime)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    modificado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    usuario_roles = relationship("UsuarioRol", back_populates="usuario", foreign_keys="UsuarioRol.usuario_id")
    sesiones = relationship("Sesion", back_populates="usuario")


class Rol(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(Text)
    es_sistema = Column(Boolean, default=False)
    estado = Column(String(20), default="activo")
    fecha_creacion = Column(DateTime, default=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    rol_permisos = relationship("RolPermiso", back_populates="rol")
    usuario_roles = relationship("UsuarioRol", back_populates="rol")


class Permiso(Base):
    __tablename__ = "permisos"
    
    id = Column(Integer, primary_key=True, index=True)
    modulo = Column(String(50), nullable=False)
    accion = Column(String(50), nullable=False)
    codigo = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    es_sistema = Column(Boolean, default=True)
    
    # Relaciones
    rol_permisos = relationship("RolPermiso", back_populates="permiso")


class UsuarioRol(Base):
    __tablename__ = "usuario_rol"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    fecha_asignacion = Column(DateTime, default=func.now())
    asignado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="usuario_roles", foreign_keys=[usuario_id])
    rol = relationship("Rol", back_populates="usuario_roles")


class RolPermiso(Base):
    __tablename__ = "rol_permiso"
    
    id = Column(Integer, primary_key=True, index=True)
    rol_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    permiso_id = Column(Integer, ForeignKey("permisos.id", ondelete="CASCADE"), nullable=False)
    fecha_asignacion = Column(DateTime, default=func.now())
    
    # Relaciones
    rol = relationship("Rol", back_populates="rol_permisos")
    permiso = relationship("Permiso", back_populates="rol_permisos")


class Sesion(Base):
    __tablename__ = "sesiones"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    token_jwt = Column(Text, nullable=False, index=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    fecha_inicio = Column(DateTime, default=func.now())
    fecha_expiracion = Column(DateTime, nullable=False)
    activa = Column(Boolean, default=True)
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="sesiones")


class Auditoria(Base):
    __tablename__ = "auditoria"
    
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    accion = Column(String(50), nullable=False)
    tabla_afectada = Column(String(100))
    registro_id = Column(Integer)
    datos_anteriores = Column(JSON)
    datos_nuevos = Column(JSON)
    ip_address = Column(String(45))
    fecha_hora = Column(DateTime, default=func.now(), index=True)

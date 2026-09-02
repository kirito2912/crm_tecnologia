erDiagram
    USUARIOS ||--o{ REGISTROS_BIOMETRICOS : posee
    CLIENTES ||--o{ VENTAS : realiza
    CATEGORIAS ||--o{ PRODUCTOS : clasifica
    PRODUCTOS ||--o{ VENTAS : contiene
    DATASETS_ML ||--o{ PREDICCIONES : entrena
    PREDICCIONES ||--o{ FACTORES_SHAP : explica
    PREDICCIONES ||--o{ RECOMENDACIONES : genera

    USUARIOS {
        varchar id PK
        varchar nombre
        varchar email UK
        varchar password_hash
        varchar rol
        varchar empresa
        boolean biometric_verified
        timestamp created_at
    }

    CLIENTES {
        varchar id PK
        varchar nombre
        varchar empresa
        varchar email
        varchar sector
        decimal total_comprado
        varchar estado
        varchar ultimo_contacto
    }

    PRODUCTOS {
        varchar id PK
        varchar codigo UK
        varchar nombre
        varchar categoria
        int stock
        int stock_minimo
        decimal precio_unitario
        varchar estado
    }

    VENTAS {
        varchar id PK
        timestamp fecha
        varchar cliente_id FK
        varchar producto_id FK
        int cantidad
        decimal total_monto
        varchar estado
    }

    DATASETS_ML {
        varchar id PK
        varchar nombre
        varchar categoria
        int registros_count
        int features_count
        varchar columna_objetivo
        varchar peso_archivo
    }

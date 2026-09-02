# Walkthrough: Reorganización Modular de Arquitectura & Creación de Landing Page

Siguiendo las directrices del archivo [`agents.md`](file:///c:/Users/luisa/Documents/PS6/big_data/sem_1/CRM_tecnologia_frontend/agents.md), se ha realizado una **reorganización arquitectónica completa por dominios** dentro de `src` y se ha construido la nueva **Landing Page corporativa** del proyecto.

---

## 1. Nueva Arquitectura Modular de Carpetas

```
src/
├── assets/                    # Recursos estáticos
├── components/
│   ├── layout/                # Shell, navegación y notificaciones
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── NotificationsModal.tsx
│   ├── auth/                  # Autenticación, registro por pasos y cámara facial
│   │   ├── AuthLayout.tsx
│   │   ├── AuthPage.tsx
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── RegisterStepOne.tsx
│   │   ├── RegisterStepTwo.tsx
│   │   └── RegisterStepThree.tsx
│   ├── dashboard/             # Vista principal y analítica comercial
│   │   ├── DashboardOverview.tsx
│   │   ├── KpiCard.tsx
│   │   ├── InsightsBanner.tsx
│   │   ├── SalesEvolutionChart.tsx
│   │   ├── CategoryDistributionChart.tsx
│   │   ├── CsvProcessorModal.tsx
│   │   └── ActionModals.tsx
│   ├── clients/               # Cartera de Clientes B2B & CRUD
│   │   ├── ClientsView.tsx
│   │   └── ClientModal.tsx
│   ├── products/              # Inventario de Hardware & Servidores CRUD
│   │   ├── ProductsView.tsx
│   │   └── ProductModal.tsx
│   ├── sales/                 # Transacciones Comerciales & CRUD
│   │   ├── SalesView.tsx
│   │   └── SaleModal.tsx
│   ├── predictions/           # Machine Learning, Big Data & XAI
│   │   ├── PredictionView.tsx
│   │   ├── PredictionForecastChart.tsx
│   │   └── PredictionInterpretationCard.tsx
│   ├── common/                # Modales y componentes reutilizables
│   │   └── DeleteConfirmModal.tsx
│   └── landing/               # Landing Page Corporativa del Proyecto
│       ├── LandingPage.tsx
│       ├── LandingNavbar.tsx
│       ├── LandingHero.tsx
│       ├── LandingFeatures.tsx
│       ├── LandingBiometrics.tsx
│       ├── LandingPredictions.tsx
│       ├── LandingPricing.tsx
│       └── LandingFooter.tsx
├── context/
│   ├── AuthContext.tsx
│   └── CrmContext.tsx
├── data/
│   ├── mockData.ts
│   └── predictionData.ts
├── types/
│   ├── auth.ts
│   ├── prediction.ts
│   └── index.ts
├── App.tsx                    # Enrutador maestro (Landing / Auth / Dashboard)
├── main.tsx
└── index.css                  # Tokens visuales y estilos del CRM y Landing
```

---

## 2. Nueva Landing Page Corporativa (`src/components/landing/`)

1. **Navbar Glassmórfica (`LandingNavbar.tsx`)**:
   - Marca *HardCRM Pro*, enlaces a secciones (`Características`, `Biometría Facial`, `Predicciones IA`, `Planes`) y botones directos de *Iniciar Sesión* y *Crear Cuenta*.
2. **Hero Section de Alto Impacto (`LandingHero.tsx`)**:
   - Titular corporativo, badges de confianza (*Distancia Euclidiana $d < 0.50$*, *XGBoost + Prophet*, *Servidores Rack*) y mockup flotante del Dashboard en vivo con métricas y telemetría facial.
3. **Módulos y Características (`LandingFeatures.tsx`)**:
   - 6 pilares: Clientes B2B, Hardware & Servidores, Ventas Sincronizadas, Big Data CSV, Biometría Facial y Machine Learning XAI.
4. **Demostración de Biometría Facial (`LandingBiometrics.tsx`)**:
   - Sección oscura con fórmula matemática $d(P, Q) = \sqrt{\sum (P_i - Q_i)^2}$, malla de 12 puntos anatómicos, vector 128-D y simulador interactivo.
5. **Machine Learning & XAI (`LandingPredictions.tsx`)**:
   - Tarjetas informativas de Predicción de Demanda, Prevención de Churn y Venta Cruzada con valores SHAP.
6. **Planes y Precios (`LandingPricing.tsx`)**:
   - Tiers *Starter B2B ($199)*, *Professional Enterprise ($499)* y *Custom Infrastructure ($999)*.
7. **Footer Corporativo (`LandingFooter.tsx`)**:
   - Navegación, certificaciones de seguridad y copyright 2026.

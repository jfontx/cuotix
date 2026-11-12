# Cuotix: Especificaciones de UI y Accesibilidad

> Diseño visual y requisitos de accesibilidad.
> Aprobado: 2026-11-12

---

## 1. Tokens de Diseño

### 1.1 Colores - Light Theme

```typescript
export const lightTheme = {
  // Primario - Verde azulado cálido (confianza, dinero)
  primary: {
    50: '#E6F4F1',
    100: '#CCE9E3',
    200: '#99D3C7',
    300: '#66BDAB',
    400: '#33A78F',
    500: '#009173',   // Principal
    600: '#007A62',
    700: '#006351',
    800: '#004C3F',
    900: '#00352D',
  },

  // Secundario - Ámbar cálido (acentos, CTAs secundarios)
  secondary: {
    50: '#FFF8E6',
    100: '#FFEFC2',
    200: '#FFE699',
    300: '#FFDC70',
    400: '#FFD147',
    500: '#F5B800',   // Principal
    600: '#CC9A00',
    700: '#997300',
    800: '#664D00',
    900: '#332600',
  },

  // Neutrales - Grises cálidos (stone, no azulados)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAF9',    // Fondo principal
    100: '#F5F5F4',   // Fondo cards
    200: '#E7E5E4',   // Bordes
    300: '#D6D3D1',
    400: '#A8A29E',
    500: '#78716C',   // Texto secundario (4.6:1 sobre blanco)
    600: '#57534E',
    700: '#44403C',
    800: '#292524',
    900: '#1C1917',   // Texto principal (15:1 sobre blanco)
  },

  // Estados semánticos
  status: {
    success: {
      bg: '#ECFDF5',
      text: '#065F46',
      icon: '#10B981',
    },
    warning: {
      bg: '#FFFBEB',
      text: '#92400E',
      icon: '#F59E0B',
    },
    error: {
      bg: '#FEF2F2',
      text: '#991B1B',
      icon: '#EF4444',
    },
    info: {
      bg: '#EFF6FF',
      text: '#1E40AF',
      icon: '#3B82F6',
    },
  },

  // Estados de pago
  payment: {
    pending: {
      bg: '#FFFBEB',
      text: '#92400E',
      border: '#FDE68A',
    },
    markedPaid: {
      bg: '#EFF6FF',
      text: '#1E40AF',
      border: '#BFDBFE',
    },
    confirmed: {
      bg: '#ECFDF5',
      text: '#065F46',
      border: '#A7F3D0',
    },
    overdue: {
      bg: '#FEF2F2',
      text: '#991B1B',
      border: '#FECACA',
    },
    cancelled: {
      bg: '#F5F5F4',
      text: '#57534E',
      border: '#D6D3D1',
    },
  },
}
```

### 1.2 Colores - Dark Theme

```typescript
export const darkTheme = {
  primary: {
    50: '#00352D',
    100: '#004C3F',
    200: '#006351',
    300: '#007A62',
    400: '#009173',
    500: '#2DD4A8',   // Principal (más brillante para contraste)
    600: '#33A78F',
    700: '#66BDAB',
    800: '#99D3C7',
    900: '#CCE9E3',
  },

  secondary: {
    // Invertir escala similar
    500: '#FBBF24',
  },

  neutral: {
    0: '#0C0A09',     // Fondo principal
    50: '#1C1917',
    100: '#292524',   // Fondo cards
    200: '#44403C',   // Bordes
    300: '#57534E',
    400: '#78716C',
    500: '#A8A29E',   // Texto secundario
    600: '#D6D3D1',
    700: '#E7E5E4',
    800: '#F5F5F4',
    900: '#FAFAF9',   // Texto principal
  },

  payment: {
    pending: {
      bg: '#422006',
      text: '#FDE68A',
      border: '#78350F',
    },
    markedPaid: {
      bg: '#1E3A5F',
      text: '#BFDBFE',
      border: '#1E40AF',
    },
    confirmed: {
      bg: '#064E3B',
      text: '#A7F3D0',
      border: '#065F46',
    },
    overdue: {
      bg: '#7F1D1D',
      text: '#FECACA',
      border: '#991B1B',
    },
    cancelled: {
      bg: '#292524',
      text: '#A8A29E',
      border: '#44403C',
    },
  },
}
```

### 1.3 Tipografía

```typescript
// Tamaños base (se escalan con fontScale del sistema)
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
}

// Line height (suficiente para evitar recortes)
export const lineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 28,
  xl: 28,
  '2xl': 32,
  '3xl': 40,
}

// Pesos
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}

// Presets
export const textStyles = {
  h1: { fontSize: fontSize['2xl'], lineHeight: lineHeight['2xl'], fontWeight: fontWeight.bold },
  h2: { fontSize: fontSize.xl, lineHeight: lineHeight.xl, fontWeight: fontWeight.semibold },
  h3: { fontSize: fontSize.lg, lineHeight: lineHeight.lg, fontWeight: fontWeight.semibold },
  body: { fontSize: fontSize.base, lineHeight: lineHeight.base, fontWeight: fontWeight.regular },
  bodySmall: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, fontWeight: fontWeight.regular },
  caption: { fontSize: fontSize.xs, lineHeight: lineHeight.xs, fontWeight: fontWeight.regular },
  button: { fontSize: fontSize.base, lineHeight: lineHeight.base, fontWeight: fontWeight.semibold },
}
```

### 1.4 Espaciado y áreas táctiles

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
}

export const touchable = {
  minHeight: 48,
  minWidth: 48,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
}

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
}
```

---

## 2. Componentes Base

### 2.1 AppText

```typescript
interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'button'
  color?: string
  accessibilityRole?: 'header' | 'text' | 'link'
  accessibilityLiveRegion?: 'none' | 'polite' | 'assertive'
}
```

**Accesibilidad:**
- `allowFontScaling={true}` siempre
- Soporta `accessibilityRole="header"` para títulos
- `accessibilityLiveRegion` para anuncios dinámicos

### 2.2 AppButton

```typescript
interface AppButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  accessibilityHint?: string
}
```

**Accesibilidad:**
- `accessibilityRole="button"`
- `accessibilityState={{ disabled, busy: loading }}`
- `accessibilityLabel={title}`
- Mínimo 48x48 con hitSlop
- Si loading: anuncia "Cargando"
- Feedback háptico opcional

### 2.3 AppInput

```typescript
interface AppInputProps extends TextInputProps {
  label: string
  error?: string
  hint?: string
  required?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}
```

**Accesibilidad:**
- Label siempre visible (no solo placeholder)
- `accessibilityLabel={label + (required ? ', requerido' : '')}`
- `accessibilityHint={hint}`
- Error con `accessibilityLiveRegion="polite"`
- Error: borde + icono + texto (no solo color)
- Área táctil mínima 48px

### 2.4 AppCard

```typescript
interface AppCardProps {
  children: ReactNode
  onPress?: () => void
  accessibilityLabel: string  // Obligatorio
  accessibilityHint?: string
  variant?: 'elevated' | 'outlined' | 'filled'
}
```

**Accesibilidad:**
- Si presionable: `accessibilityRole="button"`
- Si no: `accessibilityRole="summary"`
- Agrupa contenido en un solo foco
- Label describe contenido completo

### 2.5 StatusBadge

```typescript
interface StatusBadgeProps {
  status: 'pending' | 'markedPaid' | 'confirmed' | 'overdue' | 'cancelled'
  size?: 'sm' | 'md'
}

const statusConfig = {
  pending: { label: 'Pendiente', icon: 'Clock' },
  markedPaid: { label: 'Marcado como pagado', icon: 'Send' },
  confirmed: { label: 'Confirmado', icon: 'CheckCircle' },
  overdue: { label: 'Atrasado', icon: 'AlertTriangle' },
  cancelled: { label: 'Cancelado', icon: 'XCircle' },
}
```

**Accesibilidad:**
- Icono + texto (nunca solo color)
- `accessibilityLabel={statusConfig[status].label}`

### 2.6 AppScreen

```typescript
interface AppScreenProps {
  title?: string
  children: ReactNode
  scrollable?: boolean
  loading?: boolean
  error?: string
  onRetry?: () => void
  headerRight?: ReactNode
}
```

**Accesibilidad:**
- SafeAreaView
- Loading con `accessibilityLabel="Cargando"`
- Error con `accessibilityLiveRegion="assertive"`
- Título como header semántico

### 2.7 Componentes adicionales

| Componente | Propósito | Props clave |
|------------|-----------|-------------|
| `AppModal` | Modales/bottom sheets | `visible`, `onClose`, `title` |
| `AppList` | FlatList wrapper | `data`, `renderItem`, `emptyMessage` |
| `AppEmptyState` | Estado vacío | `icon`, `title`, `description`, `action` |
| `AppAvatar` | Avatar de usuario | `name`, `imageUrl`, `size` |
| `AppIcon` | Iconos | `name`, `size`, `color`, `accessibilityLabel` |
| `AppRating` | Estrellas | `value`, `onChange`, `readonly` |
| `AppDivider` | Separador | `label` (opcional) |
| `AppChip` | Filtros/tags | `label`, `selected`, `onPress` |

---

## 3. Estructura de Navegación

```
(auth)/                    # Stack no autenticado
  ├── login.tsx
  ├── register.tsx
  └── forgot-password.tsx

(tabs)/                    # Tab navigator autenticado
  ├── _layout.tsx
  ├── index.tsx            # Home / Mis grupos
  ├── explore.tsx          # Buscar grupos
  ├── notifications.tsx    # Bandeja
  └── profile.tsx          # Perfil y settings

groups/
  ├── [id]/
  │   ├── index.tsx        # Detalle del grupo
  │   ├── members.tsx      # Lista de miembros
  │   ├── payments.tsx     # Historial de pagos
  │   └── settings.tsx     # Config (owner)
  ├── create.tsx           # Crear grupo
  └── join/[id].tsx        # Solicitar unirse

payments/
  ├── [id].tsx             # Detalle de cuota
  └── mark-paid.tsx        # Marcar como pagado

ratings/
  └── create.tsx           # Calificar usuario
```

---

## 4. Wireframes

### 4.1 Home (Mis Grupos)

```
┌─────────────────────────────┐
│  Hola, Jorge                │
│                             │
│  ┌────────────────────────┐ │
│  │ 🎵 Spotify Familiar    │ │
│  │    3/5 miembros        │ │
│  │    ┌─────────────┐     │ │
│  │    │ 1 pendiente │     │ │
│  │    └─────────────┘     │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │ 📺 YouTube Premium     │ │
│  │    5/5 miembros        │ │
│  │    ✓ Al día            │ │
│  └────────────────────────┘ │
│                             │
│         + Crear grupo       │
│                             │
├─────────────────────────────┤
│  🏠    🔍    🔔    👤       │
└─────────────────────────────┘
```

### 4.2 Detalle de Grupo

```
┌─────────────────────────────┐
│  ←  Spotify Familiar        │
│                             │
│  ┌────────────────────────┐ │
│  │  🎵                    │ │
│  │  $8.000/mes            │ │
│  │  3/5 miembros          │ │
│  │  Próximo pago: 15 nov  │ │
│  └────────────────────────┘ │
│                             │
│  Mi cuota                   │
│  ┌────────────────────────┐ │
│  │  Noviembre 2026        │ │
│  │  ⏳ Pendiente          │ │
│  │  $8.000 · Vence 15 nov │ │
│  │            [Ver →]     │ │
│  └────────────────────────┘ │
│                             │
│  Miembros                   │
│  ┌────────────────────────┐ │
│  │ 👤 Jorge (Admin) ★4.8  │ │
│  │ 👤 María        ★4.5   │ │
│  │ 👤 Carlos       ★4.9   │ │
│  │        Ver todos →     │ │
│  └────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

### 4.3 Detalle de Cuota

```
┌─────────────────────────────┐
│  ←  Cuota Noviembre         │
│                             │
│  ┌────────────────────────┐ │
│  │       $8.000           │ │
│  │         COP            │ │
│  │                        │ │
│  │    ⏳ Pendiente        │ │
│  │    Vence: 15 nov 2026  │ │
│  └────────────────────────┘ │
│                             │
│  Datos de pago              │
│  ┌────────────────────────┐ │
│  │  Nequi                 │ │
│  │  300 123 4567  [📋]    │ │
│  └────────────────────────┘ │
│                             │
│  Referencia (opcional)      │
│  ┌────────────────────────┐ │
│  │  Ej: últimos 4 dígitos │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │      Ya pagué ✓        │ │
│  └────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

### 4.4 Explorar Grupos

```
┌─────────────────────────────┐
│  Explorar                   │
│  ┌────────────────────────┐ │
│  │ 🔍 Buscar grupos...    │ │
│  └────────────────────────┘ │
│                             │
│  [Spotify] [YouTube] [+]    │
│                             │
│  ┌────────────────────────┐ │
│  │ 🎵 Spotify Familiar    │ │
│  │    $8.000/mes          │ │
│  │    2 cupos disponibles │ │
│  │    ★4.8 Jorge          │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │ 📺 YouTube Premium     │ │
│  │    $6.500/mes          │ │
│  │    1 cupo disponible   │ │
│  │    ★4.5 María          │ │
│  └────────────────────────┘ │
│                             │
├─────────────────────────────┤
│  🏠    🔍    🔔    👤       │
└─────────────────────────────┘
```

### 4.5 Perfil

```
┌─────────────────────────────┐
│  Perfil                     │
│                             │
│  ┌────────────────────────┐ │
│  │      👤                │ │
│  │    Jorge Montalvo      │ │
│  │    ★4.8 · 12 grupos    │ │
│  │    Desde nov 2026      │ │
│  └────────────────────────┘ │
│                             │
│  Configuración              │
│  ┌────────────────────────┐ │
│  │ Tema oscuro        [○] │ │
│  │ Alto contraste     [○] │ │
│  │ Vibración          [●] │ │
│  └────────────────────────┘ │
│                             │
│  Cuenta                     │
│  ┌────────────────────────┐ │
│  │ Editar perfil      →   │ │
│  │ Métodos de cobro   →   │ │
│  │ Cambiar contraseña →   │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │     Cerrar sesión      │ │
│  └────────────────────────┘ │
│                             │
├─────────────────────────────┤
│  🏠    🔍    🔔    👤       │
└─────────────────────────────┘
```

---

## 5. Matriz Trazable de Accesibilidad

| # | Mejora | Componente | Prueba | WCAG | Estado |
|---|--------|------------|--------|------|--------|
| 1 | Rol y etiqueta en botones | `AppButton.tsx` | TalkBack lee "[título], botón" | 4.1.2 | Pendiente |
| 2 | Estado disabled/loading anunciado | `AppButton.tsx` | TalkBack lee "desactivado" o "cargando" | 4.1.2 | Pendiente |
| 3 | Labels visibles en inputs | `AppInput.tsx` | Label visible sin placeholder | 3.3.2 | Pendiente |
| 4 | Errores anunciados | `AppInput.tsx` | TalkBack anuncia error | 3.3.1 | Pendiente |
| 5 | Errores no solo con color | `AppInput.tsx` | Borde + icono + texto | 1.4.1 | Pendiente |
| 6 | Cards como foco único | `AppCard.tsx` | TalkBack lee resumen completo | 2.4.6 | Pendiente |
| 7 | Estados con icono+texto | `StatusBadge.tsx` | Visible sin color | 1.4.1 | Pendiente |
| 8 | Contraste texto ≥4.5:1 | `theme/colors.ts` | Verificado con herramienta | 1.4.3 | Pendiente |
| 9 | Tipografía escalable | `AppText.tsx` | Funciona con fuente 200% | 1.4.4 | Pendiente |
| 10 | Áreas táctiles ≥48dp | Todos los touchables | Medir con inspector | 2.5.5 | Pendiente |
| 11 | hitSlop en elementos pequeños | Iconos, toggles | Área efectiva ≥48dp | 2.5.5 | Pendiente |
| 12 | Orden de foco lógico | Todas las pantallas | Navegar con TalkBack | 2.4.3 | Pendiente |
| 13 | Foco en modal al abrir | `AppModal.tsx` | Foco va al primer elemento | 2.4.3 | Pendiente |
| 14 | Foco tras cerrar modal | `AppModal.tsx` | Foco vuelve al trigger | 2.4.3 | Pendiente |
| 15 | Headers semánticos | Pantallas con secciones | TalkBack navega headers | 2.4.6 | Pendiente |
| 16 | Mensajes de carga | `AppScreen.tsx` | TalkBack anuncia "Cargando" | 4.1.3 | Pendiente |
| 17 | Mensajes de error | `AppScreen.tsx`, forms | TalkBack anuncia error | 4.1.3 | Pendiente |
| 18 | Retroalimentación háptica | Acciones importantes | Vibración configurable | UX | Pendiente |
| 19 | Alto contraste toggle | `profile.tsx` | Colores cambian | 1.4.3 | Pendiente |
| 20 | eslint-plugin-react-native-a11y | CI | Lint pasa sin warnings | Auto | Pendiente |

---

## 6. Settings de Accesibilidad

```typescript
interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  highContrast: boolean
  reduceMotion: boolean
  hapticFeedback: boolean
}
```

---

## 7. Iconografía

Usar **lucide-react-native** (instalar con `npx expo install lucide-react-native react-native-svg`):

| Concepto | Icono | Nombre Lucide |
|----------|-------|---------------|
| Pendiente | ⏳ | `Clock` |
| Marcado pagado | 📤 | `Send` |
| Confirmado | ✓ | `CheckCircle` |
| Atrasado | ⚠️ | `AlertTriangle` |
| Cancelado | ✕ | `XCircle` |
| Miembro aprobado | ✓ | `UserCheck` |
| Miembro rechazado | ✕ | `UserX` |
| Solicitud pendiente | ⏳ | `UserPlus` |
| Copiar | 📋 | `Copy` |
| Editar | ✏️ | `Pencil` |
| Eliminar | 🗑️ | `Trash2` |
| Configuración | ⚙️ | `Settings` |
| Notificación | 🔔 | `Bell` |
| Buscar | 🔍 | `Search` |
| Filtrar | ⚙️ | `SlidersHorizontal` |
| Cerrar | ✕ | `X` |
| Atrás | ← | `ArrowLeft` |
| Siguiente | → | `ChevronRight` |
| Agregar | + | `Plus` |

---

## 8. Principios de Diseño

### 8.1 Espacio y respiración
- Padding contenedores: 16-24px
- Separación entre elementos: 12-16px
- Cards con padding interno: 16px
- Máximo 3-4 acciones por pantalla

### 8.2 Tipografía limpia
- 1 familia: System font
- 3 tamaños máximo por pantalla
- Regular para body, Medium énfasis, Semibold títulos

### 8.3 Jerarquía visual
- Un CTA principal por pantalla (filled)
- Acciones secundarias en texto/outline
- Estados siempre con icono + texto + fondo sutil

### 8.4 Navegación simple
- Bottom tabs: 4 items (Inicio, Explorar, Notificaciones, Perfil)
- Headers: título + máximo 1 acción
- Back button siempre visible

---

## 9. Checklist por Pantalla

```markdown
## [ ] Nombre de pantalla

### VoiceOver (iOS)
- [ ] Todos los elementos interactivos tienen label
- [ ] Orden de lectura lógico
- [ ] Headers anunciados
- [ ] Estados anunciados

### TalkBack (Android)
- [ ] Mismos criterios
- [ ] accessibilityLiveRegion funciona

### Visual
- [ ] Fuente al 200% funciona
- [ ] Alto contraste funciona
- [ ] Estados visibles sin color

### Motor
- [ ] Áreas táctiles ≥48dp
- [ ] No requiere gestos complejos
```

---

## 10. Automatización

```json
// .eslintrc
{
  "plugins": ["react-native-a11y"],
  "extends": ["plugin:react-native-a11y/recommended"]
}
```

Integrar en CI para que falle el build si hay errores de accesibilidad.

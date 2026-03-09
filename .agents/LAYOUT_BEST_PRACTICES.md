# Layout Best Practices for Vite + React Router

## Overview
This document outlines best practices for organizing layouts in a Vite + React Router application.

## 1. Layout Route Pattern (Using `<Outlet />`)

**Best Practice**: Use layout routes with `<Outlet />` to wrap shared UI components.

### Benefits:
- ✅ Shared components (Navbar, Footer) render once, not re-rendered on route changes
- ✅ Clean separation of concerns
- ✅ Easy to add nested routes
- ✅ Better performance (no unnecessary re-renders)

### Implementation:
```tsx
// AppLayout.tsx
import { Outlet } from 'react-router'
import Navbar from './Navbar'

const AppLayout = () => {
  return (
    <div>
      <Navbar />
      <Outlet /> {/* Child routes render here */}
    </div>
  )
}
```

```tsx
// main.tsx
<Routes>
  <Route element={<AppLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Route>
</Routes>
```

## 2. Multiple Layouts for Different Sections

**Best Practice**: Use different layouts for different sections of your app.

### Example Structure:
```
- Public Layout (Navbar + Footer) → Home, About, Features
- Auth Layout (Minimal) → Login, Signup
- Dashboard Layout (Sidebar + Header) → Dashboard, Settings
- Admin Layout (Admin Navbar) → Admin routes
```

### Implementation:
```tsx
<Routes>
  {/* Public routes */}
  <Route element={<PublicLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
  </Route>
  
  {/* Auth routes */}
  <Route element={<AuthLayout />}>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
  </Route>
  
  {/* Protected routes */}
  <Route element={<ProtectedLayout />}>
    <Route path="/dashboard" element={<DashboardPage />} />
  </Route>
</Routes>
```

## 3. Reusable Page Layout Components

**Best Practice**: Create reusable layout components for consistent page structure.

### Benefits:
- ✅ Consistent spacing and styling
- ✅ DRY principle
- ✅ Easy to update all pages at once

### Example:
```tsx
// PageLayout.tsx
const PageLayout = ({ children, className }) => {
  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 ${className}`}>
      {children}
    </div>
  )
}
```

## 4. Centralized Route Configuration

**Best Practice**: Define routes in a separate file for better organization.

### Benefits:
- ✅ All routes visible in one place
- ✅ Easy to add route-level features (loaders, error boundaries)
- ✅ Better for code splitting with lazy loading
- ✅ Easier to test

### Implementation:
```tsx
// routes.tsx
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/profile', element: <ProfilePage /> },
    ],
  },
]

// main.tsx
import { useRoutes } from 'react-router'
import { routes } from './routes'

function App() {
  return useRoutes(routes)
}
```

## 5. Code Splitting with Lazy Loading

**Best Practice**: Use React.lazy() for route-based code splitting.

### Benefits:
- ✅ Smaller initial bundle size
- ✅ Faster initial load time
- ✅ Better performance

### Implementation:
```tsx
import { lazy, Suspense } from 'react'

const HomePage = lazy(() => import('./pages/HomePage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))

// Wrap routes with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />
    </Route>
  </Routes>
</Suspense>
```

## 6. Error Boundaries at Layout Level

**Best Practice**: Add error boundaries to catch and handle errors gracefully.

### Implementation:
```tsx
// ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // ... error boundary logic
}

// In routes
<Route 
  element={<AppLayout />}
  errorElement={<ErrorBoundary />}
>
  <Route path="/" element={<HomePage />} />
</Route>
```

## 7. Route-Level Data Loading

**Best Practice**: Use React Router loaders for data fetching (React Router v6.4+).

### Benefits:
- ✅ Data loads before component renders
- ✅ Better UX (no loading spinners)
- ✅ Type-safe with TypeScript

### Implementation:
```tsx
// In routes.tsx
{
  path: '/profile/:id',
  element: <ProfilePage />,
  loader: async ({ params }) => {
    const profile = await fetchProfile(params.id)
    return { profile }
  },
}

// In component
import { useLoaderData } from 'react-router'
const ProfilePage = () => {
  const { profile } = useLoaderData()
  // ...
}
```

## 8. Protected Routes Pattern

**Best Practice**: Create a wrapper component for protected routes.

### Implementation:
```tsx
// ProtectedRoute.tsx
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  return children
}

// In routes
<Route 
  element={
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  }
>
  <Route path="/dashboard" element={<DashboardPage />} />
</Route>
```

## 9. Nested Routes for Complex UIs

**Best Practice**: Use nested routes for complex page structures.

### Example: Dashboard with tabs
```tsx
<Route path="/dashboard" element={<DashboardLayout />}>
  <Route index element={<DashboardOverview />} />
  <Route path="settings" element={<SettingsPage />} />
  <Route path="analytics" element={<AnalyticsPage />} />
</Route>
```

## 10. Layout State Management

**Best Practice**: Keep layout-specific state in layout components.

### Example:
```tsx
const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div>
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} />
      <Outlet />
    </div>
  )
}
```

## Current Implementation

Your app now uses:
- ✅ `AppLayout` - Main layout with Navbar
- ✅ `PageLayout` - Reusable page wrapper
- ✅ Layout route pattern with `<Outlet />`
- ✅ Centralized route configuration (optional)

## Next Steps (Optional Enhancements)

1. **Add Error Boundaries**: Wrap routes with error boundaries
2. **Implement Lazy Loading**: Use React.lazy() for code splitting
3. **Add Loading States**: Use Suspense boundaries
4. **Create Auth Layout**: Separate layout for login/signup pages
5. **Add Protected Routes**: Implement authentication guards


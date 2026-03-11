/**
 * Route configuration file
 * 
 * Best Practice: Centralize route definitions for better maintainability
 * This makes it easier to:
 * - See all routes at a glance
 * - Add route-level features (loaders, error boundaries, etc.)
 * - Implement code splitting with lazy loading
 */

import type { RouteObject } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import CreatePage from './pages/CreatePage'
import ProfilePage from './pages/ProfilePage'

// Example: Lazy loading for better code splitting
// import { lazy } from 'react'
// const HomePage = lazy(() => import('./pages/HomePage'))
// const CreatePage = lazy(() => import('./pages/CreatePage'))
// const ProfilePage = lazy(() => import('./pages/ProfilePage'))

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      {
        path: '/',
        element: <HomePage />,
        // Future: Add route-specific features
        // loader: homePageLoader,
        // errorElement: <ErrorPage />,
      },
      {
        path: '/create',
        element: <CreatePage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/resume',
        element: <ProfilePage />,
      },
    ],
  },
  // Example: Different layout for auth pages
  // {
  //   element: <AuthLayout />,
  //   children: [
  //     { path: '/login', element: <LoginPage /> },
  //     { path: '/signup', element: <SignupPage /> },
  //   ],
  // },
]


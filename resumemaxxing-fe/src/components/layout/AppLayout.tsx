import { Outlet } from 'react-router'
import Navbar from './Navbar'

/**
 * Main application layout component
 * Wraps all routes with shared UI elements like Navbar
 * Uses Outlet to render child routes
 */
const AppLayout = () => {
  return (
    <div className="w-full flex flex-col text-white min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout


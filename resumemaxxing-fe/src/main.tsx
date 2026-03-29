import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import CreatePage from './pages/ManualPage'
import ProfilePage from './pages/ProfilePage'
import ManifestoPage from './pages/ManifestoPage'
import AutoCreatePage from './pages/AutoCreatePage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/manifesto" element={<ManifestoPage />} />
          <Route path="/auto-create" element={<AutoCreatePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)

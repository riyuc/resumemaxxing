import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import CreatePage from './pages/CreatePage'
import ProfilePage from './pages/ProfilePage'
import ManifestoPage from './pages/ManifestoPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path='/manifesto' element={<ManifestoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)

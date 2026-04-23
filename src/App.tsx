import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'

function Header() {
  return (
    <header className="flex items-center gap-6 px-6 py-3 bg-surface border-b border-border flex-shrink-0">
      <div className="font-display font-bold text-xl text-cyan tracking-widest">LILA</div>
      <div className="text-[#6B7A99] font-mono text-xs">Player Journey Tool</div>
      <nav className="ml-auto flex gap-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `font-mono text-xs uppercase tracking-widest transition-colors ${
              isActive ? 'text-cyan' : 'text-[#6B7A99] hover:text-[#E8EDF5]'
            }`
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/map/AmbroseValley"
          className={({ isActive }) =>
            `font-mono text-xs uppercase tracking-widest transition-colors ${
              isActive ? 'text-cyan' : 'text-[#6B7A99] hover:text-[#E8EDF5]'
            }`
          }
        >
          Map View
        </NavLink>
      </nav>
    </header>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-full flex flex-col bg-base">
        <Header />
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/map/:mapId"  element={<MapView />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

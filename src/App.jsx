import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Board from './pages/Board'
import Stats from './pages/Stats'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100">
        <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-6 shadow-sm">
          <span className="font-bold text-slate-800 text-lg">Задачи команды</span>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            Доска
          </NavLink>
          <NavLink
            to="/stats"
            className={({ isActive }) =>
              `text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`
            }
          >
            Статистика
          </NavLink>
        </nav>
        <main className="px-6 py-6">
          <Routes>
            <Route path="/" element={<Board />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

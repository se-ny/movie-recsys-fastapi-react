import React, { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Home, Target, Clapperboard, Flame, Users, FolderKanban, Moon, Sun, Ticket } from 'lucide-react'

const navSections = [
  {
    label: '둘러보기',
    links: [
      { to: '/', label: '홈', end: true, Icon: Home },
      { to: '/recommendations', label: 'AI 추천', Icon: Target },
      { to: '/movies', label: '영화 둘러보기', Icon: Clapperboard },
      { to: '/trending', label: '트렌딩', Icon: Flame },
    ],
  },
  {
    label: '관리',
    links: [
      { to: '/admin/users', label: '회원 관리', Icon: Users },
      { to: '/admin/movies', label: '영화 관리', Icon: FolderKanban },
    ],
  },
]

export default function Layout(){
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark-tile"><Ticket size={16} strokeWidth={2.4} /></span>
          <div>
            <div className="brand-name">씨네매치</div>
            <div className="brand-tagline">CineMatch</div>
          </div>
        </div>
        {navSections.map(section => (
          <div className="nav-group" key={section.label}>
            <div className="nav-label">{section.label}</div>
            {section.links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <link.Icon size={16} strokeWidth={2} />
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="sidebar-footer">
          <button
            className="btn btn-ghost btn-sm row"
            style={{ width: '100%', justifyContent: 'flex-start' }}
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            {theme === 'dark' ? '다크 모드' : '라이트 모드'}
          </button>
        </div>
      </aside>
      <div className="main-area">
        <Outlet />
      </div>
    </div>
  )
}

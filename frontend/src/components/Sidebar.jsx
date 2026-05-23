import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Sidebar({ currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const permissionsStr = localStorage.getItem('permissions');
  let userPages = [];
  if (permissionsStr) {
    try {
      const perms = JSON.parse(permissionsStr);
      if (currentUser && perms[currentUser]) {
        userPages = perms[currentUser].page_permissions || [];
      }
    } catch (e) {
      console.error(e);
    }
  }
  const handleLogout = () => {
    localStorage.removeItem('session_id');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    navigate('/');
  };
  const isActive = (path) => location.pathname === path;
  const LinkItem = ({ to, label, symbol }) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-all duration-200 font-medium text-sm tracking-wide ${
        isActive(to)
          ? 'border-white text-white bg-zinc-900'
          : 'border-transparent text-zinc-500 hover:text-white hover:border-zinc-600 hover:bg-zinc-950'
      }`}
    >
      <span className="font-mono text-xs w-6 text-center">{symbol}</span>
      <span>{label}</span>
    </Link>
  );

  return (
    <div className="w-64 bg-black border-r border-zinc-800 fixed h-screen flex flex-col">
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-lg font-bold tracking-widest uppercase text-white font-mono">STAJ TAKİP</h1>
        <p className="text-xs text-zinc-600 mt-1 tracking-wider">Staj Yönetim Sistemi v1.0</p>
      </div>
      <div className="px-6 py-4 border-b border-zinc-800">
        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Aktif Oturum</p>
        <p className="text-sm text-white font-semibold">{currentUser || 'Misafir'}</p>
      </div>
      <div className="flex-1 overflow-y-auto py-4 flex flex-col">
        <div className="px-6 mb-2">
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.2em] font-bold">Navigasyon</p>
        </div>
        
        {currentUser === 'Supervisor' && (
          <>
            <LinkItem to="/supervisor" label="Yetki Yönetimi" symbol="[⚙]" />
            <LinkItem to="/logs" label="Sistem Logları" symbol="[▤]" />
          </>
        )}

        {userPages.includes('Ogrenci Listesi') && (
          <LinkItem to="/student" label="Öğrenci Listesi" symbol="[◉]" />
        )}
        {userPages.includes('Okul Yonetimi') && (
          <LinkItem to="/school" label="Okul Yönetimi" symbol="[◈]" />
        )}
        {userPages.includes('Isletme Profili') && (
          <LinkItem to="/business" label="İşletme Profili" symbol="[◆]" />
        )}

        <div className="px-6 mt-6 mb-2">
          <p className="text-[10px] text-zinc-700 uppercase tracking-[0.2em] font-bold">Araçlar</p>
        </div>
        <LinkItem to="/files" label="Dosya Merkezi" symbol="[↑]" />
        <LinkItem to="/editor" label="AI Editör" symbol="[⚡]" />
      </div>
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="w-full border border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-500 py-2.5 text-sm font-medium transition-all duration-200 uppercase tracking-wider"
        >
          [×] Çıkış
        </button>
      </div>
    </div>
  );
}

export default Sidebar;

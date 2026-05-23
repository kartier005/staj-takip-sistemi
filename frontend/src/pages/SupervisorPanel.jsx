import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api';

const ALL_PAGES = ['Ogrenci Listesi', 'Okul Yonetimi', 'Isletme Profili', 'Dosya Merkezi', 'AI Asistan'];
const ALL_CRUD = ['create', 'read', 'update', 'delete'];

function SupervisorPanel() {
  const [permissions, setPermissions] = useState({
    'Ogrenci': { page_permissions: [], crud_permissions: [] },
    'Okul': { page_permissions: [], crud_permissions: [] },
    'Isletme': { page_permissions: [], crud_permissions: [] },
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchPermissions();
  }, []);
  const fetchPermissions = async () => {
    try {
      const res = await api.get('/api/permissions');
      const apiPerms = res.data.permissions || {};
      setPermissions({
        'Ogrenci': apiPerms['Ogrenci'] || { page_permissions: [], crud_permissions: [] },
        'Okul': apiPerms['Okul'] || { page_permissions: [], crud_permissions: [] },
        'Isletme': apiPerms['Isletme'] || { page_permissions: [], crud_permissions: [] },
      });
    } catch (err) {
      console.error(err);
      showMessage('Yetkiler yüklenemedi', 'error');
    } finally {
      setLoading(false);
    }
  };
  const handleToggle = (role, type, item) => {
    setPermissions(prev => {
      const currentList = prev[role][type] || [];
      const newList = currentList.includes(item)
        ? currentList.filter(i => i !== item)
        : [...currentList, item];
      return { ...prev, [role]: { ...prev[role], [type]: newList } };
    });
  };
  const handleSave = async (role) => {
    try {
      const data = permissions[role];
      await api.put(`/api/permissions/${role}`, data);
      const permRes = await api.get('/api/permissions');
      localStorage.setItem('permissions', JSON.stringify(permRes.data.permissions || {}));
      showMessage(`${role} yetkileri başarıyla güncellendi`, 'success');
    } catch (err) {
      console.error(err);
      showMessage('Kaydetme hatası', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (loading) return (
    <div className="flex bg-black min-h-screen">
      <Sidebar currentUser="Supervisor" />
      <div className="ml-64 flex-1 flex items-center justify-center">
        <p className="text-zinc-600 font-mono text-sm">YÜKLENİYOR...</p>
      </div>
    </div>
  );

  return (
    <div className="flex bg-black min-h-screen">
      <Sidebar currentUser="Supervisor" />
      <div className="ml-64 flex-1 flex flex-col">
        <Navbar title="Yetki Yönetimi" />
        <main className="p-8 flex-1">
          
          {message.text && (
            <div className={`mb-6 px-4 py-3 text-sm font-medium fade-in border ${
              message.type === 'success'
                ? 'border-green-500/30 text-green-400 bg-green-500/5'
                : 'border-red-500/30 text-red-400 bg-red-500/5'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {['Ogrenci', 'Okul', 'Isletme'].map(role => (
              <div key={role} className="border border-zinc-800 flex flex-col fade-in">
                <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">{role}</h2>
                  <p className="text-[10px] text-zinc-600 mt-1 uppercase tracking-widest">Rol Yetkileri</p>
                </div>

                <div className="p-6 flex-1 space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">Sayfa Erişimi</p>
                    <div className="space-y-2">
                      {ALL_PAGES.map(page => (
                        <label key={page} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={permissions[role].page_permissions.includes(page)}
                            onChange={() => handleToggle(role, 'page_permissions', page)}
                            className="w-4 h-4 accent-white bg-black border-zinc-700 cursor-pointer"
                          />
                          <span className="text-sm text-zinc-400 group-hover:text-white transition-colors">{page}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3">CRUD İşlemleri</p>
                    <div className="space-y-2">
                      {ALL_CRUD.map(crud => (
                        <label key={crud} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={permissions[role].crud_permissions.includes(crud)}
                            onChange={() => handleToggle(role, 'crud_permissions', crud)}
                            className="w-4 h-4 accent-white bg-black border-zinc-700 cursor-pointer"
                          />
                          <span className="text-sm text-zinc-400 group-hover:text-white transition-colors uppercase font-mono">{crud}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-800">
                  <button
                    onClick={() => handleSave(role)}
                    className="w-full border border-zinc-700 text-zinc-300 hover:border-white hover:text-white py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200"
                  >
                    Kaydet →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default SupervisorPanel;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api';

function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { navigate('/'); return; }
    const user = JSON.parse(userStr);
    setUserRole(user.role);
    if (user.role !== 'Supervisor') { navigate('/'); return; }
    fetchLogs();
  }, [navigate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/logs?limit=100');
      if (res.data.status === 'success') setLogs(res.data.logs);
    } catch (err) {
      console.error(err);
      setError('Loglar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-black min-h-screen">
      <Sidebar currentUser={userRole} />
      <div className="ml-64 flex-1 flex flex-col">
        <Navbar title="Sistem Logları" />
        <main className="p-8 flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm text-zinc-400 uppercase tracking-wider">Son 100 Olay</h2>
            </div>
            <button onClick={fetchLogs} className="border border-zinc-700 text-zinc-400 hover:border-white hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200">
              [↑] Yenile
            </button>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/5 text-red-400 px-4 py-3 mb-6 text-sm">{error}</div>
          )}

          <div className="border border-zinc-800 fade-in">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">#</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Tarih</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Kullanıcı</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">İşlem</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-zinc-600 font-mono text-sm">YÜKLENİYOR...</td></tr>
                  ) : logs.length > 0 ? (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-zinc-900 hover:bg-zinc-950 transition-colors">
                        <td className="px-6 py-3 text-zinc-700 font-mono text-xs">{log.id}</td>
                        <td className="px-6 py-3 text-zinc-500 text-xs whitespace-nowrap">{new Date(log.log_time).toLocaleString('tr-TR')}</td>
                        <td className="px-6 py-3 text-white text-xs font-medium">@{log.performed_by}</td>
                        <td className="px-6 py-3">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 border ${
                            log.action_type === 'LOGIN' ? 'border-zinc-600 text-zinc-300' :
                            log.action_type === 'CREATE' || log.action_type.includes('INSERT') ? 'border-green-800 text-green-500' :
                            log.action_type.includes('UPDATE') ? 'border-blue-800 text-blue-400' :
                            log.action_type.includes('DELETE') ? 'border-red-800 text-red-400' :
                            'border-zinc-800 text-zinc-500'
                          }`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-zinc-400 text-xs">{log.action_desc}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-zinc-600 text-sm">Henüz log kaydı yok.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default LogsPage;

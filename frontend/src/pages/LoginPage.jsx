import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', { username, password });
      
      if (response.data.status === 'success') {
        localStorage.setItem('session_id', response.data.session_id);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        const permRes = await api.get('/api/permissions');
        localStorage.setItem('permissions', JSON.stringify(permRes.data.permissions || {}));
        const role = response.data.user.role;
        if (role === 'Supervisor') navigate('/supervisor');
        else if (role === 'Ogrenci' || role === 'Öğrenci') navigate('/student');
        else if (role === 'Okul') navigate('/school');
        else if (role === 'Isletme' || role === 'İşletme') navigate('/business');
        else navigate('/files');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Giriş başarısız. Bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-12">
          <div className="inline-block border border-zinc-800 px-6 py-3 mb-6">
            <span className="text-2xl font-bold tracking-[0.3em] text-white font-mono">STAJ TAKİP</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sisteme Giriş</h1>
          <p className="text-zinc-600 text-sm mt-2">Staj takip paneline erişmek için kimlik doğrulaması yapın</p>
        </div>
        {error && (
          <div className="border border-red-500/30 bg-red-500/5 text-red-400 px-4 py-3 mb-6 text-sm font-medium fade-in">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="border border-zinc-800 p-8">
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black border border-zinc-800 text-white p-3 text-sm focus:border-white outline-none transition-colors placeholder-zinc-700"
              placeholder="kullanici_adi"
              required
            />
          </div>
          <div className="mb-8">
            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-zinc-800 text-white p-3 text-sm focus:border-white outline-none transition-colors placeholder-zinc-700"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-white text-white py-3 text-sm font-bold uppercase tracking-[0.15em] hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {loading ? 'Doğrulanıyor...' : 'Giriş Yap →'}
          </button>
        </form>
        <div className="mt-8 border border-zinc-900 p-6">
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-bold mb-4">Örnek Hesaplar</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { role: 'Supervisor', user: 'supervisor', pass: 'supervisor123' },
              { role: 'Öğrenci', user: 'ogrenci1', pass: 'ogrenci123' },
              { role: 'Okul', user: 'okul1', pass: 'okul123' },
              { role: 'İşletme', user: 'isletme1', pass: 'isletme123' },
            ].map((item, idx) => (
              <div key={idx} className="border border-zinc-900 p-3 hover:border-zinc-700 transition-colors">
                <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{item.role}</p>
                <p className="text-xs text-zinc-400 mt-1 font-mono">{item.user}</p>
                <p className="text-xs text-zinc-600 font-mono">{item.pass}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-zinc-800 text-xs mt-8 font-mono">v1.0 — Staj Takip & Yönetim Sistemi</p>
      </div>
    </div>
  );
}

export default LoginPage;

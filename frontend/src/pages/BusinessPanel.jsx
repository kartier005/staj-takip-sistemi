import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import api from '../api';

function BusinessPanel() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [hasPageAccess, setHasPageAccess] = useState(false);
  const [crudPerms, setCrudPerms] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ad: '', sektor: '', sehir: '', calisan_sayisi: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const permStr = localStorage.getItem('permissions');
    if (!userStr) { navigate('/'); return; }
    const user = JSON.parse(userStr);
    setUserRole(user.role);

    if (user.role === 'Supervisor') {
      setHasPageAccess(true);
      setCrudPerms(['create', 'read', 'update', 'delete']);
      fetchData();
    } else {
      const perms = permStr ? JSON.parse(permStr) : {};
      const myPerms = perms[user.role] || { page_permissions: [], crud_permissions: [] };
      if (myPerms.page_permissions.includes('Isletme Profili')) {
        setHasPageAccess(true);
        setCrudPerms(myPerms.crud_permissions || []);
        if (myPerms.crud_permissions.includes('read')) fetchData();
        else setLoading(false);
      } else {
        setHasPageAccess(false);
        setLoading(false);
      }
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/crud/businesses');
      if (res.data.success) setData(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleOpenModal = (item = null) => {
    if (item) { setEditingId(item.id); setFormData(item.data); }
    else { setEditingId(null); setFormData({ ad: '', sektor: '', sehir: '', calisan_sayisi: '' }); }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await api.put(`/api/crud/businesses/${editingId}`, { data: formData });
      else await api.post('/api/crud/businesses', { data: formData });
      setIsModalOpen(false);
      fetchData();
    } catch (err) { console.error(err); alert('İşlem başarısız'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
      try { await api.delete(`/api/crud/businesses/${id}`); fetchData(); }
      catch (err) { console.error(err); alert('Silme başarısız'); }
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const columns = [
    { key: 'ad', label: 'İşletme Adı' },
    { key: 'sektor', label: 'Sektör' },
    { key: 'sehir', label: 'Şehir' },
    { key: 'calisan_sayisi', label: 'Çalışan Sayısı' }
  ];
  const fieldLabels = {
    ad: 'İşletme Adı',
    sektor: 'Sektör',
    sehir: 'Şehir',
    calisan_sayisi: 'Çalışan Sayısı'
  };

  const canCreate = crudPerms.includes('create');
  const canRead = crudPerms.includes('read');
  const canUpdate = crudPerms.includes('update');
  const canDelete = crudPerms.includes('delete');
  if (!hasPageAccess) {
    return (
      <div className="flex bg-black min-h-screen">
        <Sidebar currentUser={userRole} />
        <div className="ml-64 flex-1 flex flex-col">
          <Navbar title="İşletme Profili" />
          <div className="p-8 flex items-center justify-center flex-1">
            <div className="border border-red-500/30 text-red-400 p-8 text-center">
              <p className="font-mono text-lg mb-2">[ ERİŞİM ENGELLENDİ ]</p>
              <p className="text-sm text-zinc-500">Bu sayfayı görüntüleme yetkiniz yok.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-black min-h-screen">
      <Sidebar currentUser={userRole} />
      <div className="ml-64 flex-1 flex flex-col">
        <Navbar title="İşletme Profili" />
        <main className="p-8 flex-1">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm text-zinc-400 uppercase tracking-wider">Veri Tablosu</h2>
            </div>
            {canCreate && (
              <button onClick={() => handleOpenModal()} className="border border-zinc-700 text-zinc-300 hover:border-white hover:text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200">
                [+] Yeni Kayıt
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-zinc-600 p-8 text-center border border-zinc-900 font-mono text-sm">YÜKLENİYOR...</div>
          ) : !canRead ? (
            <div className="text-zinc-500 p-8 text-center border border-zinc-900">Read yetkisi eksik.</div>
          ) : (
            <DataTable columns={columns} data={data} onEdit={handleOpenModal} onDelete={handleDelete} canEdit={canUpdate} canDelete={canDelete} />
          )}

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'İşletmeyi Düzenle' : 'Yeni İşletme'}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {['ad', 'sektor', 'sehir', 'calisan_sayisi'].map(field => (
                <div key={field}>
                  <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-1.5">{fieldLabels[field]}</label>
                  <input
                    required
                    name={field}
                    type={field === 'calisan_sayisi' ? 'number' : 'text'}
                    value={formData[field]}
                    onChange={handleChange}
                    className="w-full bg-black border border-zinc-800 text-white p-2.5 text-sm focus:border-white outline-none transition-colors"
                  />
                </div>
              ))}
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 border border-zinc-700 text-zinc-400 py-2.5 text-xs font-bold uppercase tracking-wider hover:text-white hover:border-zinc-500 transition-colors">İptal</button>
                <button type="submit" className="flex-1 border border-white text-white py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-200">Kaydet</button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  );
}

export default BusinessPanel;

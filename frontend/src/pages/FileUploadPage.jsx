import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../api';

function FileUploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { navigate('/'); return; }
    setUserRole(JSON.parse(userStr).role);
  }, [navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Dosya yükleme hatası');
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!result || result.text_content === null || result.text_content === undefined) return;
    setAnalyzing(true);
    setError('');
    try {
      const res = await api.post('/api/ai/analyze', { content: result.text_content, filename: result.filename });
      localStorage.setItem('ai_html', res.data.html);
      navigate('/editor');
    } catch (err) {
      setError('AI analiz hatası.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="flex bg-black min-h-screen">
      <Sidebar currentUser={userRole} />
      <div className="ml-64 flex-1 flex flex-col">
        <Navbar title="Dosya Merkezi" />
        <main className="p-8 flex-1 max-w-3xl">
          <div className="border border-zinc-800 p-8 mb-8 fade-in">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Dosya Yükleme</h2>
            <p className="text-xs text-zinc-600 mb-6 font-mono">İzin verilen: .txt .png .jpg .jpeg .pdf .docx .xlsx</p>

            {error && (
              <div className="border border-red-500/30 bg-red-500/5 text-red-400 px-4 py-3 mb-6 text-sm">{error}</div>
            )}

            <div className="flex flex-col gap-4">
              <input
                type="file"
                onChange={handleFileChange}
                accept=".txt,.png,.jpg,.jpeg,.pdf,.docx,.xlsx"
                className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2.5 file:px-4 file:border file:border-zinc-700 file:text-zinc-400 file:bg-black file:text-xs file:font-bold file:uppercase file:tracking-wider hover:file:border-white hover:file:text-white file:transition-all file:cursor-pointer cursor-pointer"
              />
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="border border-white text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {uploading ? 'Yükleniyor...' : '[↑] Dosyayı Yükle'}
              </button>
            </div>
          </div>
          {result && (
            <div className="border border-zinc-800 p-8 fade-in">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Yükleme Başarılı</h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-zinc-900 p-4">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Dosya Adı</p>
                  <p className="text-sm text-white mt-1 font-mono">{result.filename}</p>
                </div>
                <div className="border border-zinc-900 p-4">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Tür</p>
                  <p className="text-sm text-white mt-1 font-mono">{result.file_type}</p>
                </div>
              </div>

              {result.text_content !== null && result.text_content !== undefined && result.text_content.length > 0 && (
                <div className="mb-6">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-widest mb-2">Önizleme</p>
                  <div className="bg-zinc-950 border border-zinc-900 p-4 text-zinc-400 text-xs max-h-40 overflow-y-auto font-mono">{result.text_content}</div>
                </div>
              )}

              {result.text_content !== null && result.text_content !== undefined ? (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full border border-white text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-30"
                >
                  {analyzing ? 'AI Analiz Ediyor...' : '[⚡] Yapay Zeka ile Analiz Et'}
                </button>
              ) : (
                <div className="text-zinc-600 text-xs text-center border border-zinc-900 py-3 font-mono">
                  Bu dosya türü AI analizine uygun değil (Sadece txt/docx)
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default FileUploadPage;

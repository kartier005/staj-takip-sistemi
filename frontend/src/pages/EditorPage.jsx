import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';

function EditorPage() {
  const [userRole, setUserRole] = useState('');
  const [manualHtml, setManualHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [editor, setEditor] = useState(null);
  const editorRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) { navigate('/'); return; }
    setUserRole(JSON.parse(userStr).role);
  }, [navigate]);

  useEffect(() => {
    if (!editorRef.current) return;
    const gjs = grapesjs.init({
      container: editorRef.current,
      height: '600px',
      width: 'auto',
      storageManager: false,
      panels: { defaults: [] },
    });
    setEditor(gjs);
    const aiHtml = localStorage.getItem('ai_html');
    if (aiHtml) gjs.setComponents(aiHtml);
    return () => gjs.destroy();
  }, []);

  const handleLoadManual = () => {
    if (editor && manualHtml) editor.setComponents(manualHtml);
  };

  const handleShowPreview = () => {
    if (editor) {
      const html = editor.getHtml();
      const css = editor.getCss();
      setPreviewHtml(`<style>${css}</style>${html}`);
      setShowPreview(true);
    }
  };

  return (
    <div className="flex bg-black min-h-screen">
      <Sidebar currentUser={userRole} />
      <div className="ml-64 flex-1 flex flex-col h-screen">
        <Navbar title="AI Editör — GrapesJS" />
        <main className="p-8 flex-1 flex flex-col overflow-hidden">
          <div className="border border-zinc-800 p-4 mb-6 flex gap-4 fade-in">
            <input
              type="text"
              value={manualHtml}
              onChange={(e) => setManualHtml(e.target.value)}
              placeholder="HTML yapıştırın: <h1>Merhaba</h1>"
              className="flex-1 bg-black border border-zinc-800 text-white p-2.5 text-sm font-mono focus:border-white outline-none transition-colors"
            />
            <button onClick={handleLoadManual} className="border border-zinc-700 text-zinc-400 hover:border-white hover:text-white px-4 text-xs font-bold uppercase tracking-wider transition-all duration-200">
              Yükle
            </button>
            <button onClick={handleShowPreview} className="border border-white text-white px-6 text-xs font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-all duration-200">
              Önizle
            </button>
          </div>
          <div className="flex-1 border border-zinc-800 overflow-hidden fade-in bg-white">
            <div ref={editorRef} className="h-full w-full"></div>
          </div>
        </main>
      </div>
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/90">
          <div className="bg-white w-full max-w-4xl h-full max-h-[80vh] flex flex-col border border-zinc-300">
            <div className="bg-zinc-100 border-b border-zinc-200 p-4 flex justify-between items-center">
              <h3 className="font-bold text-zinc-800 text-sm uppercase tracking-wider">HTML Önizleme</h3>
              <button onClick={() => setShowPreview(false)} className="text-zinc-500 hover:text-black text-sm font-mono">[x] Kapat</button>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }}></div>
            </div>
            <div className="bg-zinc-100 border-t border-zinc-200 p-4 text-xs font-mono text-zinc-600 max-h-40 overflow-y-auto whitespace-pre-wrap">{previewHtml}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorPage;

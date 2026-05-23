import React from 'react';

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      ></div>
      <div className="relative bg-black border border-zinc-700 w-full max-w-lg flex flex-col fade-in z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-white w-8 h-8 flex items-center justify-center transition-colors font-mono"
          >
            [×]
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;

import React from 'react';

function DataTable({ columns, data, onEdit, onDelete, canEdit, canDelete }) {
  return (
    <div className="border border-zinc-800 fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">#ID</th>
              {columns.map((col, idx) => (
                <th key={idx} className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{col.label}</th>
              ))}
              {(canEdit || canDelete) && (
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 text-right">İşlemler</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className="border-b border-zinc-900 hover:bg-zinc-950 transition-colors duration-150">
                  <td className="px-6 py-4 text-zinc-600 font-mono text-xs">{item.id}</td>
                  {columns.map((col, idx) => (
                    <td key={idx} className="px-6 py-4 text-zinc-300">
                      {item.data ? item.data[col.key] : '-'}
                    </td>
                  ))}
                  {(canEdit || canDelete) && (
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {canEdit && (
                        <button
                          onClick={() => onEdit(item)}
                          className="px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:border-white hover:text-white text-xs font-medium transition-all duration-200 uppercase tracking-wider"
                        >
                          Düzenle
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => onDelete(item.id)}
                          className="px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:border-red-500 hover:text-red-500 text-xs font-medium transition-all duration-200 uppercase tracking-wider"
                        >
                          Sil
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-16 text-center">
                  <p className="text-zinc-600 text-sm">Henüz veri bulunmuyor</p>
                  <p className="text-zinc-800 text-xs mt-1 font-mono">[ EMPTY ]</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;

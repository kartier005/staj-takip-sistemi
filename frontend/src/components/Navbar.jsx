import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Navbar({ title }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="bg-black border-b border-zinc-800 px-8 py-5 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-xs text-zinc-600 mt-0.5 uppercase tracking-wider">Dashboard</p>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-white">{user ? user.username : 'Misafir'}</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{user ? user.role : '-'}</p>
        </div>
        <div className="w-9 h-9 border border-zinc-700 flex items-center justify-center text-white font-bold text-sm bg-zinc-950">
          {user ? user.username.charAt(0).toUpperCase() : '?'}
        </div>
      </div>
    </div>
  );
}

export default Navbar;

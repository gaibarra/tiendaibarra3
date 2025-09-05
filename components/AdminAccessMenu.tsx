import React, { useState, useEffect } from 'react';
import { UserCircleIcon } from './Icons';

interface Props {
  userEmail: string | null;
  onLogin: () => void;
  onLogout: () => void;
  onOpenPanel: () => void;
  compact?: boolean;
}

const AdminAccessMenu: React.FC<Props> = ({ userEmail, onLogin, onLogout, onOpenPanel, compact = false }) => {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(o => !o);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById('admin-menu-wrapper');
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const baseBtn = 'inline-flex items-center gap-1 text-base font-medium text-gray-600 hover:text-[var(--color-primary)] focus:outline-none';
  const iconBtn = 'p-2 rounded hover:bg-gray-100 focus:ring-2 focus:ring-[var(--color-primary)]';

  return (
    <div className="relative" id="admin-menu-wrapper">
      <button
        onClick={toggle}
        className={compact ? iconBtn : baseBtn}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={userEmail ? 'admin menu' : 'login menu'}
        type="button"
      >
        <UserCircleIcon className={compact ? 'h-6 w-6' : 'h-6 w-6 mr-1'} />
        {!compact && (userEmail ? 'Admin' : 'Login')}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-50 py-1 text-sm" role="menu">
          {userEmail ? (
            <>
              <div className="px-3 py-2 text-gray-500 text-xs border-b break-all" data-testid="user-email">{userEmail}</div>
              <button onClick={() => { setOpen(false); onOpenPanel(); }} className="w-full text-left px-3 py-2 hover:bg-gray-100" role="menuitem">Ir al Panel</button>
              <button onClick={() => { setOpen(false); onLogout(); }} className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600" role="menuitem">Cerrar Sesión</button>
            </>
          ) : (
            <button onClick={() => { setOpen(false); onLogin(); }} className="w-full text-left px-3 py-2 hover:bg-gray-100" role="menuitem">Iniciar Sesión</button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAccessMenu;
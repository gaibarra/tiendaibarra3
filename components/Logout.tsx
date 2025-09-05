import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Logout: React.FC = () => {
  const { signOut } = useAuth();
  useEffect(() => {
    (async () => {
      await signOut();
      window.location.replace('/');
    })();
  }, [signOut]);
  return (
    <div className="p-8 text-center text-gray-600">Cerrando sesión...</div>
  );
};

export default Logout;

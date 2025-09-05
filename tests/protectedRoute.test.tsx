/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';

// Mock AuthContext to simulate loading, unauthenticated and authenticated states
const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

function AppUnderTest() {
  return (
    <Routes>
      <Route path="/login" element={<div>LOGIN PAGE</div>} />
      <Route path="/admin" element={<ProtectedRoute><div>ADMIN OK</div></ProtectedRoute>} />
    </Routes>
  );
}

describe('ProtectedRoute', () => {
  it('shows loading state', () => {
    mockUseAuth.mockReturnValue({ session: null, user: null, loading: true });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppUnderTest />
      </MemoryRouter>
    );
    expect(screen.getByText(/Verificando sesión/i)).toBeDefined();
  });

  it('redirects to login when no session', () => {
    mockUseAuth.mockReturnValue({ session: null, user: null, loading: false });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppUnderTest />
      </MemoryRouter>
    );
    // Should land on login page after redirect
    expect(screen.getByText(/LOGIN PAGE/i)).toBeDefined();
  });

  it('renders children when session exists', () => {
    mockUseAuth.mockReturnValue({ session: { id: 's1' }, user: { id: 'u1', email: 'a@b.c' }, loading: false });
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AppUnderTest />
      </MemoryRouter>
    );
    expect(screen.getByText(/ADMIN OK/i)).toBeDefined();
  });
});

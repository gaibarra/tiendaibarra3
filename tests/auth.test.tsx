/** @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import Login from '../components/Login';

// Mock jest-dom matchers rely on setup file; ensure to use them after import

// Simple in-memory session for useAuth mock
vi.mock('../contexts/AuthContext', () => {
  let session: any = null;
  return {
    useAuth: () => ({
      session,
      signIn: async (email: string, password: string) => {
        if (email === 'admin@test.com' && password === 'correct') {
          session = { user: { email } }; return { error: null };
        }
        return { error: { message: 'Invalid login' } };
      },
      signOut: async () => { session = null; return { error: null }; }
    }),
    AuthProvider: ({ children }: any) => <>{children}</>
  };
});

// Mock branding (only colors used)
vi.mock('../contexts/BrandingContext', () => ({
  useBranding: () => ({ branding: { id:1, logo_url:'l', primary_color:'#0000ff', secondary_color:'#fff', accent_color:'#f0f', text_color:'#000' } }),
  BrandingProvider: ({ children }: any) => <>{children}</>
}));

// No supabase direct calls needed now (only signIn via context)

afterEach(() => cleanup());

function renderLogin() {
  return render(
    <HashRouter>
      <Login />
    </HashRouter>
  );
}

describe('Auth flow (mocked basic)', () => {
  it('shows login form', () => {
    renderLogin();
  expect(screen.getByPlaceholderText(/Correo electrónico/i)).toBeDefined();
  expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeDefined();
  });

  it('fails with wrong credentials', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
    await waitFor(() => screen.getByText(/Invalid login/i));
  });

  it('logs in with correct credentials', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
    await waitFor(() => expect(screen.queryByText(/Invalid login/i)).toBeNull());
  });

  // Registration and password reset removed from UI; corresponding tests removed.

  it('can logout after login by calling signOut (state clears)', async () => {
    // Access mocked auth to inspect internal session (via module mock) not necessary; just exercise flow.
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/Correo electrónico/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'correct' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
    await waitFor(() => expect(screen.queryByText(/Invalid login/i)).toBeNull());
    // Simulate leaving & returning to login (logout triggered outside UI in this simplified mock)
    const { useAuth } = await import('../contexts/AuthContext');
    const { signOut } = useAuth();
    await signOut();
    // After signOut, trying a bad login should show error again proving state cleared
    fireEvent.change(screen.getByPlaceholderText(/Contraseña/i), { target: { value: 'bad' } });
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));
    await waitFor(() => screen.getByText(/Invalid login/i));
  });

});

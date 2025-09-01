import React, { useLayoutEffect } from 'react';
import { useBranding } from '../contexts/BrandingContext';

const ThemeInjector: React.FC = () => {
  const { branding } = useBranding();
  useLayoutEffect(() => {
    const root = document.documentElement;
  root.style.setProperty('--Color-primary', branding.primary_color);
  root.style.setProperty('--color-primary', branding.primary_color);
  root.style.setProperty('--color-secondary', branding.secondary_color);
  root.style.setProperty('--color-accent', branding.accent_color);
  root.style.setProperty('--color-text', branding.text_color);
  }, [branding]);

  return null;
};

export default ThemeInjector;

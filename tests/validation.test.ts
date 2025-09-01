import { describe, it, expect } from 'vitest';
import { validateProductData } from '../utils/validation';

const makeProduct = (overrides = {}) => ({
  id: 'p1',
  name: 'P',
  description: '',
  image_url: '',
  variants: [{ id: 'v1', name: 'Small', price: 10, stock: 5 }],
  ...overrides,
});

describe('validateProductData', () => {
  it('valid product passes', () => {
    const p = makeProduct({ name: 'Shirt', variants: [{ id: 'v1', name: 'Default', price: 1, stock: 1 }] });
    const res = validateProductData(p as any);
    expect(res.valid).toBe(true);
  });

  it('invalid when no product name', () => {
    const p = makeProduct({ name: '' });
    const res = validateProductData(p as any);
    expect(res.valid).toBe(false);
    expect(res.errors.name).toBeTruthy();
  });

  it('invalid when variant price negative', () => {
    const p = makeProduct({ variants: [{ id: 'v1', name: 'X', price: -5, stock: 1 }] });
    const res = validateProductData(p as any);
    expect(res.valid).toBe(false);
    expect(res.errors.variants[0].price).toBeTruthy();
  });
});

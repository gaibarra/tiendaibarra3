import { Product } from '../types';

export type VariantErrors = { name?: string; price?: string; stock?: string };
export type ProductValidationResult = {
  valid: boolean;
  errors: {
    name?: string;
    description?: string;
    variants: Record<number, VariantErrors>;
  };
};

export function validateProductData(p: Product): ProductValidationResult {
  const errors: ProductValidationResult['errors'] = { variants: {} };

  if (!p.name || !p.name.trim()) errors.name = 'El nombre del producto es obligatorio.';
  else if (p.name.length > 100) errors.name = 'El nombre no puede exceder 100 caracteres.';

  if (p.description && p.description.length > 500) errors.description = 'La descripción no puede exceder 500 caracteres.';

  p.variants.forEach((v, i) => {
    const ve: VariantErrors = {};
    if (!v.name || !v.name.toString().trim()) ve.name = 'Nombre de la presentación requerido.';
    // price must be a number and >= 0
    const price = (v as any).price;
    if (typeof price !== 'number' || Number.isNaN(price)) ve.price = 'Precio inválido.';
    else if (price < 0) ve.price = 'Precio debe ser >= 0.';
    // stock must be integer >=0
    const stock = (v as any).stock;
    if (typeof stock !== 'number' || Number.isNaN(stock) || !Number.isInteger(stock)) ve.stock = 'Stock debe ser un entero válido.';
    else if (stock < 0) ve.stock = 'Stock debe ser >= 0.';

    if (Object.keys(ve).length > 0) errors.variants[i] = ve;
  });

  const valid = !errors.name && !errors.description && Object.keys(errors.variants).length === 0;
  return { valid, errors };
}

export default validateProductData;

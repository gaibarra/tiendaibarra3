import React, { useState, useRef } from 'react';
import { useShop } from '../contexts/ShopContext';
import { Product, ProductVariant } from '../types';
import validateProductData from '../utils/validation';
import { PlusIcon, TrashIcon } from './Icons';
import ConfirmModal from './ConfirmModal';
import { useBranding } from '../contexts/BrandingContext';
import { getContrastColor } from '../utils/colors';

const emptyVariant: Omit<ProductVariant, 'id' | 'product_id'> = { name: '', price: 0, stock: 0 };
const emptyProduct: Omit<Product, 'created_at'> = { id: '', name: '', description: '', image_url: '', variants: [] };

const ProductAdmin: React.FC = () => {
    const { products, saveProduct, deleteProduct, loading } = useShop();
    const { branding } = useBranding();
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);

    const primaryButtonTextColor = getContrastColor(branding.primary_color);

    const handleNewProduct = () => {
        const newProduct = { ...emptyProduct, id: `new_${Date.now()}`, variants: [{ ...emptyVariant, id: `var_${Date.now()}` } as ProductVariant] };
        setEditingProduct(newProduct as Product);
        setImageFile(null);
        setImagePreviewUrl(null);
    };
    
    const handleEditProduct = (product: Product) => {
        setEditingProduct(JSON.parse(JSON.stringify(product)));
        setImageFile(null);
        setImagePreviewUrl(null);
    };

    const firstErrorRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    const handleSave = async () => {
        if (!editingProduct) return;
        const { valid, errors } = validateProductData(editingProduct);
        if (!valid) {
            // focus first field with error: product name -> variant name -> variant price -> variant stock
            if (errors.name) {
                const el = document.querySelector('input[name="product_name"]') as HTMLInputElement | null;
                el?.focus();
            } else {
                // find variant errors
                for (const idxStr of Object.keys(errors.variants)) {
                    const idx = Number(idxStr);
                    const nameEl = document.querySelector(`input[name="name"][data-idx="${idx}"]`) as HTMLInputElement | null;
                    if (nameEl) { nameEl.focus(); break; }
                    const priceEl = document.querySelector(`input[name="price"][data-idx="${idx}"]`) as HTMLInputElement | null;
                    if (priceEl) { priceEl.focus(); break; }
                    const stockEl = document.querySelector(`input[name="stock"][data-idx="${idx}"]`) as HTMLInputElement | null;
                    if (stockEl) { stockEl.focus(); break; }
                }
            }
            // show a summary alert-like area
            alert('El formulario contiene errores. Revisa los campos indicados.');
            return;
        }

        setIsSaving(true);
        try {
            await saveProduct(editingProduct, imageFile);
            setEditingProduct(null);
            setImageFile(null);
            setImagePreviewUrl(null);
        } catch (error) {
            console.error(error);
            alert('Error al guardar el producto.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteRequest = (productId: string) => {
        setProductToDelete(productId);
    };

    const executeDelete = async () => {
        if (!productToDelete) return;
        try {
            await deleteProduct(productToDelete);
        } catch (error) {
            console.error(error);
            alert('Error al eliminar el producto.');
        } finally {
            setProductToDelete(null);
        }
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!editingProduct) return;
        const { name, value } = e.target as HTMLInputElement | HTMLTextAreaElement;
        // Use functional update to avoid stale closures and ensure React treats the input as controlled
        setEditingProduct(prev => ({ ...(prev as Product), [name]: value }));
    };

    // Use explicit handlers for top-level product fields to avoid collisions with variant inputs which also use name="name"
    const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEditingProduct(prev => ({ ...(prev as Product), name: value }));
    };

    const handleProductDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setEditingProduct(prev => ({ ...(prev as Product), description: value }));
    };
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleVariantChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingProduct) return;
        const newVariants = [...editingProduct.variants];
        const { name, value } = e.target;
        // For numeric fields allow empty -> NaN so validation can catch missing values
        if (name === 'price' || name === 'stock') {
            (newVariants[index] as any)[name] = value === '' ? NaN : parseFloat(value);
        } else {
            (newVariants[index] as any)[name] = value;
        }
        setEditingProduct({ ...editingProduct, variants: newVariants });
    };

    const validateProduct = (p: Product) => {
        const errors: { name?: string; variants: Record<number, { name?: string; price?: string }> } = { variants: {} };
        if (!p.name || !p.name.trim()) errors.name = 'El nombre del producto es obligatorio.';

        p.variants.forEach((v, i) => {
            const ve: { name?: string; price?: string } = {};
            if (!v.name || !v.name.toString().trim()) ve.name = 'Nombre de la presentación requerido.';
            if (typeof (v as any).price !== 'number' || Number.isNaN((v as any).price)) ve.price = 'Precio inválido.';
            if (Object.keys(ve).length > 0) errors.variants[i] = ve;
        });

        const valid = !errors.name && Object.keys(errors.variants).length === 0;
        return { valid, errors };
    };

    const addVariant = () => {
        if (!editingProduct) return;
        const newVariant = { ...emptyVariant, id: `var_${Date.now()}` } as ProductVariant;
        setEditingProduct({ ...editingProduct, variants: [...editingProduct.variants, newVariant] });
    };

    const removeVariant = (index: number) => {
        if (!editingProduct || editingProduct.variants.length <= 1) return;
        const newVariants = editingProduct.variants.filter((_, i) => i !== index);
        setEditingProduct({ ...editingProduct, variants: newVariants });
    };

    if (editingProduct) {
        const { valid, errors } = validateProduct(editingProduct);
        return (
            <div>
                <h3 className="text-xl font-semibold mb-4 text-[var(--color-text)]">{editingProduct.id.startsWith('new_') ? 'Nuevo Producto' : 'Editar Producto'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre</label>
                        <input autoFocus type="text" name="product_name" value={editingProduct.name ?? ''} onChange={(e) => { console.debug('name change', e.target.value); handleProductNameChange(e); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm bg-white text-gray-900" />
                        {errors.name ? <p className="text-xs text-red-600 mt-1">{errors.name}</p> : null}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea name="product_description" value={editingProduct.description ?? ''} onChange={(e) => { console.debug('description change', e.target.value); handleProductDescriptionChange(e); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm bg-white text-gray-900" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Imagen del Producto</label>
                        <div className="mt-2 flex items-center gap-4">
                            <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border">
                                {imagePreviewUrl || editingProduct.image_url ? (
                                    <img
                                        src={imagePreviewUrl || editingProduct.image_url || undefined}
                                        alt="Vista previa"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-xs text-gray-400">Sin imagen</div>
                                )}
                            </div>
                            <label htmlFor="image-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)]">
                                <span>Cambiar</span>
                                <input id="image-upload" name="image_url" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Sube una imagen para el producto (PNG, JPG, WEBP).</p>
                    </div>
                    
                    <div className="pt-4 border-t">
                        <h4 className="font-medium text-lg">Presentaciones</h4>
                        <p className="text-sm text-gray-500 mb-4">Define los diferentes tamaños o tipos, con su precio y stock.</p>
                        <div className="space-y-4">
                            {editingProduct.variants.map((variant, index) => (
                                <div key={variant.id || index} className="grid grid-cols-1 md:grid-cols-[1fr,120px,120px,auto] gap-4 items-end p-4 border rounded-md bg-gray-50">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Nombre (ej. 250g)</label>
                                        <input data-idx={index} type="text" name="name" placeholder="Nombre" value={variant.name} onChange={(e) => handleVariantChange(index, e)} className="mt-1 w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm" />
                                        {errors.variants[index]?.name ? <p className="text-xs text-red-600 mt-1">{errors.variants[index].name}</p> : null}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Precio ($)</label>
                                        <input data-idx={index} type="number" name="price" placeholder="0.00" value={variant.price as any} onChange={(e) => handleVariantChange(index, e)} className="mt-1 w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm" />
                                        {errors.variants[index]?.price ? <p className="text-xs text-red-600 mt-1">{errors.variants[index].price}</p> : null}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600">Stock</label>
                                        <input data-idx={index} type="number" name="stock" placeholder="0" value={variant.stock} onChange={(e) => handleVariantChange(index, e)} className="mt-1 w-full bg-white text-gray-900 rounded-md border-gray-300 shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] sm:text-sm" />
                                    </div>
                                    <button onClick={() => removeVariant(index)} disabled={editingProduct.variants.length <= 1} className="text-red-500 hover:text-red-700 disabled:text-gray-300 p-2 rounded-md transition-colors self-center mb-1">
                                        <TrashIcon />
                                    </button>
                                </div>
                            ))}
                        </div>
                         <button onClick={addVariant} className="mt-4 flex items-center text-sm font-medium text-[var(--color-primary)] hover:opacity-80"><PlusIcon /> Agregar Presentación</button>
                    </div>
                </div>
                <div className="mt-6 flex gap-4">
                    <button onClick={handleSave} disabled={isSaving || !valid} className="px-4 py-2 bg-[var(--color-primary)] rounded-md disabled:bg-gray-400" style={{ color: primaryButtonTextColor }}>{isSaving ? 'Guardando...' : 'Guardar'}</button>
                    <button onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                </div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Inventario de Productos</h2>
                <button onClick={handleNewProduct} className="flex items-center px-4 py-2 bg-[var(--color-primary)] rounded-md" style={{ color: primaryButtonTextColor }}><PlusIcon/> Nuevo Producto</button>
            </div>
            {loading ? <p>Cargando inventario...</p> :
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presentaciones</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[var(--color-secondary)] divide-y divide-gray-200">
                        {products.map(product => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            {product.image_url ? (
                                                <img className="h-10 w-10 rounded-full object-cover" src={product.image_url} alt={product.name} />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-400">No Img</div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-[var(--color-text)]">{product.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {product.variants.map(v => (
                                        <span key={v.id} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-1">
                                            {v.name} (${v.price}) - Stock: {v.stock}
                                        </span>
                                    ))}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleEditProduct(product)} className="text-[var(--color-primary)] hover:opacity-80">Editar</button>
                                    <button onClick={() => handleDeleteRequest(product.id)} className="ml-4 text-red-600 hover:text-red-900">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            }
             <ConfirmModal
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={executeDelete}
                title="Eliminar Producto"
                message={
                    <>
                        ¿Estás seguro de que quieres eliminar este producto?
                        <br />
                        <span className="font-bold text-red-600">Esta acción no se puede deshacer.</span>
                    </>
                }
                confirmButtonText="Eliminar"
                confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            />
        </div>
    );
};

export default ProductAdmin;
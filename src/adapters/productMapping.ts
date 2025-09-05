// Adaptador desde tu tabla "products" de Supabase a lo que usa QuickSearch.

export type DbProduct = {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  // Si después agregas más campos, no pasa nada.
};

// Este es el shape que consume QuickSearch
export type SearchProduct = {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  // Opcionalmente puedes añadir price/variants si luego los tienes
  price?: number;
  variants?: Array<{ id: string; name?: string; price?: number; capacity?: string }>;
};

export function mapDbProductToSearch(p: DbProduct): SearchProduct {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    imageUrl: p.image_url ?? undefined,
    // price/variants se resolverán al añadir al carrito si existen en otra tabla
  };
}

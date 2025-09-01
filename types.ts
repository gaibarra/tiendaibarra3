// Este archivo define los tipos de TypeScript para la aplicación, incluyendo una
// representación del esquema de la base de datos de Supabase. En un proyecto real, la
// interfaz de la base de datos se generaría automáticamente con el CLI de Supabase.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      branding: {
        Row: {
          id: number;
          logo_url: string;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          text_color: string;
        };
        Insert: {
          logo_url: string;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          text_color: string;
        };
        Update: {
          logo_url?: string;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          text_color?: string;
        };
        Relationships: [];
      };
      company_info: {
        Row: {
          id: number;
          name: string;
          address: string;
          phone: string;
          email: string;
        };
        Insert: {
          name: string;
          address: string;
          phone: string;
          email: string;
        };
        Update: {
          name?: string;
          address?: string;
          phone?: string;
          email?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          image_url: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          image_url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          price: number;
          stock: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          price: number;
          stock: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          price?: number;
          stock?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          created_at: string;
          total: number;
          status: "pending" | "confirmed";
        };
        Insert: {
          id?: string;
          total: number;
          status?: "pending" | "confirmed";
        };
        Update: {
          status?: "pending" | "confirmed";
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: number;
          order_id: string;
          product_id: string;
          variant_id: string;
          product_name: string;
          variant_name: string;
          quantity: number;
          price: number;
        };
        Insert: {
          order_id: string;
          product_id: string;
          variant_id: string;
          product_name: string;
          variant_name: string;
          quantity: number;
          price: number;
        };
        Update: {
          id?: number;
          order_id?: string;
          product_id?: string;
          variant_id?: string;
          product_name?: string;
          variant_name?: string;
          quantity?: number;
          price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_: string]: never };
    Functions: {
      decrease_stock: {
        Args: {
          p_variant_id: string;
          p_quantity: number;
        };
        Returns: void;
      };
    };
    Enums: { [_: string]: never };
    CompositeTypes: { [_: string]: never };
  }
}

// Tipos específicos de la aplicación, extendiendo o componiendo los tipos de Supabase
export type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
export type Product = Database['public']['Tables']['products']['Row'] & {
  variants: ProductVariant[];
};
export type CompanyInfo = Database['public']['Tables']['company_info']['Row'];
export type Branding = Database['public']['Tables']['branding']['Row'];
export type OrderItem = Database['public']['Tables']['order_items']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'] & {
  order_items: OrderItem[];
};

// Tipo exclusivo del lado del cliente para el carrito de compras
export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  name: string;
  variantName: string;
  price: number;
  imageUrl: string;
  description: string;
}
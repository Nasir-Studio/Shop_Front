export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
  role: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  sale_price: number | null;
  stock: number;
  image_url: string;
  category_id: number | null;
  category_name: string | null;
  condition: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  product_image: string;
  price: number;
  sale_price: number | null;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  total: number;
  status: string;
  shipping_name: string;
  shipping_phone: string;
  shipping_address: string;
  note: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderListItem {
  id: number;
  total: number;
  status: string;
  item_count: number;
  created_at: string;
}

export interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface AdminStats {
  total_products: number;
  total_categories: number;
  total_orders: number;
  total_users: number;
  total_revenue: number;
  pending_orders: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

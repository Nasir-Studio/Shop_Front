import type {
  User, Product, Category, Cart, Order, OrderListItem, PaginatedProducts, AdminStats,
} from '../types/index';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('shop_token', token);
    else localStorage.removeItem('shop_token');
  }

  getToken(): string | null {
    if (!this.token) this.token = localStorage.getItem('shop_token');
    return this.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async register(email: string, password: string, name: string) {
    const res = await this.request<{ access_token: string; user: User }>(
      '/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name }) }
    );
    this.setToken(res.access_token);
    return res;
  }

  async login(email: string, password: string) {
    const res = await this.request<{ access_token: string; user: User }>(
      '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    this.setToken(res.access_token);
    return res;
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  async updateProfile(data: { name?: string; phone?: string; address?: string }): Promise<User> {
    return this.request<User>('/api/auth/me', { method: 'PUT', body: JSON.stringify(data) });
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('shop_user');
  }

  async getProducts(params: { page?: number; category?: string; search?: string; sort?: string } = {}): Promise<PaginatedProducts> {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.category) qs.set('category', params.category);
    if (params.search) qs.set('search', params.search);
    if (params.sort) qs.set('sort', params.sort);
    return this.request<PaginatedProducts>(`/api/products?${qs}`);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return this.request<Product[]>('/api/products/featured');
  }

  async getProduct(slug: string): Promise<Product> {
    return this.request<Product>(`/api/products/${slug}`);
  }

  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/categories');
  }

  async getCategory(slug: string): Promise<{ category: Category; products: Product[] }> {
    return this.request(`/api/categories/${slug}`);
  }

  async getCart(): Promise<Cart> {
    return this.request<Cart>('/api/cart');
  }

  async addToCart(productId: number, quantity: number = 1): Promise<Cart> {
    return this.request<Cart>('/api/cart', {
      method: 'POST', body: JSON.stringify({ product_id: productId, quantity }),
    });
  }

  async updateCartItem(itemId: number, quantity: number): Promise<Cart> {
    return this.request<Cart>(`/api/cart/${itemId}`, {
      method: 'PUT', body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(itemId: number): Promise<Cart> {
    return this.request<Cart>(`/api/cart/${itemId}`, { method: 'DELETE' });
  }

  async clearCart(): Promise<Cart> {
    return this.request<Cart>('/api/cart', { method: 'DELETE' });
  }

  async createOrder(data: {
    shipping_name: string; shipping_phone: string; shipping_address: string; note?: string;
  }): Promise<Order> {
    return this.request<Order>('/api/orders', {
      method: 'POST', body: JSON.stringify(data),
    });
  }

  async getOrders(): Promise<OrderListItem[]> {
    return this.request<OrderListItem[]>('/api/orders');
  }

  async getOrder(id: number): Promise<Order> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  async getAdminStats(): Promise<AdminStats> {
    return this.request<AdminStats>('/api/admin/stats');
  }

  async getAdminProducts(): Promise<Product[]> {
    return this.request<Product[]>('/api/admin/products');
  }

  async adminCreateProduct(data: any): Promise<Product> {
    return this.request<Product>('/api/admin/products', {
      method: 'POST', body: JSON.stringify(data),
    });
  }

  async adminUpdateProduct(id: number, data: any): Promise<Product> {
    return this.request<Product>(`/api/admin/products/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
  }

  async adminDeleteProduct(id: number) {
    return this.request(`/api/admin/products/${id}`, { method: 'DELETE' });
  }

  async getAdminCategories(): Promise<Category[]> {
    return this.request<Category[]>('/api/admin/categories');
  }

  async adminCreateCategory(data: any): Promise<Category> {
    return this.request<Category>('/api/admin/categories', {
      method: 'POST', body: JSON.stringify(data),
    });
  }

  async adminUpdateCategory(id: number, data: any): Promise<Category> {
    return this.request<Category>(`/api/admin/categories/${id}`, {
      method: 'PUT', body: JSON.stringify(data),
    });
  }

  async adminDeleteCategory(id: number) {
    return this.request(`/api/admin/categories/${id}`, { method: 'DELETE' });
  }

  async getAdminOrders(): Promise<any[]> {
    return this.request<any[]>('/api/admin/orders');
  }

  async adminUpdateOrderStatus(id: number, status: string) {
    return this.request(`/api/admin/orders/${id}/status`, {
      method: 'PUT', body: JSON.stringify({ status }),
    });
  }

  async getAdminUsers(): Promise<User[]> {
    return this.request<User[]>('/api/admin/users');
  }

  async adminUploadProductImage(productId: number, file: File): Promise<{ image_url: string }> {
    const token = this.getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/admin/products/${productId}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }
}

export const api = new ApiClient();

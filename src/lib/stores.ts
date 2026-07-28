import type { User, CartItem } from '../types/index';

// ── Client-side stores (using localStorage for persistence) ──────

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('shop_user');
  return raw ? JSON.parse(raw) : null;
}

export function setUser(user: User | null) {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem('shop_user', JSON.stringify(user));
  else localStorage.removeItem('shop_user');
}

export function getCartCount(): number {
  if (typeof window === 'undefined') return 0;
  return parseInt(localStorage.getItem('shop_cart_count') || '0', 10);
}

export function setCartCount(count: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('shop_cart_count', String(count));
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'admin';
}

export function isLoggedIn(): boolean {
  return !!getUser();
}

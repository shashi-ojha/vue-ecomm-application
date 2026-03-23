export interface Product {
  id: number
  title: string
  price: number
  description: string
  category: string
  image: string
  rating: {
    rate: number
    count: number
  }
}


let productCache: Product[] | null = null;
let categoryCache: string[] | null = null;

const BASE_URL = 'https://fakestoreapi.com'

export async function fetchProducts(): Promise<Product[]> {
  if (productCache) return productCache;
  const res = await fetch(`${BASE_URL}/products`)
  if (!res.ok) throw new Error('Failed to load products')
  const json = await res.json();
  productCache = json;
  return json

}

export async function fetchCategories(): Promise<string[]> {
  if (categoryCache) return categoryCache;
  const res = await fetch(`${BASE_URL}/products/categories`)
  if (!res.ok) throw new Error('Failed to load categories')
  const json = await res.json();
  categoryCache = json;
  return json
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${id}`)
  if (!res.ok) throw new Error('Product not found')
  return res.json()
}
export type Product = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  images: string[];
  category: {
    _id: string;
    name: string;
  };
  allowedVariants: string[];
};


let productCache: Product[] | null = null;
let categoryCache: { _id: string; name: string; }[] | null = null;

const BASE_URL = 'http://localhost:5000/api'


export async function fetchProducts(params: {
  page?: number;
  limit?: number;
  sort?: string;
  category?: string;
  brand?: string;
  search?: string;
}): Promise<Product[]> {

  const query = new URLSearchParams(params as any).toString();
  const res = await fetch(`${BASE_URL}/products?${query}`);
  const data = await res.json();

  if (!data.success || !Array.isArray(data.products)) {
    throw new Error("Failed to load products");
  }

  return data.products;
}

export async function fetchProductById(id: number): Promise<Product> {
  const res = await fetch(`${BASE_URL}/products/${id}`);
  const json = await res.json();

  if (!json.success) throw new Error("Product not found");
  return json.product;
}

export async function fetchCategories(): Promise<{ _id: string; name: string }[]> {
  if (categoryCache) return categoryCache;

  const res = await fetch(`${BASE_URL}/categories`);
  const json = await res.json();

  if (!json.success || !Array.isArray(json.categories)) {
    throw new Error("Invalid categories response");
  }

  categoryCache = json.categories.map((c: any) => ({
    _id: c._id,
    name: c.name
  }));

  return categoryCache!;
}
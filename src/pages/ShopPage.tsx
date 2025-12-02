import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';
import { getPrimaryImage } from '../utils/productUtils';

const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden group block"
    >
      <div className="overflow-hidden">
        <img
          src={getPrimaryImage(product) || 'https://placehold.co/400x500/1e293b/94a3b8?text=Termék'}
          alt={product.name}
          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold truncate text-white">{product.name}</h3>
        <p className="text-slate-400 text-sm mb-2">{product.category} - {product.gender}</p>
        <p className="text-xl font-bold text-white">{product.price.toLocaleString()} Ft</p>
      </div>
    </Link>
  );
};

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  useEffect(() => {
    let isMounted = true; // Flag a komponens mount állapotának nyomon követésére

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (isMounted) { // Csak akkor frissítjük az állapotot, ha a komponens még mounted
          setProducts(data || []);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Hiba a termékek betöltésekor:", err.message);
          setError(err.message);
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false; // Cleanup függvény a mount állapot visszavonásához
    };
  }, []);

  // Helper function to normalize text (remove accents, lowercase)
  const normalizeText = (text: string) => {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;

    const normalizedQuery = normalizeText(searchQuery);
    const normalizedName = normalizeText(product.name);
    const normalizedDescription = normalizeText(product.description || '');
    const normalizedCategory = normalizeText(product.category || '');

    return (
      normalizedName.includes(normalizedQuery) ||
      normalizedDescription.includes(normalizedQuery) ||
      normalizedCategory.includes(normalizedQuery)
    );
  });

  if (loading) return <div className="text-center p-8 text-white">Termékek betöltése...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Hiba: {error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">
        {searchQuery ? `Keresés: "${searchQuery}"` : 'Összes Termék'}
      </h1>

      {filteredProducts.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <p className="text-xl">Nincs találat a keresési feltételekre.</p>
          <button
            onClick={() => window.location.href = '/shop'}
            className="mt-4 text-indigo-400 hover:text-indigo-300 underline"
          >
            Összes termék megtekintése
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
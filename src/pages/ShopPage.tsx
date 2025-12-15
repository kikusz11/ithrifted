import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link, useSearchParams } from 'react-router-dom';
import { getPrimaryImage } from '../utils/productUtils';

const ProductCard = ({ product }: { product: any }) => {
  const isSoldOut = product.stock <= 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden group block relative"
    >
      <div className="overflow-hidden relative">
        <img
          src={getPrimaryImage(product) || 'https://placehold.co/400x500/1e293b/94a3b8?text=Termék'}
          alt={product.name}
          className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300"
          style={{ filter: isSoldOut ? 'grayscale(100%)' : 'none' }}
        />
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <span className="text-white font-bold text-lg transform -rotate-45 border-4 border-white px-4 py-1">
              ELFOGYOTT
            </span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold truncate text-white">{product.name}</h3>
        <p className="text-slate-400 text-sm mb-2">{product.category} - {product.gender}</p>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            {product.sale_price && product.sale_price < product.price ? (
              <>
                <p className="text-xl font-bold text-red-400">{product.sale_price.toLocaleString()} Ft</p>
                <p className="text-sm text-gray-400 line-through">{product.price.toLocaleString()} Ft</p>
              </>
            ) : (
              <p className="text-xl font-bold text-white">{product.price.toLocaleString()} Ft</p>
            )}
          </div>
          {isSoldOut && (
            <span className="text-red-500 font-bold text-sm">ELFOGYOTT</span>
          )}
        </div>
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
  const genderFilter = searchParams.get('gender');
  const categoryFilter = searchParams.get('category');

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

  // Filter products based on search query and filters
  const filteredProducts = products.filter(product => {
    // 1. Gender Filter
    const standardGenders = ['Férfi', 'Női', 'Unisex', 'male', 'female', 'unisex'];
    if (genderFilter && standardGenders.includes(genderFilter)) {
      const gFilter = genderFilter.toLowerCase();
      const pGender = (product.gender || '').toLowerCase();

      // Normalize gender matching (handle Hungarian/English and casing)
      const isMale = (g: string) => ['male', 'férfi', 'ferfi'].includes(g);
      const isFemale = (g: string) => ['female', 'női', 'noi'].includes(g);
      const isUnisex = (g: string) => ['unisex'].includes(g);

      if (isMale(gFilter) && !isMale(pGender)) return false;
      if (isFemale(gFilter) && !isFemale(pGender)) return false;
      if (isUnisex(gFilter) && !isUnisex(pGender)) return false;
    }

    // 2. Category Filter
    if (categoryFilter) {
      const pCat = normalizeText(product.category || '');
      const fCat = normalizeText(categoryFilter);
      if (pCat !== fCat) return false;
    }

    // 3. Search Query
    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      const normalizedName = normalizeText(product.name);
      const normalizedDescription = normalizeText(product.description || '');
      const normalizedCategory = normalizeText(product.category || '');

      return (
        normalizedName.includes(normalizedQuery) ||
        normalizedDescription.includes(normalizedQuery) ||
        normalizedCategory.includes(normalizedQuery)
      );
    }

    return true;
  });

  if (loading) return <div className="text-center p-8 text-white">Termékek betöltése...</div>;
  if (error) return <div className="text-center p-8 text-red-500">Hiba: {error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">
        {searchQuery
          ? `Keresés: "${searchQuery}"`
          : (genderFilter || categoryFilter)
            ? `Szűrés: ${genderFilter ? genderFilter : ''} ${categoryFilter ? categoryFilter : ''}`
            : 'Összes Termék'
        }
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
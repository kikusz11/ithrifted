import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import logo from '../assets/logo.png';
import { getPrimaryImage } from '../utils/productUtils';

interface Product {
  id: string;
  name: string;
  image_url: string;
  stock?: number;
}

const HeroStrips = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLatestProducts = async () => {
      setLoading(true);

      const { data } = await supabase
        .from('products')
        .select('id, name, image_url, stock')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(25);

      if (data) {
        // @ts-ignore
        setProducts(data);
      }
      setLoading(false);
    };

    fetchLatestProducts();
  }, []);


  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  if (loading) {
    return (
      <div className="relative w-250 m-auto h-96 bg-gray-50 flex items-center justify-center">
        <img
          src={logo}
          alt="Betöltés... i_thrifted_ logo"
          className="w-24 h-24 animate-spin"
        />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="relative w-full h-96 overflow-hidden bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Nincsenek aktuális termékek.</p>
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-blue text-white px-8 py-3 font-bold text-2xl tracking-wider shadow-lg">
            i_thrifted_
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-fit max-w-7xl mx-auto my-8 h-96 bg-gray-50">
      <div className="overflow-x-auto overflow-y-hidden h-full scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        <div className="flex h-full w-max">
          {products.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex-shrink-0 relative group"
              style={{ width: '60px' }}
            >
              <div
                onClick={() => handleProductClick(product.id)}
                title={product.name}
                aria-label={product.name}
                className="block w-full h-full relative overflow-hidden cursor-pointer"
              >
                <div
                  className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
                  style={{
                    backgroundImage: `url("${getPrimaryImage(product)}")`,
                    // @ts-ignore
                    filter: product.stock <= 0 ? 'grayscale(100%)' : 'none'
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 group-hover:to-black/40 transition-all duration-200" />

                {/* @ts-ignore */}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                    <span className="text-white font-bold text-xs transform -rotate-45 border-2 border-white px-1">
                      SOLDOUT
                    </span>
                  </div>
                )}

                <span className="absolute top-1 left-1 bg-white text-black text-xs font-semibold px-1 py-0.5 rounded text-[10px] opacity-80">
                  new
                </span>

                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none max-w-[200px] truncate">
                  {product.name}
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-6 flex space-x-4 text-sm font-semibold z-20">
        <button
          onClick={() => navigate('/shop')}
          className="text-gray-800 hover:text-black transition-colors bg-white/80 px-3 py-1 rounded cursor-pointer"
        >
          shop
        </button>
      </div>
    </div>
  );
};

export default HeroStrips;
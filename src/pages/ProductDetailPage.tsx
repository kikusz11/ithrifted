import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';

// Típusdefiníció a termék objektumhoz
interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  sizes: string[];
  category: string;
  gender: string;
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  console.log("useParams:", id);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // useCart hook használata
  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      if (!id) {
        setError("Nincs termékazonosító megadva.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', Number(id))
          .single();

        if (error) throw error;
        
        setProduct(data);
      } catch (err: any) {
        setError("A termék betöltése sikertelen: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url
      });
      
      // Sikeres hozzáadás visszajelzés
      alert(`${product.name} hozzáadva a kosárhoz!`);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Termék betöltése...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!product) {
    return <div className="text-center p-10">A termék nem található.</div>;
  }

  // Mock képek - később ezeket az adatbázisból kell betölteni
  const images = [
    product.image_url,
    product.image_url,
    product.image_url,
    product.image_url
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Bal oldal - Görgetheető képek */}
        <div className="w-1/2 overflow-y-auto max-h-screen">
          <div className="space-y-2 p-4">
            {images.map((image, index) => (
              <div key={index} className="w-full">
                <img 
                  src={image} 
                  alt={`${product.name} - ${index + 1}`}
                  className="w-full h-auto object-cover rounded-lg shadow-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Jobb oldal - Fix termék információk */}
        <div className="w-1/2 fixed right-0 top-0 h-screen overflow-y-auto bg-gray-900 p-8 pt-32">
          <div className="max-w-md mx-auto">
            {/* Termék név és ár */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
              <p className="text-2xl text-white font-semibold">
                {product.price.toLocaleString()} Ft
              </p>
            </div>

            {/* Termék leírás */}
            <div className="mb-8">
              <p className="text-gray-300 text-sm leading-relaxed mb-4">
                {product.description}
              </p>
              <p className="text-gray-400 text-sm">
                {product.category} - {product.gender}
              </p>
            </div>

            {/* Kosárba gomb */}
            <button 
              onClick={handleAddToCart}
              className="w-full bg-black hover:bg-gray-800 text-white font-medium py-4 px-6 text-sm tracking-wide transition-colors duration-200 mb-8"
            >
              KOSÁRBA
            </button>

            {/* Termék részletek tabok */}
            <div className="border-t border-gray-700">
              <div className="py-4">
                <button className="flex justify-between items-center w-full text-left text-sm font-medium">
                  <span>Szállítás</span>
                  <span className="text-gray-400">+</span>
                </button>
              </div>
              
              <div className="border-t border-gray-700 py-4">
                <button className="flex justify-between items-center w-full text-left text-sm font-medium">
                  <span>Segítség</span>
                  <span className="text-gray-400">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
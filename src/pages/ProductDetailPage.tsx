import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useCart } from '../contexts/CartContext';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { getAllImages, getPrimaryImage } from '../utils/productUtils';

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

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // useCart hook használata
  const { addToCart } = useCart();

  // Image Zoom State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const openModal = (image: string) => {
    setSelectedImage(image);
    setZoom(1);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  };

  const closeModal = () => {
    setSelectedImage(null);
    setZoom(1);
    document.body.style.overflow = 'unset';
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.5, 3)); // Max zoom 3x
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.5, 1)); // Min zoom 1x
  };

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
        image: getPrimaryImage(product)
      });

      // Sikeres hozzáadás visszajelzés
      toast.success(`${product.name} hozzáadva a kosárhoz!`);
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

  // Képek kezelése - getAllImages használata
  const images = getAllImages(product);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* Bal oldal - Görgetheető képek */}
        <div className="w-1/2 overflow-y-auto max-h-screen">
          <div className="space-y-2 p-4">
            {images.map((image, index) => (
              <div key={index} className="w-full cursor-pointer" onClick={() => openModal(image)}>
                <img
                  src={image}
                  alt={`${product.name} - ${index + 1}`}
                  className="w-full h-auto object-cover rounded-lg shadow-lg hover:opacity-90 transition-opacity"
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

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex justify-center items-center overflow-hidden"
          onClick={closeModal}
        >
          {/* Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-50">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
              title="Kicsinyítés"
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
              title="Nagyítás"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
            <button
              onClick={closeModal}
              className="p-2 bg-gray-800 rounded-full text-white hover:bg-red-600 transition-colors"
              title="Bezárás"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image */}
          <div
            className="relative transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'default' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full screen view"
              className="max-w-full max-h-screen object-contain select-none"
              draggable={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}
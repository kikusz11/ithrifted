import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../../lib/api';
import { useCart } from '../../contexts/CartContext';
import { Button } from '../../components/ui/button';
import { ShoppingCart } from 'lucide-react';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null); // Ez tárolja a nagyított kép URL-jét
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        if (data) {
          setProduct(data);

          // JAVÍTÁS ITT: Most már a 'data.image_urls' JSONB tömböt közvetlenül használjuk
          // Ellenőrizzük, hogy létezik és tömb-e
          if (Array.isArray(data.image_urls) && data.image_urls.length > 0) {
            setSelectedImage(data.image_urls[0]); // Beállítjuk az első képet alapértelmezettnek
          } else {
            setSelectedImage(null); // Ha nincs kép, selectedImage legyen null
          }

        } else {
          setError('Product not found.');
        }
      } catch (err) {
        setError('Failed to fetch product.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
    alert(`${product.name} a kosárba került!`); // Ideiglenes visszajelzés
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-500">
        <div className="text-xl">Error: {error}</div>
        <Link to="/" className="mt-4 text-blue-500 hover:underline">Go back to Home</Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-xl">Product not found.</div>
        <Link to="/" className="mt-4 text-blue-500 hover:underline">Go back to Home</Link>
      </div>
    );
  }

  // A rendereléshez közvetlenül a product.image_urls-t használjuk
  // Biztosítjuk, hogy mindig tömb legyen, még ha üres is
  const imagesToRender = Array.isArray(product.image_urls) ? product.image_urls : [];

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-6">
        <Link to="/" className="text-blue-500 hover:underline">
          &larr; Back to all products
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="mb-4">
            <img
              src={selectedImage || 'https://via.placeholder.com/500'}
              alt={product.name}
              className="w-full h-auto object-cover rounded-lg shadow-lg aspect-square"
            />
          </div>
          {/* JAVÍTÁS ITT: imagesToRender használata a map-hez */}
          {imagesToRender.length > 1 && ( // Csak akkor jelenítjük meg a galériát, ha több mint 1 kép van
            <div className="grid grid-cols-5 gap-2">
              {imagesToRender.map((url, index) => (
                <button key={index} onClick={() => setSelectedImage(url)} className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md">
                  <img
                    src={url}
                    alt={`Product thumbnail ${index + 1}`}
                    className={`w-full h-auto object-cover rounded-md cursor-pointer aspect-square ${selectedImage === url ? 'ring-2 ring-blue-500' : 'opacity-70 hover:opacity-100'}`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{product.name}</h1>
          <div className="flex items-baseline gap-2 mb-4">
            {product.sale_price && product.sale_price > 0 ? (
              <>
                <p className="text-3xl font-bold text-red-600">{product.sale_price.toLocaleString()} Ft</p>
                <p className="text-xl font-semibold text-gray-500 line-through">{product.price.toLocaleString()} Ft</p>
              </>
            ) : (
              <p className="text-3xl font-bold text-gray-800">{product.price.toLocaleString()} Ft</p>
            )}
          </div>

          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-1">Description</h2>
            <p className="text-gray-700">{product.description}</p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-1">Details</h2>
            <ul className="list-disc list-inside text-gray-600">
              <li>Size: {product.size}</li>
              <li>Category: {product.categories?.name || 'N/A'}</li>
              <li>Gender: {product.gender || 'N/A'}</li>
              <li>Állapot: {product.condition || 'N/A'}</li>
              {product.drop_settings && (
                <li>Drop: <span className="font-semibold text-blue-600">{product.drop_settings.name}</span></li>
              )}
            </ul>
          </div>

          <div className="mt-auto">
            <Button onClick={handleAddToCart} className="w-full" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Kosárba
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
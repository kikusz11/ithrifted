import React, { useState, useEffect, useCallback } from 'react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../../lib/api';
import { Button } from '../../components/ui/button';
import ProductForm from '../../components/admin/ProductForm';
import { PlusCircle, Edit, Trash2, AlertCircle } from 'lucide-react';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // Ezt már korábban javítottuk
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError('Hiba a termékek betöltése közben.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleNewProduct = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = async (productId, imageUrls) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a terméket? Ez a művelet nem vonható vissza.')) {
      setLoading(true);
      setError('');
      try {
        // Fontos: a deleteProduct függvényednek az api.js-ben kezelnie kell az imageUrls tömböt,
        // hogy törölje az összes hozzátartozó képet a Storage-ből.
        const { error: deleteError } = await deleteProduct(productId, imageUrls);
        if (deleteError) throw deleteError;
        await fetchProducts(); // Refresh list
      } catch (err) {
        setError(`Hiba a törlés során: ${err.message}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSaveProduct = async (formData, newImageFiles) => {
    setLoading(true);
    setError('');
    try {
      let finalImageUrls = [];

      // Meglévő képek hozzáadása a finalImageUrls tömbhöz
      if (Array.isArray(formData.image_urls)) {
        finalImageUrls = [...formData.image_urls];
      } else if (formData.image_urls) { // Ha valamiért mégis string jönne (régi adatból konvertált, ami már nem kellene)
          finalImageUrls = [formData.image_urls];
      }

      // Új képek feltöltése és hozzáadása a listához
      if (newImageFiles && newImageFiles.length > 0) {
        const uploadPromises = newImageFiles.map(file => uploadProductImage(file));
        const uploadedUrls = await Promise.all(uploadPromises);

        if (uploadedUrls.some(url => url === null)) {
          throw new Error('Egy vagy több kép feltöltése sikertelen.');
        }
        
        // Csak a sikeresen feltöltött URL-eket adjuk hozzá
        finalImageUrls.push(...uploadedUrls.filter(Boolean));
      }

      // TODO: Kezelni a képek törlését, amiket az űrlapon eltávolítottak.
      // Ehhez összehasonlításra van szükség az eredeti `editingProduct.image_urls` és a `formData.image_urls` között,
      // és a különbségre `deleteStorageFile` hívása.

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        sale_price: formData.sale_price ? parseFloat(formData.sale_price) : null,
        size: formData.size,
        condition: formData.condition,
        gender: formData.gender,
        category_id: formData.category_id,
        // ITT VAN A JAVÍTÁS: UUID-t stringként küldjük, nem számmá alakítjuk
        drop_id: formData.drop_id || null, 
        image_urls: finalImageUrls, // Ez már a helyesen összeállított URL tömb
        is_active: true, // Feltételezve, hogy alapértelmezetten aktív
      };

      if (editingProduct) {
        // Frissítés
        const { error: updateError } = await updateProduct(editingProduct.id, productData);
        if (updateError) throw updateError;
      } else {
        // Létrehozás
        const { error: createError } = await createProduct(productData);
        if (createError) throw createError;
      }

      setIsFormOpen(false);
      await fetchProducts(); // Listázás frissítése
    } catch (err) {
      setError(`Hiba a mentés során: ${err.message}`);
      console.error(err);
      // Hiba esetén ne zárjuk be az űrlapot, hogy a felhasználó újrapróbálhassa
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Termékkezelés</h1>
        <Button onClick={handleNewProduct}>
          <PlusCircle className="mr-2 h-4 w-4" /> Új termék hozzáadása
        </Button>
      </div>

      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => setIsFormOpen(false)}
          loading={loading}
        />
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
          <AlertCircle className="mr-2 h-5 w-5" /> {error}
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Kép</th>
                <th scope="col" className="px-6 py-3">Név</th>
                <th scope="col" className="px-6 py-3">Kategória</th>
                <th scope="col" className="px-6 py-3">Ár</th>
                <th scope="col" className="px-6 py-3">Állapot</th>
                <th scope="col" className="px-6 py-3 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {loading && !products.length ? (
                <tr><td colSpan="6" className="text-center p-8">Termékek betöltése...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-8">Nincsenek még termékek.</td></tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {/* Biztonságos hozzáférés az első képhez */}
                      <img src={(product.image_urls && product.image_urls.length > 0 && product.image_urls[0]) || 'https://via.placeholder.com/64'} alt={product.name} className="h-12 w-12 object-cover rounded-md" />
                    </td>
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {product.name}
                    </th>
                    <td className="px-6 py-4">{product.categories?.name || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {product.sale_price && product.sale_price > 0 ? (
                        <div>
                          <span className="line-through text-gray-500">{product.price.toLocaleString()} Ft</span>
                          <br />
                          <span className="font-bold text-red-600">{product.sale_price.toLocaleString()} Ft</span>
                        </div>
                      ) : (<span>{product.price.toLocaleString()} Ft</span>)}
                    </td>
                    <td className="px-6 py-4">{product.condition}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteProduct(product.id, product.image_urls)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
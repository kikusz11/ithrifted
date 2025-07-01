import React, { useState, useEffect } from 'react';
import { getCategories, getDrops } from '../../lib/api';
import { Button } from '../ui/button';
import { X, UploadCloud, Trash2 } from 'lucide-react';

const ProductForm = ({ product, onSave, onClose, loading }) => {
  const initialFormData = {
    name: '',
    description: '',
    price: '',
    sale_price: '',
    drop_id: '', // Mivel a drop_id UUID string, itt is stringként kezeljük, alapértelmezetten üres string
    size: '',
    condition: 'jó',
    gender: 'unisex',
    category_id: '', // A category_id bigint a DB-ben
    image_urls: [], // Ezt továbbra is tömbként inicializáljuk az új képek kezeléséhez
  };
  const [formData, setFormData] = useState(initialFormData);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryPath, setSelectedCategoryPath] = useState([]);
  const [drops, setDrops] = useState([]);

  // Populate form if a product is passed for editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        sale_price: product.sale_price || '',
        drop_id: product.drop_id || '', // drop_id stringként kezelve
        size: product.size || '',
        condition: product.condition || 'jó',
        gender: product.gender || 'unisex',
        category_id: product.category_id || '', // A category_id itt isそのまま kell, hogy string legyen, ha a selectből jön
        image_urls: Array.isArray(product.image_urls) ? product.image_urls : (product.image_urls ? [product.image_urls] : []),
      });
      setNewImageFiles([]);
      // TODO: A kategória elérési útvonalának beállítása szerkesztéskor egy későbbi lépés lesz.
      // Ez egy komplexebb feladat, a levél kategória ID-ből kell felépíteni a teljes útvonalat.
      // Egyelőre szerkesztéskor a kategória választó alaphelyzetbe áll.
    } else {
      setFormData(initialFormData);
    }
  }, [product]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getCategories();
      setAllCategories(data);
    };
    fetchCategories();
  }, []);

  // Fetch drops
  useEffect(() => {
    const fetchDrops = async () => {
      const data = await getDrops();
      setDrops(data);
    };
    fetchDrops();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (level, selectedId) => {
    const newPath = selectedCategoryPath.slice(0, level);
    // JAVÍTÁS ITT: Mivel a category.id a DB-ben BIGINT (egész szám), használd a parseInt-et
    if (selectedId) {
      newPath.push(parseInt(selectedId, 10)); // Helyes: stringből számmá alakítjuk a bigint ID-t
    }
    setSelectedCategoryPath(newPath);
    const finalCategoryId = newPath.length > 0 ? newPath[newPath.length - 1] : null;
    setFormData(prev => ({ ...prev, category_id: finalCategoryId }));
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      setNewImageFiles(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeNewImage = (index) => {
    setNewImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (urlToRemove) => {
    setFormData(prev => ({
      ...prev,
      image_urls: prev.image_urls.filter(url => url !== urlToRemove)
    }));
    // Note: This only removes it from the frontend state. The actual deletion from storage
    // will be handled in the parent component upon saving.
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, newImageFiles);
  };

  const renderCategorySelects = () => {
    const selects = [];
    // Főkategória
    selects.push(
      <select
        key="level-0"
        value={selectedCategoryPath[0] || ''}
        onChange={(e) => handleCategoryChange(0, e.target.value)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">Válassz főkategóriát</option>
        {allCategories.filter(c => c.parent_id === null).map(cat => (
          // category.id bigint, de itt stringként is jó (select value)
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
    );

    // Alkategóriák
    selectedCategoryPath.forEach((parentId, index) => {
      // Itt a parentId bigint szám, amit a filter-nek is helyesen kell kezelnie
      const subcategories = allCategories.filter(c => c.parent_id === parentId);
      if (subcategories.length > 0) {
        selects.push(
          <select
            key={`level-${index + 1}`}
            value={selectedCategoryPath[index + 1] || ''}
            onChange={(e) => handleCategoryChange(index + 1, e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Válassz alkategóriát</option>
            {subcategories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        );
      }
    });
    return selects;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6">{product ? 'Termék szerkesztése' : 'Új termék létrehozása'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Termék neve</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          </div>
            <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Leírás</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Eredeti Ár (Ft)</label>
            <input type="number" id="price" name="price" value={formData.price} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          </div>
          <div>
            <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700">Akciós Ár (Ft) <span className="text-gray-400">(hagyd üresen, ha nincs)</span></label>
            <input type="number" id="sale_price" name="sale_price" value={formData.sale_price} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="pl. 4990" />
          </div>
          <div>
            <label htmlFor="size" className="block text-sm font-medium text-gray-700">Méret</label>
            <input type="text" id="size" name="size" value={formData.size} onChange={handleInputChange} placeholder="pl. M, 42, L/XL" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required />
          </div>
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700">Állapot</label>
            <select id="condition" name="condition" value={formData.condition} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
              <option value="kifogástalan">Kifogástalan</option>
              <option value="jó">Jó</option>
              <option value="rossz">Rossz</option>
            </select>
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Nem</label>
            <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" required>
              <option value="unisex">Unisex</option>
              <option value="női">Női</option>
              <option value="férfi">Férfi</option>
            </select>
          </div>
          <div>
            <label htmlFor="drop_id" className="block text-sm font-medium text-gray-700">Drop Esemény <span className="text-gray-400">(opcionális)</span></label>
            <select
              id="drop_id"
              name="drop_id"
              value={formData.drop_id || ''} // Fontos az || '' üres string, hogy a select kontrollált legyen null esetén
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Nincs Drop</option>
              {drops.map((drop) => (
                <option key={drop.id} value={drop.id}>
                  {drop.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategória</label>
            <div className="mt-1 flex flex-col sm:flex-row gap-2">
              {renderCategorySelects()}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Termékképek</label>

            {/* Existing Images Preview */}
            {Array.isArray(formData.image_urls) && formData.image_urls.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Jelenlegi képek (kattints a törléshez):</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {formData.image_urls.map((url, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={url} alt={`Termékkép ${index + 1}`} className="h-full w-full object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(url)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Kép törlése"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Preview */}
            {newImageFiles.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-gray-600 mb-2">Új képek feltöltésre:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {newImageFiles.map((file, index) => (
                    <div key={index} className="relative group aspect-square">
                      <img src={URL.createObjectURL(file)} alt={`Új kép előnézete ${index + 1}`} className="h-full w-full object-cover rounded-md" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Feltöltés megszakítása"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File Input */}
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                <div className="mt-4 flex text-sm leading-6 text-gray-600">
                  <label htmlFor="image-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500">
                    <span>Válassz fájlokat</span>
                    <input id="image-upload" name="image-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                  </label>
                  <p className="pl-1">vagy húzd ide őket</p>
                </div>
                <p className="text-xs leading-5 text-gray-600">PNG, JPG, WEBP</p>
              </div>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Mégse</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Mentés...' : 'Termék mentése'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
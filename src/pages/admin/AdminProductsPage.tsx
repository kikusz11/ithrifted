import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

//================================================================================
// ProductForm Komponens (ide lett helyezve az importálási hiba miatt)
//================================================================================

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Nincs méretezve'];
const GENDERS = ['Férfi', 'Női', 'Unisex'];
const CATEGORIES = ['póló', 'pulcsi', 'kabát', 'nadrág', 'sapka'];

interface ProductFormData {
  name: string;
  description: string;
  price: number | '';
  sale_price?: number | ''; // Javítva: sale_price a discount_price helyett
  stock: number | '';
  category: string;
  gender: string;
  sizes: string[];
  image_url: string;
  is_active: boolean;
}

interface ProductFormProps {
  onSubmit: (data: any, imageFile: File | null) => void;
  initialData?: any | null;
  onClose: () => void;
}

function ProductForm({ onSubmit, initialData = null, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    price: '',
    sale_price: '',
    stock: '',
    category: CATEGORIES[0],
    gender: GENDERS[0],
    sizes: [],
    image_url: '',
    is_active: true,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || '',
        sale_price: initialData.sale_price || '',
        stock: initialData.stock || '',
        category: initialData.category || CATEGORIES[0],
        gender: initialData.gender || GENDERS[0],
        sizes: initialData.sizes || [],
        image_url: initialData.image_url || '',
        is_active: initialData.is_active === false ? false : true,
      });
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
    }
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      if (name === 'sizes') {
        const currentSizes = formData.sizes || [];
        if (checked) {
          setFormData(prev => ({ ...prev, sizes: [...currentSizes, value] }));
        } else {
          setFormData(prev => ({ ...prev, sizes: currentSizes.filter(size => size !== value) }));
        }
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else {
      const finalValue = (name === 'price' || name === 'stock' || name === 'sale_price')
        ? (value === '' ? '' : parseFloat(value))
        : value;
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      price: Number(formData.price) || 0,
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
      stock: Number(formData.stock) || 0,
    };
    onSubmit(dataToSubmit, imageFile);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 text-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
          <h2 className="text-2xl font-bold">{initialData ? 'Termék szerkesztése' : 'Új termék létrehozása'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Termék neve</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" required placeholder="Pl. Vintage Nike Póló" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Leírás</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="Részletes leírás a termékről..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Termékkép</label>
              <div className="flex items-start gap-4">
                {imagePreview ? (
                  <div className="relative group w-32 h-32 flex-shrink-0">
                    <img src={imagePreview} alt="Előnézet" className="w-full h-full object-cover rounded-xl border border-gray-700" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <span className="text-xs font-medium">Csere</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-gray-900/50 border-2 border-dashed border-gray-700 rounded-xl flex items-center justify-center text-gray-500 flex-shrink-0">
                    <span className="text-xs">Nincs kép</span>
                  </div>
                )}
                <div className="flex-1">
                  <input type="file" name="image" id="image" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer" />
                  <p className="text-xs text-gray-500 mt-2">Támogatott formátumok: PNG, JPG, WEBP. Max méret: 5MB.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-400 mb-1">Ár (Ft)</label>
                <input type="number" step="any" name="price" id="price" value={formData.price} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" required placeholder="0" />
              </div>
              <div>
                <label htmlFor="sale_price" className="block text-sm font-medium text-gray-400 mb-1">Akciós ár (Ft)</label>
                <input type="number" step="any" name="sale_price" id="sale_price" value={formData.sale_price} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="Opcionális" />
                {formData.sale_price && Number(formData.sale_price) >= Number(formData.price) && (
                  <p className="text-red-400 text-xs mt-1">Az akciós árnak kisebbnek kell lennie az eredetinél!</p>
                )}
              </div>
              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-400 mb-1">Készlet (db)</label>
                <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" required placeholder="1" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">Kategória</label>
                <select name="category" id="category" value={formData.category} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-400 mb-1">Nem</label>
                <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors">
                  {GENDERS.map(gen => <option key={gen} value={gen}>{gen}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Méretek</label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map(size => (
                  <label key={size} className={`
                    flex items-center justify-center px-4 py-2 rounded-lg cursor-pointer border transition-all
                    ${formData.sizes.includes(size)
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-gray-900/50 border-gray-700 text-gray-400 hover:border-gray-500'}
                  `}>
                    <input type="checkbox" name="sizes" value={size} checked={formData.sizes.includes(size)} onChange={handleChange} className="hidden" />
                    <span className="text-sm font-medium">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center p-3 bg-gray-900/50 border border-gray-700 rounded-xl cursor-pointer hover:bg-gray-800/50 transition-colors">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800" />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-white">Aktív termék</span>
                  <span className="block text-xs text-gray-400">Ha be van pipálva, a termék megjelenik a webshopban.</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-medium">Mégse</button>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 font-medium transition-all hover:scale-105 active:scale-95">Mentés</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

//================================================================================
// AdminProductsPage Komponens (a fő komponens)
//================================================================================

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);

  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleFormSubmit = async (formData: any, imageFile: File | null) => {
    try {
      let finalImageUrl = editingProduct?.image_url || formData.image_url || null;

      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name.replace(/\s/g, '_')}`;
        const { error: uploadError } = await supabase.storage
          .from('termek-kepek')
          .upload(fileName, imageFile);
        if (uploadError) { throw new Error(`Képfeltöltési hiba: ${uploadError.message}`); }
        const { data: urlData } = supabase.storage
          .from('termek-kepek')
          .getPublicUrl(fileName);
        finalImageUrl = urlData.publicUrl;
      }

      const dataToSubmit = { ...formData, image_url: finalImageUrl };

      let result;
      if (editingProduct) {
        result = await supabase.from('products').update(dataToSubmit).eq('id', editingProduct.id);
      } else {
        result = await supabase.from('products').insert(dataToSubmit);
      }
      if (result.error) throw result.error;

      setShowForm(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      alert(`Hiba a mentés során: ${err.message}`);
    }
  };

  const handleDelete = async (productId: string) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a terméket?')) {
      try {
        const productToDelete = products.find(p => p.id === productId);
        if (productToDelete && productToDelete.image_url) {
          const fileName = productToDelete.image_url.split('/').pop();
          if (fileName) {
            await supabase.storage.from('termek-kepek').remove([fileName]);
          }
        }
        const { error: dbError } = await supabase.from('products').delete().eq('id', productId);
        if (dbError) throw dbError;
        fetchProducts();
      } catch (err: any) {
        alert(`Hiba a törlés során: ${err.message}`);
      }
    }
  }

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  }

  return (
    <div className="p-4 md:p-8 bg-gray-900 text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Termékek Kezelése</h1>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
          + Új Termék
        </button>
      </div>

      {showForm && (
        <ProductForm
          onSubmit={handleFormSubmit}
          initialData={editingProduct}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}

      {loading && <p>Termékek betöltése...</p>}
      {error && <p className="text-red-500">Hiba: {error}</p>}

      {!loading && !error && (
        <div className="space-y-4">
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {products.map(product => (
              <div key={product.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-sm">
                <div className="flex gap-4 mb-4">
                  <img src={product.image_url || 'https://placehold.co/60x60/2d3748/e2e8f0?text=Nincs+kép'} alt={product.name} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{product.name}</h3>
                    <p className="text-gray-400 text-sm">{product.category}</p>
                    <div className="mt-1">
                      {product.sale_price ? (
                        <div className="flex items-center gap-2">
                          <span className="text-indigo-400 font-bold">{product.sale_price.toLocaleString()} Ft</span>
                          <span className="text-gray-500 text-sm line-through">{product.price.toLocaleString()} Ft</span>
                        </div>
                      ) : (
                        <p className="text-indigo-400 font-bold">{product.price.toLocaleString()} Ft</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-700 pt-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {product.is_active ? 'Aktív' : 'Inaktív'}
                    </span>
                    <span className="text-xs text-gray-500">Készlet: {product.stock} db</span>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(product)} className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">Szerkesztés</button>
                    <button onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300 text-sm font-medium">Törlés</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-gray-800 rounded-lg shadow overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-700">
                <tr>
                  <th className="p-4">Kép</th>
                  <th className="p-4">Név</th>
                  <th className="p-4">Kategória</th>
                  <th className="p-4">Ár</th>
                  <th className="p-4">Készlet</th>
                  <th className="p-4">Státusz</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="p-4"><img src={product.image_url || 'https://placehold.co/60x60/2d3748/e2e8f0?text=Nincs+kép'} alt={product.name} className="w-16 h-16 object-cover rounded-md" /></td>
                    <td className="p-4 font-semibold">{product.name}</td>
                    <td className="p-4">{product.category}</td>
                    <td className="p-4">
                      {product.sale_price ? (
                        <div>
                          <span className="text-indigo-400 font-bold block">{product.sale_price.toLocaleString()} Ft</span>
                          <span className="text-gray-500 text-sm line-through">{product.price.toLocaleString()} Ft</span>
                        </div>
                      ) : (
                        <span>{product.price.toLocaleString()} Ft</span>
                      )}
                    </td>
                    <td className="p-4">{product.stock} db</td>
                    <td className="p-4"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.is_active ? 'bg-green-500 text-green-900' : 'bg-gray-600 text-gray-300'}`}>{product.is_active ? 'Aktív' : 'Inaktív'}</span></td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleEdit(product)} className="text-indigo-400 hover:text-indigo-300 mr-4">Szerkesztés</button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-500 hover:text-red-400">Törlés</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase Client beállítása (a te adataiddal) ---
const supabaseUrl = 'https://rvqkupuesguslnqiscgd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2cWt1cHVlc2d1c2xucWlzY2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5NDc2MzcsImV4cCI6MjA3MDUyMzYzN30.O6vijCRREqFyNw0gWT1YXmJi693U0JyiHOmWFBpEdK8';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        const finalValue = (name === 'price' || name === 'stock')
            ? (value === '' ? '' : parseFloat(value))
            : value;
        setFormData(prev => ({...prev, [name]: finalValue}));
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
      stock: Number(formData.stock) || 0,
    };
    onSubmit(dataToSubmit, imageFile);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Termék szerkesztése' : 'Új termék létrehozása'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block font-bold mb-1">Termék neve</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required />
            </div>
            <div>
              <label htmlFor="description" className="block font-bold mb-1">Leírás</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
            </div>
            <div>
              <label className="block font-bold mb-1">Termékkép</label>
              {imagePreview && <div className="mb-4"><img src={imagePreview} alt="Termék előnézet" className="w-full h-64 object-cover rounded-lg" /></div>}
              <input type="file" name="image" id="image" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="price" className="block font-bold mb-1">Ár (Ft)</label><input type="number" step="any" name="price" id="price" value={formData.price} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required /></div>
              <div><label htmlFor="stock" className="block font-bold mb-1">Készlet (db)</label><input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label htmlFor="category" className="block font-bold mb-1">Kategória</label><select name="category" id="category" value={formData.category} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md">{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                <div><label htmlFor="gender" className="block font-bold mb-1">Nem</label><select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md">{GENDERS.map(gen => <option key={gen} value={gen}>{gen}</option>)}</select></div>
            </div>
            <div>
              <label className="block font-bold mb-2">Méretek</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {SIZES.map(size => (<label key={size} className="flex items-center justify-center p-2 bg-gray-700 border border-gray-600 rounded-md cursor-pointer has-[:checked]:bg-indigo-600 has-[:checked]:border-indigo-500 transition-colors"><input type="checkbox" name="sizes" value={size} checked={formData.sizes.includes(size)} onChange={handleChange} className="hidden" /><span>{size}</span></label>))}
              </div>
            </div>
            <div className="pt-2"><label className="flex items-center"><input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded" /><span className="ml-2">Aktív (Megjelenik a boltban)</span></label></div>
            <div className="flex items-center justify-end gap-4 pt-4">
              <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">Mégse</button>
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">Mentés</button>
            </div>
        </form>
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
    <div className="p-8 bg-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Termékek Kezelése</h1>
        <button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-md transition-colors">
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
        <div className="bg-gray-800 rounded-lg shadow overflow-x-auto">
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
                  <td className="p-4">{product.price.toLocaleString()} Ft</td>
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
      )}
    </div>
  );
}


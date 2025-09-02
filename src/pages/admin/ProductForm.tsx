import { useState, useEffect, FormEvent, ChangeEvent } from 'react';

// Előre definiált opciók az űrlaphoz
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Nincs méretezve'];
const GENDERS = ['Férfi', 'Női', 'Unisex'];
const CATEGORIES = ['póló', 'pulcsi', 'kabát', 'nadrág', 'sapka'];

// Típusdefiníciók a TypeScript számára
interface FormData {
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
  // MÓDOSÍTVA: Az onSubmit most már a képfájlt is megkapja
  onSubmit: (data: any, imageFile: File | null) => void;
  initialData?: any | null;
  onClose: () => void;
}

export default function ProductForm({ onSubmit, initialData = null, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState<FormData>({
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

  // ÚJ: Állapotok a képfájl és az előnézet kezelésére
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  // Ha szerkesztésre kapunk adatot, betöltjük az űrlapba
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
        is_active: initialData.is_active === false ? false : true, // Helyes checkbox kezelés
      });
      // ÚJ: A meglévő kép URL-jét beállítjuk előnézetnek
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

        setFormData(prev => ({
            ...prev,
            [name]: finalValue,
        }));
    }
  };
  
  // ÚJ: Képfájl kiválasztásának kezelése
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file); // A fájl objektum elmentése
      setImagePreview(URL.createObjectURL(file)); // Ideiglenes előnézeti URL létrehozása
    }
  };

  // MÓDOSÍTVA: A handleSubmit átadja a képfájlt is
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

          {/* ÚJ: Képfeltöltő és előnézet szekció */}
          <div>
            <label className="block font-bold mb-1">Termékkép</label>
            {imagePreview && (
              <div className="mb-4">
                <img src={imagePreview} alt="Termék előnézet" className="w-full h-64 object-cover rounded-lg" />
              </div>
            )}
            <input 
              type="file" 
              name="image" 
              id="image" 
              onChange={handleImageChange} 
              accept="image/png, image/jpeg, image/webp"
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block font-bold mb-1">Ár (Ft)</label>
              <input type="number" step="any" name="price" id="price" value={formData.price} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required />
            </div>
            <div>
              <label htmlFor="stock" className="block font-bold mb-1">Készlet (db)</label>
              <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="category" className="block font-bold mb-1">Kategória</label>
                  <select name="category" id="category" value={formData.category} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md">
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="gender" className="block font-bold mb-1">Nem</label>
                  <select name="gender" id="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md">
                      {GENDERS.map(gen => <option key={gen} value={gen}>{gen}</option>)}
                  </select>
              </div>
          </div>
          
          <div>
            <label className="block font-bold mb-2">Méretek</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {SIZES.map(size => (
                    <label key={size} className="flex items-center justify-center p-2 bg-gray-700 border border-gray-600 rounded-md cursor-pointer has-[:checked]:bg-indigo-600 has-[:checked]:border-indigo-500 transition-colors">
                        <input type="checkbox" name="sizes" value={size} checked={formData.sizes.includes(size)} onChange={handleChange} className="hidden" />
                        <span>{size}</span>
                    </label>
                ))}
            </div>
          </div>
          
          <div className="pt-2">
              <label className="flex items-center">
                 <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded" />
                 <span className="ml-2">Aktív (Megjelenik a boltban)</span>
              </label>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md">
              Mégse
            </button>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">
              Mentés
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';

// Típusdefiníciók a TypeScript számára
interface FormData {
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface DropFormProps {
  onSubmit: (data: FormData) => void;
  initialData?: any | null;
  onClose: () => void;
}

export default function DropForm({ onSubmit, initialData = null, onClose }: DropFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    is_active: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        start_time: initialData.start_time ? new Date(initialData.start_time).toISOString().slice(0, 16) : '',
        end_time: initialData.end_time ? new Date(initialData.end_time).toISOString().slice(0, 16) : '',
        is_active: initialData.is_active || false,
      });
    }
  }, [initialData]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const { checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Drop szerkesztése' : 'Új drop létrehozása'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block font-bold mb-1">Név</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required />
          </div>
          <div>
            <label htmlFor="description" className="block font-bold mb-1">Leírás</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block font-bold mb-1">Kezdés</label>
              <input type="datetime-local" name="start_time" id="start_time" value={formData.start_time} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required />
            </div>
            <div>
              <label htmlFor="end_time" className="block font-bold mb-1">Befejezés</label>
              <input type="datetime-local" name="end_time" id="end_time" value={formData.end_time} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md" required />
            </div>
          </div>
          <div>
            <label className="flex items-center">
              <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-4 h-4 text-indigo-600 bg-gray-700 border-gray-600 rounded" />
              <span className="ml-2">Aktív drop</span>
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

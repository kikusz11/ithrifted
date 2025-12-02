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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn">
      <div className="bg-gray-800 text-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-800 z-10">
          <h2 className="text-2xl font-bold">{initialData ? 'Drop szerkesztése' : 'Új drop létrehozása'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-1">Név</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" required placeholder="Pl. Tavaszi Drop" />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Leírás</label>
              <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" placeholder="Rövid leírás a dropról..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-gray-400 mb-1">Kezdés</label>
                <input type="datetime-local" name="start_time" id="start_time" value={formData.start_time} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" required />
              </div>
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-gray-400 mb-1">Befejezés</label>
                <input type="datetime-local" name="end_time" id="end_time" value={formData.end_time} onChange={handleChange} className="w-full p-3 bg-gray-900/50 border border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" required />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center p-3 bg-gray-900/50 border border-gray-700 rounded-xl cursor-pointer hover:bg-gray-800/50 transition-colors">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="w-5 h-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500 focus:ring-offset-gray-800" />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-white">Aktív drop</span>
                  <span className="block text-xs text-gray-400">Ha be van pipálva, a drop aktív lesz.</span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors font-medium">
                Mégse
              </button>
              <button type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 font-medium transition-all hover:scale-105 active:scale-95">
                Mentés
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

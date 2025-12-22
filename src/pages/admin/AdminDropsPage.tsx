import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient.ts';
import DropForm from './DropForm.tsx';

export default function AdminDropsPage() {
  const [drops, setDrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDrop, setEditingDrop] = useState<any | null>(null);

  async function getDrops() {
    setLoading(true);
    const { data, error } = await supabase.from('drops').select('*').order('start_time', { ascending: false });
    if (error) console.error('Error fetching drops:', error);
    else setDrops(data || []);
    setLoading(false);
  }

  useEffect(() => {
    getDrops();
  }, []);

  const handleAddNew = () => {
    setEditingDrop(null);
    setIsFormOpen(true);
  };

  const handleEdit = (drop: any) => {
    setEditingDrop(drop);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (formData: any) => {
    let error;
    if (editingDrop) {
      ({ error } = await supabase.from('drops').update(formData).eq('id', editingDrop.id));
    } else {
      ({ error } = await supabase.from('drops').insert([formData]));
    }

    if (error) {
      alert('Hiba a mentés során: ' + error.message);
    } else {
      setIsFormOpen(false);
      getDrops();
    }
  };

  const handleDelete = async (dropId: number) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a dropot?')) {
      try {
        const { error } = await supabase.from('drops').delete().eq('id', dropId);
        if (error) throw error;
        await getDrops();
      } catch (err: any) {
        alert(`Hiba a törlés során: ${err.message}`);
      }
    }
  };

  if (loading) return <div className="p-8 text-stone-600">Dropok betöltése...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-stone-900">Drop Kezelés</h1>
        <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors">
          + Új drop
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-stone-600">
            <thead className="bg-stone-50 text-stone-900 border-b border-stone-200">
              <tr>
                <th className="p-4 font-semibold">Név</th>
                <th className="p-4 font-semibold">Kezdés</th>
                <th className="p-4 font-semibold">Befejezés</th>
                <th className="p-4 font-semibold">Státusz</th>
                <th className="p-4 font-semibold">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {drops.map((drop) => (
                <tr key={drop.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50 transition-colors">
                  <td className="p-4 font-medium text-stone-900">{drop.name}</td>
                  <td className="p-4">{new Date(drop.start_time).toLocaleString('hu-HU')}</td>
                  <td className="p-4">{new Date(drop.end_time).toLocaleString('hu-HU')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${drop.is_active ? 'bg-green-100 text-green-700 border-green-200' : 'bg-stone-100 text-stone-600 border-stone-200'}`}>
                      {drop.is_active ? 'Aktív' : 'Inaktív'}
                    </span>
                  </td>
                  <td className="p-4 flex gap-4">
                    <button onClick={() => handleEdit(drop)} className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">Szerkesztés</button>
                    <button onClick={() => handleDelete(drop.id)} className="text-red-500 hover:text-red-700 font-semibold transition-colors">Törlés</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <DropForm
          onSubmit={handleFormSubmit}
          initialData={editingDrop}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}

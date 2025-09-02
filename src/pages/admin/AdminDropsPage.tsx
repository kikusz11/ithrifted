import { useState, useEffect } from 'react';
// JAVÍTVA: Hozzáadtuk a pontos fájlkiterjesztéseket az import útvonalakhoz a hiba elhárítása érdekében
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

  if (loading) return <div className="p-8 text-white">Dropok betöltése...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Drop Kezelés</h1>
        <button onClick={handleAddNew} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">
          + Új drop
        </button>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
        <table className="w-full text-left text-gray-300">
          <thead className="bg-gray-700 text-white">
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
              <tr key={drop.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                <td className="p-4">{drop.name}</td>
                <td className="p-4">{new Date(drop.start_time).toLocaleString('hu-HU')}</td>
                <td className="p-4">{new Date(drop.end_time).toLocaleString('hu-HU')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${drop.is_active ? 'bg-green-500 text-green-900' : 'bg-gray-600 text-gray-200'}`}>
                    {drop.is_active ? 'Aktív' : 'Inaktív'}
                  </span>
                </td>
                <td className="p-4 flex gap-4">
                  <button onClick={() => handleEdit(drop)} className="text-blue-400 hover:text-blue-300 font-semibold">Szerkesztés</button>
                  <button onClick={() => handleDelete(drop.id)} className="text-red-500 hover:text-red-400 font-semibold">Törlés</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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


import React, { useState, useEffect, useCallback } from 'react';
import {
  getFullDropSettings,
  createDropSetting,
  updateDropSetting,
} from '../../lib/api';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/button';
import { Edit, ToggleLeft, ToggleRight, AlertCircle, Calendar, X } from 'lucide-react';

const DropSettings = () => {
  const [drops, setDrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const initialFormState = { name: '', start_time: '', end_time: '' };
  const [formData, setFormData] = useState(initialFormState);
  const [editingDrop, setEditingDrop] = useState(null);

  const fetchDrops = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getFullDropSettings();
      setDrops(data);
    } catch (err) {
      setError('Hiba a drop események betöltése közben.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrops();
  }, [fetchDrops]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingDrop(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    try {
      const dataToSave = {
        name: formData.name,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      if (editingDrop) {
        const { error: updateError } = await updateDropSetting(editingDrop.id, dataToSave);
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await createDropSetting({ ...dataToSave, is_active: false });
        if (createError) throw createError;
      }
      resetForm();
      await fetchDrops();
    } catch (err) {
      setError(`Hiba a mentés során: ${err.message}`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (drop) => {
    setEditingDrop(drop);
    // Helper to format ISO string to 'YYYY-MM-DDTHH:mm' for datetime-local input
    const formatForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // Adjust for timezone offset to display the correct local time
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      return (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    };
    setFormData({
      name: drop.name,
      start_time: formatForInput(drop.start_time),
      end_time: formatForInput(drop.end_time),
    });
  };

  const handleToggleActive = async (dropId, currentStatus) => {
    setLoading(true);
    setError('');
    try {
      // This logic ensures only one drop can be active at a time.
      // It should ideally be an atomic transaction (e.g., a database function/RPC)
      // to prevent race conditions, but for this app, it's sufficient.
      if (!currentStatus) {
        // Deactivate all other active drops first
        const { error: deactivateError } = await supabase.from('drop_settings').update({ is_active: false }).eq('is_active', true);
        if (deactivateError) throw deactivateError;

        // Activate the selected drop
        const { error: activateError } = await supabase.from('drop_settings').update({ is_active: true }).eq('id', dropId);
        if (activateError) throw activateError;
      } else {
        // Deactivate the currently active drop
        const { error: deactivateError } = await supabase.from('drop_settings').update({ is_active: false }).eq('id', dropId);
        if (deactivateError) throw deactivateError;
      }
      await fetchDrops(); // Refresh the list to show the new state
    } catch (err) {
      setError(`Hiba az állapot váltása során: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('hu-HU');

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Drop Események Kezelése</h1>

      {/* Form Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Calendar className="mr-3" />
          {editingDrop ? 'Esemény szerkesztése' : 'Új esemény létrehozása'}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-3">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Esemény neve</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">Kezdés</label>
            <input type="datetime-local" id="start_time" name="start_time" value={formData.start_time} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">Befejezés</label>
            <input type="datetime-local" id="end_time" name="end_time" value={formData.end_time} onChange={handleInputChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" required />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={formLoading} className="w-full">
              {formLoading ? 'Mentés...' : (editingDrop ? 'Módosítás mentése' : 'Létrehozás')}
            </Button>
            {editingDrop && <Button type="button" variant="outline" onClick={resetForm}><X size={16}/></Button>}
          </div>
        </form>
        {error && <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md flex items-center"><AlertCircle className="mr-2" /> {error}</div>}
      </div>

      {/* List Section */}
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Név</th>
                <th scope="col" className="px-6 py-3">Kezdés</th>
                <th scope="col" className="px-6 py-3">Befejezés</th>
                <th scope="col" className="px-6 py-3">Státusz</th>
                <th scope="col" className="px-6 py-3 text-right">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (<tr><td colSpan="5" className="text-center p-8">Betöltés...</td></tr>) : drops.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-8">Nincsenek még drop események.</td></tr>
              ) : (
                drops.map((drop) => (
                  <tr key={drop.id} className="bg-white border-b hover:bg-gray-50">
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900">{drop.name}</th>
                    <td className="px-6 py-4">{formatDate(drop.start_time)}</td>
                    <td className="px-6 py-4">{formatDate(drop.end_time)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${drop.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {drop.is_active ? 'Aktív' : 'Inaktív'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(drop.id, drop.is_active)} disabled={loading}>
                          {drop.is_active ? <ToggleRight className="h-5 w-5 text-green-600" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(drop)}>
                          <Edit className="h-4 w-4" />
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

export default DropSettings;
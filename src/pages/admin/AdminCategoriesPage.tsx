import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Plus, Edit2, Trash2, X, Search, Loader2, ChevronRight, ChevronDown, Check, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
    is_active: boolean;
    assigned_gender: string;
    created_at: string;
    children?: Category[]; // For UI hierarchy
}

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [flatCategories, setFlatCategories] = useState<Category[]>([]); // For dropdowns
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent_id: '' as string | number, // '' for null/root
        is_active: true,
        assigned_gender: 'all' as string
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isModalOpen) setIsModalOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

    const fetchCategories = async () => {
        try {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;

            const cats = data as Category[];
            setFlatCategories(cats);
            setCategories(buildHierarchy(cats));
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Nem sikerült betölteni a kategóriákat');
        } finally {
            setLoading(false);
        }
    };

    const buildHierarchy = (cats: Category[]) => {
        const categoryMap = new Map<number, Category>();
        const roots: Category[] = [];

        // Initialize map with a shallow copy to add children array
        cats.forEach(cat => categoryMap.set(cat.id, { ...cat, children: [] }));

        cats.forEach(cat => {
            if (cat.parent_id) {
                const parent = categoryMap.get(cat.parent_id);
                if (parent) {
                    parent.children?.push(categoryMap.get(cat.id)!);
                } else {
                    // Start orphan or parent deleted, treat as root for safety
                    roots.push(categoryMap.get(cat.id)!);
                }
            } else {
                roots.push(categoryMap.get(cat.id)!);
            }
        });
        return roots;
    };

    const toggleExpand = (id: number) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCategories(newExpanded);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const slug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const payload = {
                name: formData.name,
                slug,
                parent_id: formData.parent_id === '' ? null : Number(formData.parent_id),
                is_active: formData.is_active,
                assigned_gender: formData.assigned_gender
            };

            if (editingCategory) {
                // Prevent setting self as parent
                if (payload.parent_id === editingCategory.id) {
                    toast.error('Egy kategória nem lehet önmaga szülője!');
                    setSaving(false);
                    return;
                }

                const { error } = await supabase
                    .from('categories')
                    .update(payload)
                    .eq('id', editingCategory.id);
                if (error) throw error;
                toast.success('Kategória frissítve');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert([payload]);
                if (error) throw error;
                toast.success('Kategória létrehozva');
            }

            setIsModalOpen(false);
            setEditingCategory(null);
            resetForm();
            fetchCategories();
        } catch (error: any) {
            console.error('Error saving category:', error);
            toast.error('Hiba történt: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            parent_id: '',
            is_active: true,
            assigned_gender: 'all'
        });
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            slug: category.slug || '',
            parent_id: category.parent_id || '',
            is_active: category.is_active,
            assigned_gender: category.assigned_gender
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Biztosan törölni szeretnéd? Ha van alkategóriája, az is törlődhet vagy "árva" maradhat.')) return;
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (error) throw error;
            toast.success('Kategória törölve');
            fetchCategories();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Nem sikerült törölni');
        }
    };

    const openModal = () => {
        setEditingCategory(null);
        resetForm();
        setIsModalOpen(true);
    };

    // Recursive component for Tree View
    const CategoryItem = ({ category, level = 0 }: { category: Category, level?: number }) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedCategories.has(category.id);
        const isMatch = searchTerm === '' || category.name.toLowerCase().includes(searchTerm.toLowerCase());

        // If searching, show all matching files flat-like or expand parents. 
        // For simplicity in this step: if search is active, we just check name match.
        // If hierarchies are needed during search, it gets complex. 
        // Let's hide non-matching items if search is present?

        if (searchTerm && !isMatch) {
            // If a child matches, we might want to show this parent? 
            // Implementing simple filter: hide if not match
            // But if we want proper tree filtering, we need 'doesAnyChildMatch' logic.
            // For now, simple filter on top level:
            return null;
            // Ideally we flatten the list when searching.
        }

        return (
            <>
                <div
                    className={`flex items-center p-3 hover:bg-gray-700/50 border-b border-gray-700 transition-colors ${!category.is_active ? 'opacity-50' : ''}`}
                    style={{ paddingLeft: `${level * 20 + 12}px` }}
                >
                    <div className="flex-1 flex items-center gap-3">
                        {hasChildren ? (
                            <button onClick={() => toggleExpand(category.id)} className="text-gray-400 hover:text-white">
                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                        ) : (
                            <span className="w-4"></span>
                        )}

                        <span className="font-medium text-white">{category.name}</span>

                        {!category.is_active && (
                            <span className="flex items-center text-xs text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded ml-2">
                                <EyeOff size={12} className="mr-1" /> Rejtett
                            </span>
                        )}

                        {category.assigned_gender !== 'all' && (
                            <span className={`text-xs px-2 py-0.5 rounded ml-2 ${category.assigned_gender === 'male' ? 'bg-blue-500/20 text-blue-400' :
                                category.assigned_gender === 'female' ? 'bg-pink-500/20 text-pink-400' :
                                    'bg-purple-500/20 text-purple-400'
                                }`}>
                                {category.assigned_gender === 'male' ? 'Férfi' : category.assigned_gender === 'female' ? 'Női' : 'Unisex'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => handleEdit(category)} className="p-2 text-indigo-400 hover:bg-indigo-500/20 rounded-lg">
                            <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(category.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {isExpanded && hasChildren && category.children!.map(child => (
                    <CategoryItem key={child.id} category={child} level={level + 1} />
                ))}
            </>
        );
    };

    // Flattened search view
    const renderContent = () => {
        if (loading) return <div className="text-center py-8 text-gray-400">Betöltés...</div>;

        if (searchTerm) {
            const filtered = flatCategories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
            return (
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    {filtered.map(cat => (
                        <div key={cat.id} className="flex justify-between p-4 border-b border-gray-700 last:border-0 hover:bg-gray-700/30">
                            <div>
                                <span className="text-white font-medium">{cat.name}</span>
                                <span className="text-gray-500 text-sm ml-2">({cat.slug})</span>
                            </div>
                            <button onClick={() => handleEdit(cat)} className="text-indigo-400 hover:text-indigo-300">Szerkesztés</button>
                        </div>
                    ))}
                    {filtered.length === 0 && <p className="p-4 text-center text-gray-500">Nincs találat.</p>}
                </div>
            )
        }

        return (
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] bg-gray-700/50 text-xs text-gray-400 uppercase font-semibold px-4 py-3">
                    <div>Név / Struktúra</div>
                    <div>Műveletek</div>
                </div>
                {categories.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nincsenek kategóriák.</div>
                ) : (
                    categories.map(cat => <CategoryItem key={cat.id} category={cat} />)
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Kategóriák Kezelése</h1>
                <button
                    onClick={openModal}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Új Kategória
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Keresés..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
            </div>

            {renderContent()}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-md border border-gray-700">
                        <div className="flex justify-between items-center p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white">
                                {editingCategory ? 'Kategória Szerkesztése' : 'Új Kategória'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Név</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Slug (URL barát név)</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="automatikusan-generalt"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Szülő Kategória</label>
                                <select
                                    value={formData.parent_id}
                                    onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-indigo-500 outline-none"
                                >
                                    <option value="">(Nincs - Főkategória)</option>
                                    {flatCategories
                                        .filter(c => c.id !== editingCategory?.id) // Prevent selecting self
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Menü Csoport (hol jelenjen meg)</label>
                                <div className="relative">
                                    <select
                                        value={formData.assigned_gender}
                                        onChange={e => setFormData({ ...formData, assigned_gender: e.target.value })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-indigo-500 outline-none appearance-none"
                                    >
                                        <option value="all">Mindenhol (Mind)</option>
                                        <option value="male">Férfi</option>
                                        <option value="female">Női</option>
                                        <option value="unisex">Unisex</option>
                                        <option value="sales">Akciós</option>
                                        <option value="new">Újdonságok</option>
                                        <option value="bestsellers">Népszerű</option>
                                        <option value="custom">Egyéb...</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                </div>
                                {formData.assigned_gender === 'custom' && (
                                    <input
                                        type="text"
                                        placeholder="Írd be a csoport kódját (pl. summer-collection)"
                                        className="mt-2 w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-indigo-500 outline-none"
                                        onChange={e => setFormData({ ...formData, assigned_gender: e.target.value })}
                                    />
                                )}
                            </div>

                            <div className="flex items-center pt-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-700"
                                />
                                <label htmlFor="is_active" className="ml-2 text-sm text-gray-300 cursor-pointer">
                                    Aktív (Megjelenik a menüben)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                                >
                                    Mégse
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2"
                                >
                                    {saving && <Loader2 size={16} className="animate-spin" />}
                                    {editingCategory ? 'Mentés' : 'Létrehozás'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

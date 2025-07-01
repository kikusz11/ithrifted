import { supabase } from './supabaseClient'; // Győződj meg róla, hogy ez a path helyes a supabase kliensedhez!

// === ÚJ INTERFÉSZEK ===
interface ProductFilters {
  isActive?: boolean;
  categoryId?: number;
}

interface ActiveDropSettings {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface OrderItemRaw {
  product_id: string;
  quantity: number;
  price_at_order?: number;
}

interface OrderItem extends OrderItemRaw {
  product_name?: string;
  product_image_url?: string;
  product_price?: number;
}

interface Order {
  id: string;
  user_id: string;
  items: OrderItemRaw[];
  pickup_point: string;
  payment_status: string;
  order_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  profile_username?: string;
  profile_full_name?: string;
  users?: { // Megtartjuk, mert a getOrderById még használhatja a users(profiles()) struktúrát
    profiles?: {
      username?: string;
      full_name?: string;
    };
  };
}
// === INTERFÉSZEK VÉGE ===


// Products
export const getProducts = async (filters: ProductFilters = {}) => {
  let query = supabase.from('products').select('*, categories(name), drop_id, drop_settings(name)');

  if (filters.isActive) {
    query = query.eq('is_active', true);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data;
};

export const getProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), drop_id, drop_settings(name)')
    .eq('id', id)
    .single();
  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }
  return data;
};

export const createProduct = async (productData: any) => {
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select();
  return { data, error };
};

export const updateProduct = async (productId: string, productData: any) => {
  const { data, error } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)
    .select();
  return { data, error };
};

export const deleteProduct = async (productId: string, imageUrls: string[]) => {
  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
    const imageNames = imageUrls
      .map(url => (url ? url.split('/').pop() : null))
      .filter(Boolean) as string[];
    if (imageNames.length > 0) {
      const { error: imageError } = await supabase.storage
        .from('product-images')
        .remove(imageNames);
      if (imageError) {
        console.error('Hiba a termékképek törlésekor:', imageError);
      }
    }
  }
  const { error } = await supabase.from('products').delete().eq('id', productId);
  return { error };
};

// Storage
export const uploadProductImage = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);

  return data.publicUrl;
};

// Categories
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .order('name');
  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
  return data;
};

// Drop Settings (Admin kezelőfelülethez)
export const getFullDropSettings = async () => {
  const { data, error } = await supabase
    .from('drop_settings')
    .select('*')
    .order('start_time', { ascending: false });
  if (error) {
    console.error('Error fetching full drop settings:', error);
    return [];
  }
  return data;
};

export const createDropSetting = async (dropData: any) => {
  const { data, error } = await supabase.from('drop_settings').insert([dropData]).select();
  return { data, error };
};

export const updateDropSetting = async (id: string, dropData: any) => { // id UUID
  const { data, error } = await supabase.from('drop_settings').update(dropData).eq('id', id).select();
  return { data, error };
};

// Drops (legördülő menükhöz, pl. termék szerkesztőben)
export const getDrops = async () => {
  const { data, error } = await supabase
    .from('drop_settings')
    .select('id, name')
    .order('name');
  if (error) {
    console.error('Error fetching drops:', error);
    return [];
  }
  return data;
};

// Akciós termékek lekérése (homepage gridhez)
export async function getSaleProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      sale_price,
      image_urls,
      categories(name),
      gender,
      condition,
      size,
      is_active
    `)
    .eq('is_active', true)
    .not('sale_price', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Hiba az akciós termékek lekérésekor:', error);
    throw error;
  }

  const filteredData = data.filter(product => {
    const productPrice = parseFloat(product.price);
    const productSalePrice = parseFloat(product.sale_price);
    
    return !isNaN(productPrice) && !isNaN(productSalePrice) && productSalePrice < productPrice;
  });

  return filteredData;
}

// Aktuális Drop termékek lekérése (homepage gridhez)
export async function getActiveDropProducts() {
  const { data: activeDrop, error: activeDropError } = await supabase
    .from('drop_settings')
    .select('id, name, start_time, end_time, is_active')
    .eq('is_active', true)
    .maybeSingle();

  if (activeDropError || !activeDrop) {
    if (activeDropError) console.error('Error fetching active drop settings:', activeDropError);
    return [];
  }

  const now = new Date();
  const dropStartTime = new Date(activeDrop.start_time);
  const dropEndTime = new Date(activeDrop.end_time);

  if (activeDrop.is_active && now >= dropStartTime && now <= dropEndTime) {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, sale_price, image_urls, categories(name), gender, condition, size, drop_id')
      .eq('is_active', true)
      .eq('drop_id', activeDrop.id)
      .order('created_at', { ascending: false });

    if (productsError) {
      console.error('Hiba az aktív drop termékek lekérésekor:', productsError);
      throw productsError;
    }
    return products;
  } else {
    return [];
  }
}

// Aktuálisan aktív drop esemény beállításainak lekérése (DropTimer-hez)
export async function getCurrentlyActiveDropSettings(): Promise<ActiveDropSettings | null> {
  const { data, error } = await supabase
    .from('drop_settings')
    .select('id, name, start_time, end_time, is_active')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching currently active drop settings (from DB):', error);
    return null;
  }

  return data;
}

// === Rendelés API függvények (ÚJ) ===
// getOrders mostantól a 'orders_with_profile_data' nézetet fogja lekérdezni
export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders_with_profile_data') // <-- NÉZET LEKÉRDEZÉSE ITT
    // JAVÍTÁS ITT: A select stringet egy sorba tesszük, vagy trim-eljük
    .select('id,created_at,order_status,payment_status,total_amount,pickup_point,user_id,profile_username,profile_full_name')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
  // Mapping a visszaadott adatot a Order interfésznek megfelelően
  const mappedData = data.map(order => ({
    ...order,
    // A profil adatok már direktben jönnek a nézetből: profile_username, profile_full_name
    // De ha az Order interface-ed profiles: {username, fullName} struktúrát vár,
    // akkor itt kellene átalakítani. Jelenleg direkt property-ket vár.
  }));
  return mappedData as Order[];
};

// getOrderById is a view-t fogja lekérdezni az alap adatokért
// A termék részleteket és a profil adatokat továbbra is külön kezeljük
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const { data: orderData, error: orderError } = await supabase
    .from('orders_with_profile_data') // <-- NÉZET LEKÉRDEZÉSE ITT
    // JAVÍTÁS ITT: A select stringet egy sorba tesszük, vagy trim-eljük
    .select('*,profile_username,profile_full_name') // Lekérjük az összes mezőt a nézetből
    .eq('id', orderId)
    .single();

  if (orderError) {
    console.error(`Error fetching order ${orderId}:`, orderError);
    return null;
  }

  // A nézetből jövő adatok már tartalmazzák a profile_username, profile_full_name mezőket
  const orderResult = orderData as Order;

  // Ha a rendelés létezik, és vannak benne tételek, lekérjük a termékadatokat
  if (orderResult && orderResult.items && orderResult.items.length > 0) {
    const productIds = orderResult.items.map((item: OrderItemRaw) => item.product_id);

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, sale_price, image_urls')
      .in('id', productIds);

    if (productsError) {
      console.error('Error fetching products for order items:', productsError);
      return orderResult;
    }

    orderResult.items = orderResult.items.map((item: OrderItemRaw) => {
      const productDetails = productsData?.find(p => p.id === item.product_id);
      return {
        ...item,
        product_name: productDetails?.name,
        product_image_url: productDetails?.image_urls?.[0], // Első kép URL-je
        product_price: productDetails?.sale_price || productDetails?.price, // Akciós ár, ha van
      };
    });
  }

  return orderResult;
};

export const updateOrder = async (orderId: string, updateData: Partial<Order>) => { // Partial<Order> mert csak részleges update
  const { data, error } = await supabase
    .from('orders') // Itt továbbra is az 'orders' táblát frissítjük, nem a nézetet!
    .update(updateData)
    .eq('id', orderId)
    .select();

  if (error) {
    console.error(`Error updating order ${orderId}:`, error);
  }
  return { data, error };
};

export const deleteOrder = async (orderId: string) => {
  const { error } = await supabase
    .from('orders') // Itt továbbra is az 'orders' táblát töröljük, nem a nézetet!
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error(`Error deleting order ${orderId}:`, error);
  }
  return { error };
};


// Profiles
export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('No user logged in');
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`*`)
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
  }
  return data;
};

export const updateProfile = async (updates: any) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('profiles').upsert({ id: user.id, ...updates });
  return { data, error };
};
// === Rendelés API függvények (ÚJ) ===

// Itt az Order interface-ed van definiálva a fájl elején.
// Létrehoztunk egy új függvényt a rendelés leadásához.
export const placeOrder = async (orderData: Order): Promise<{ data: Order | null; error: any }> => {
    const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single(); // Feltételezzük, hogy egy rendelést szúrunk be

    if (error) {
        console.error('Error placing order:', error);
    }
    return { data, error };
};
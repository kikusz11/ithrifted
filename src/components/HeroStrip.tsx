import { useEffect, useState } from 'react';
import logo from '../assets/logo.png'; // Ellenőrizd, hogy az elérési út helyes-e!

// Mock Supabase client for demonstration
const supabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      not: (column: string, operator: string, value: any) => ({
        order: (column: string, options: any) => ({
          limit: (count: number) => ({
            then: (callback: (result: any) => void) => {
              // Mock data for demonstration
              const mockData = [
                { id: '1', name: 'Drill Team Varsity Jacket', slug: 'drill-team-varsity', image_url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400' },
                { id: '2', name: 'Supreme Vanson Leathers GORE-TEX Shell', slug: 'vanson-shell', image_url: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5e?w=400' },
                { id: '3', name: 'Leather Blazer', slug: 'leather-blazer', image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400' },
                { id: '4', name: 'Reflective Arc Hooded Work Jacket', slug: 'reflective-arc', image_url: 'https://images.unsplash.com/photo-1566479179817-40c2b74c2066?w=400' },
                { id: '5', name: 'Zip-Off Sleeve Quilted Bomber', slug: 'quilted-bomber', image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400' },
                { id: '6', name: 'Spellout Track Jacket', slug: 'spellout-track', image_url: 'https://images.unsplash.com/photo-1556821840-3a9c6bdb8f4c?w=400' },
                { id: '7', name: 'Flannel Pajama Shirt', slug: 'flannel-pajama', image_url: 'https://images.unsplash.com/photo-1622445275033-540d4199a1a6?w=400' },
                { id: '8', name: 'Small Box Denim Shirt', slug: 'denim-shirt', image_url: 'https://images.unsplash.com/photo-1603252109303-2751441b3d86?w=400' },
                { id: '9', name: 'Target Sweater', slug: 'target-sweater', image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400' },
                { id: '10', name: 'Multi Logos Hooded Sweatshirt', slug: 'multi-logos-hoodie', image_url: 'https://images.unsplash.com/photo-1556821840-3a9c6bdb8f4c?w=400' },
                { id: '11', name: 'Small Box Hoodie', slug: 'small-box-hoodie', image_url: 'https://images.unsplash.com/photo-1620799140753-c45a00f39b70?w=400' },
                { id: '12', name: 'Bones Football Jersey', slug: 'bones-jersey', image_url: 'https://images.unsplash.com/photo-1583743814966-8936f37f299e?w=400' },
                { id: '13', name: 'King Tut S/S Top', slug: 'king-tut-top', image_url: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400' },
                { id: '14', name: 'Stripe Rugby', slug: 'stripe-rugby', image_url: 'https://images.unsplash.com/photo-1602810316498-ab67cf68c8e1?w=400' },
                { id: '15', name: 'Small Box Tee', slug: 'small-box-tee', image_url: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400' },
                { id: '16', name: 'Playboi Carti Tee', slug: 'playboi-carti-tee', image_url: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=400' },
                { id: '17', name: 'Baggy Selvedge Jean', slug: 'baggy-jean', image_url: 'https://images.unsplash.com/photo-1565084888279-aca607ecce0c?w=400' },
                { id: '18', name: 'Chino Pant', slug: 'chino-pant', image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400' },
                { id: '19', name: 'Overdyed Camp Cap', slug: 'camp-cap', image_url: 'https://images.unsplash.com/photo-1588117472013-59bb13edafec?w=400' },
                { id: '20', name: 'Denim Backpack', slug: 'denim-backpack', image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' }
              ];
              
              setTimeout(() => {
                callback({ data: mockData, error: null });
              }, 500);
            }
          })
        })
      })
    })
  })
};

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string;
}

const HeroStrips = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchLatestProducts = async () => {
      setLoading(true);
      
      supabase
        .from('products')
        .select('id, name, slug, image_url')
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(25)
        .then(({ data, error }) => {
          if (error) {
            // Error logging removed as requested.
          } else if (data) {
            setProducts(data);
          }
          setLoading(false);
        });
    };

    fetchLatestProducts();
  }, []);


  const handleProductClick = (productId: string) => {
    // In a real app, this would use React Router navigation
    console.log(`Navigate to /product/${productId}`);
    // For demo purposes, we'll just show an alert
    alert(`Would navigate to product ${productId}`);
  };

if (loading) {
  return (
    <div className="relative w-250 m-auto h-96 bg-gray-50 flex items-center justify-center">
      {/* A logó képe kapja meg a pörgő animációt */}
      <img 
        src={logo} 
        alt="Betöltés... i_thrifted_ logo" 
        className="w-24 h-24 animate-spin" // Állítsd be a neked tetsző méretet
      />
    </div>
  );
}

  if (products.length === 0) {
    return (
      <div className="relative w-full h-96 overflow-hidden bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Nincsenek aktuális termékek.</p>
        {/* Supreme logo overlay */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-blue text-white px-8 py-3 font-bold text-2xl tracking-wider shadow-lg">
            i_thrifted_
          </div>
        </div>
      </div>
    );
  }

return (
    // Fő konténer: középre igazítva, fix max szélességgel
    <div className="relative max-w-7xl mx-auto my-8 h-96 bg-gray-50">
      
      {/* Görgethető sáv a képeknek */}
      {/* Az overflow-x-auto bekapcsolja a vízszintes görgetést, ha a tartalom kilóg */}
      {/* A 'overflow-y-hidden' letiltja a függőleges görgetést */}
<div className="absolute inset-0 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
        {/* Belső konténer, ami elég széles, hogy a görgetés működjön */}
        <div className="flex h-full w-max">
          {products.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="flex-shrink-0 relative group"
              style={{ width: '60px' }}
            >
              <div
  onClick={() => handleProductClick(product.id)}
  title={product.name}
  aria-label={product.name}
  className="block w-full h-full relative overflow-hidden cursor-pointer"
>
  {/* A Termék kép háttér kapja meg a group-hover:scale-110 effektet */}
  <div 
    className="w-full h-full bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110"
    style={{ 
      backgroundImage: `url(${product.image_url})`,
    }}
  />
                
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 group-hover:to-black/40 transition-all duration-200" />
                
                {/* New tag */}
                <span className="absolute top-1 left-1 bg-white text-black text-xs font-semibold px-1 py-0.5 rounded text-[10px] opacity-80">
                  new
                </span>
                
                {/* Product name tooltip */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 pointer-events-none max-w-[200px] truncate">
                  {product.name}
                </div>
                
                {/* Shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              </div>
            </div>
          ))}
        </div>
      </div>
      

      
      {/* Date/time info (változatlan) */}
      <div className="absolute top-6 right-6 text-gray-600 text-sm font-mono z-20 bg-white/80 px-2 py-1 rounded">
        03/09/2025 02:51pm LDN
      </div>
      
      {/* Navigation buttons (változatlan) */}
      <div className="absolute bottom-6 left-6 flex space-x-4 text-sm font-semibold z-20">
        <button 
          onClick={() => console.log('Navigate to /shop')}
          className="text-gray-800 hover:text-black transition-colors bg-white/80 px-3 py-1 rounded cursor-pointer"
        >
          shop
        </button>

      </div>
      
      {/* Right side info (változatlan) */}
      <div className="absolute bottom-6 right-6 text-sm text-gray-700 z-20 bg-white/80 px-2 py-1 rounded">
        hu • piac drop/winter 2025
      </div>
    </div>
  );
};

export default HeroStrips;
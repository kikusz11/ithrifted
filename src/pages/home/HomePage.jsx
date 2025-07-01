import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/ProductCard';
import DropTimer from '../../components/DropTimer'; // Fontos, hogy ez a komponens létezzen!
import { getProducts, getSaleProducts, getActiveDropProducts, getCurrentlyActiveDropSettings } from '../../lib/api'; // Új API függvény importálva
import { Link } from 'react-router-dom';

const Home = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [dropProducts, setDropProducts] = useState([]);
  const [activeDropSettings, setActiveDropSettings] = useState(null); // Aktív drop beállításai
  const [shopStatus, setShopStatus] = useState('loading'); // 'loading', 'closed', 'opening_soon', 'open'

  const [loadingAll, setLoadingAll] = useState(true);
  const [loadingSale, setLoadingSale] = useState(true);
  const [loadingDrop, setLoadingDrop] = useState(true);

  const [errorAll, setErrorAll] = useState(null);
  const [errorSale, setErrorSale] = useState(null);
  const [errorDrop, setErrorDrop] = useState(null);
  const [errorDropSettings, setErrorDropSettings] = useState(null); // Hiba a drop beállításoknál

  // === Adatlekérés a termékekhez ===

  // Összes aktív termék lekérése (ha továbbra is szükséged van egy általános terméklistára)
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const data = await getProducts({ isActive: true });
        setAllProducts(data);
      } catch (err) {
        setErrorAll('Hiba az összes termék betöltésekor.');
        console.error(err);
      } finally {
        setLoadingAll(false);
      }
    };
    fetchAllProducts();
  }, []);

  // Akciós termékek lekérése
  useEffect(() => {
    const fetchSaleProducts = async () => {
      try {
        const data = await getSaleProducts();
        setSaleProducts(data);
      } catch (err) {
        setErrorSale('Hiba az akciós termékek betöltésekor.');
        console.error(err);
      } finally {
        setLoadingSale(false);
      }
    };
    fetchSaleProducts();
  }, []);

  // Aktuális Drop termékek lekérése
  useEffect(() => {
    const fetchDropProducts = async () => {
      try {
        const data = await getActiveDropProducts();
        setDropProducts(data);
      } catch (err) {
        setErrorDrop('Hiba az új drop termékek betöltésekor.');
        console.error(err);
      } finally {
        setLoadingDrop(false);
      }
    };
    fetchDropProducts();
  }, []);

  // === Drop esemény állapotának kezelése ===
  useEffect(() => {
    const checkDropStatus = async () => {
      try {
        const settings = await getCurrentlyActiveDropSettings();
        setActiveDropSettings(settings);

        const now = new Date();
        if (!settings || !settings.is_active) {
          setShopStatus('closed'); // Nincs aktív drop
        } else {
          const startTime = new Date(settings.start_time);
          const endTime = new Date(settings.end_time);

          if (now < startTime) {
            setShopStatus('opening_soon'); // Még nem kezdődött el
          } else if (now >= startTime && now <= endTime) {
            setShopStatus('open'); // Aktív drop
          } else {
            setShopStatus('closed'); // Drop lejárt
          }
        }
      } catch (err) {
        setErrorDropSettings('Hiba a drop esemény beállításainak lekérésekor.');
        setShopStatus('closed'); // Hiba esetén zárva
        console.error(err);
      }
    };

    // Futtatjuk azonnal, majd percenként ellenőrizzük
    checkDropStatus();
    const interval = setInterval(checkDropStatus, 60 * 1000); // Ellenőrzés percenként

    return () => clearInterval(interval); // Tisztítás a komponens lecsatolásakor
  }, []);


  // === Segédfüggvény a termékgrid rendereléséhez ===
  const renderProductGrid = (products, title, isLoading, error) => {
    if (isLoading) {
      return <p className="text-center p-4">Betöltés: {title}...</p>;
    }
    if (error) {
      return <p className="text-center p-4 text-red-500">Hiba: {title} termékek betöltésekor. {error}</p>;
    }
    if (!products || products.length === 0) {
      return <p className="text-center p-4">Nincsenek elérhető {title.toLowerCase()} termékek.</p>;
    }

    return (
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 text-center">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <Link to={`/product/${product.id}`} key={product.id} className="block border rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                <ProductCard product={product} />
            </Link>
          ))}
        </div>
      </section>
    );
  };


  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-4xl font-extrabold text-center mb-10">Üdvözöljük az iTrifted-en!</h1>

      {errorDropSettings && <p className="text-center p-4 text-red-500">{errorDropSettings}</p>}

      {shopStatus === 'loading' && (
        <p className="text-center p-4">Bolt állapotának ellenőrzése...</p>
      )}

      {shopStatus === 'closed' && (
        <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="text-xl font-semibold mb-2">A bolt jelenleg zárva van.</p>
          <p>Kérjük, térjen vissza egy későbbi időpontban!</p>
        </div>
      )}

      {shopStatus === 'opening_soon' && activeDropSettings && (
        <div className="text-center p-8 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
          <p className="text-xl font-semibold mb-4">A bolt hamarosan nyit!</p>
          <p className="mb-2">Következő drop esemény: **{activeDropSettings.name}**</p>
          <p className="mb-4">Nyitás: {new Date(activeDropSettings.start_time).toLocaleString()}</p>
          {/* DropTimer komponens a visszaszámláláshoz */}
          <DropTimer targetDate={activeDropSettings.start_time} />
        </div>
      )}

      {shopStatus === 'open' && (
        <>
          {/* Drop Timer - Ez valószínűleg a fő drop esemény visszaszámlálója, ha már nyitva van és a végéig számol */}
          {activeDropSettings && <DropTimer targetDate={activeDropSettings.end_time} showClosing={true} />}

          {/* Új Drop Termékek grid */}
          {renderProductGrid(dropProducts, 'Legújabb Drop', loadingDrop, errorDrop)}

                    {/* Akciós Ruhák grid */}
          {renderProductGrid(saleProducts, 'Akciós Ruhák', loadingSale, errorSale)}

          {/* Itt lehet egy általános "összes termék" grid is, ha az Akciós és Drop termékek mellett is akarsz ilyet */}
          {/* <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Összes Termék</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {loadingAll ? (
                <p className="text-center col-span-full">Termékek betöltése...</p>
              ) : errorAll ? (
                <p className="text-center col-span-full text-red-500">{errorAll}</p>
              ) : allProducts.length === 0 ? (
                <p className="text-center col-span-full">Nincsenek még termékek.</p>
              ) : (
                allProducts.map(product => (
                  <Link to={`/product/${product.id}`} key={product.id} className="block border rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <ProductCard product={product} />
                  </Link>
                ))
              )}
            </div>
          </section> */}
        </>
      )}
    </div>
  );
};

export default Home;
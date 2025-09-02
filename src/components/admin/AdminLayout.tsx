import Sidebar from './Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // A háttér mostantól sötét, és a gyerek komponensre bízzuk a stílusozást
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-grow">
        {/* A padding-et kivesszük innen, hogy a dashboard oldal teljes szélességű lehessen */}
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
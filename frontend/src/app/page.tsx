import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Welcome to Qrosity</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/Ecom" 
            className="p-6 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">E-Commerce</h2>
            <p className="text-gray-600">Manage your e-commerce operations</p>
          </Link>

          <Link 
            href="/Crm" 
            className="p-6 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">CRM</h2>
            <p className="text-gray-600">Customer Relationship Management</p>
          </Link>

          <Link 
            href="/Masters" 
            className="p-6 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">Masters</h2>
            <p className="text-gray-600">Manage master data and configurations</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

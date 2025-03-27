import React from 'react';
import Link from 'next/link';

export default function EcomPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">E-Commerce Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/Ecom/products" className="p-6 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Products</h2>
          <p className="text-gray-600">Manage your products catalog</p>
        </Link>

        <Link href="/Ecom/orders" className="p-6 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Orders</h2>
          <p className="text-gray-600">View and manage orders</p>
        </Link>

        <Link href="/Ecom/customers" className="p-6 bg-white shadow-sm rounded-lg hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Customers</h2>
          <p className="text-gray-600">Manage customer information</p>
        </Link>
      </div>
    </div>
  );
}

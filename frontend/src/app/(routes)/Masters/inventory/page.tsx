'use client';

import PageTitle from '@/app/components/PageTitle';

export default function InventoryPage() {
  return (
    <div className="space-y-4">
      <PageTitle 
        titleKey="pages.masters.inventory.title" 
        descriptionKey="pages.masters.inventory.description"
      />
      <div className="bg-white shadow-sm rounded-lg p-6">
        <p>Inventory management will go here</p>
      </div>
    </div>
  );
}
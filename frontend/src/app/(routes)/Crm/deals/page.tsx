'use client';

import PageTitle from '@/app/components/PageTitle';

export default function DealsPage() {
  return (
    <div className="space-y-4">
      <PageTitle 
        titleKey="pages.crm.deals.title" 
        descriptionKey="pages.crm.deals.description"
      />
      <div className="bg-white shadow-sm rounded-lg p-6">
        <p>Deals list and management will go here</p>
      </div>
    </div>
  );
}

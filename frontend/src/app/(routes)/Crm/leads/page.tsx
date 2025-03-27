'use client';

import PageTitle from '@/app/components/PageTitle';

export default function LeadsPage() {
  return (
    <div className="space-y-4">
      <PageTitle 
        titleKey="pages.crm.leads.title" 
        descriptionKey="pages.crm.leads.description"
      />
      <div className="bg-white shadow-sm rounded-lg p-6">
        <p>Leads list and management will go here</p>
      </div>
    </div>
  );
}

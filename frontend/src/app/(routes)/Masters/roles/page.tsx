'use client';

import PageTitle from '@/app/components/PageTitle';

export default function RolesPage() {
  return (
    <div className="space-y-4">
      <PageTitle 
        titleKey="pages.masters.roles.title" 
        descriptionKey="pages.masters.roles.description"
      />
      <div className="bg-white shadow-sm rounded-lg p-6">
        <p>Roles management will go here</p>
      </div>
    </div>
  );
}
'use client';

import PageTitle from '@/app/components/PageTitle';

export default function ContactsPage() {
  return (
    <div className="space-y-4">
      <PageTitle 
        titleKey="pages.crm.contacts.title" 
        descriptionKey="pages.crm.contacts.description"
      />
      <div className="bg-white shadow-sm rounded-lg p-6">
        <p>Contacts list and management will go here</p>
      </div>
    </div>
  );
}

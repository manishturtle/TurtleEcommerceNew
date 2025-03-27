'use client';

import React from 'react';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { getTranslation } from '@/app/i18n/languageUtils';

interface PageTitleProps {
  titleKey?: string;
  descriptionKey?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageTitle({ titleKey, descriptionKey, title, description, children }: PageTitleProps) {
  const { currentLanguage } = useLanguage();
  
  // Function to translate text
  const t = (key: string) => getTranslation(key, currentLanguage);
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{title || (titleKey ? t(titleKey) : '')}</h1>
      {(description || descriptionKey) && (
        <p className="text-gray-600">{description || (descriptionKey ? t(descriptionKey) : '')}</p>
      )}
      {children}
    </div>
  );
}

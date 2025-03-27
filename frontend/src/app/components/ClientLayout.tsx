'use client';

import AppLayout from './AppLayout';
import { ThemeProvider } from '../theme/ThemeContext';
import { LanguageProvider } from '../i18n/LanguageContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n/i18n-config';
import { QueryProvider } from './providers/QueryProvider';
import { AuthProvider } from '../contexts/AuthContext';
import dynamic from 'next/dynamic';

// Dynamically import AccessibilityChecker to avoid including it in production
const AccessibilityChecker = dynamic(
  () => import('./providers/AccessibilityChecker'),
  { ssr: false }
);

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ThemeProvider>
          <I18nextProvider i18n={i18n}>
            <LanguageProvider>
              {/* Only include AccessibilityChecker in development */}
              {process.env.NODE_ENV === 'development' && <AccessibilityChecker />}
              <AppLayout>{children}</AppLayout>
            </LanguageProvider>
          </I18nextProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryProvider>
  );
}

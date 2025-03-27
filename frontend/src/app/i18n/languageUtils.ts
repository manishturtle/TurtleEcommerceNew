// A simplified language utility to replace i18next until packages are installed

// Available languages
export const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' }
];

// Translation data
const translations: Record<string, Record<string, any>> = {
  en: {
    app: {
      title: 'Qrosity',
      menu: {
        profile: 'Profile',
        settings: 'Settings',
        logout: 'Logout'
      },
      theme: {
        light: 'Light Mode',
        dark: 'Dark Mode',
        colors: 'Theme Colors'
      },
      search: 'Search menu...'
    },
    languages: {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      hi: 'Hindi',
      ar: 'Arabic'
    },
    sidenav: {
      crm: 'CRM',
      masters: 'Masters',
      items: {
        contacts: 'Contacts',
        deals: 'Deals',
        leads: 'Leads',
        roles: 'Roles',
        inventory: 'Inventory'
      }
    },
    pages: {
      crm: {
        contacts: {
          title: 'Contacts',
          description: 'Manage your contacts'
        },
        deals: {
          title: 'Deals',
          description: 'Track your deals'
        },
        leads: {
          title: 'Leads',
          description: 'Manage your leads'
        }
      },
      masters: {
        roles: {
          title: 'Roles',
          description: 'Manage user roles'
        },
        inventory: {
          title: 'Inventory',
          description: 'Manage your inventory'
        }
      }
    }
  },
  es: {
    app: {
      title: 'Qrosity',
      menu: {
        profile: 'Perfil',
        settings: 'Configuración',
        logout: 'Cerrar sesión'
      },
      theme: {
        light: 'Modo Claro',
        dark: 'Modo Oscuro',
        colors: 'Colores de Tema'
      },
      search: 'Buscar menú...'
    },
    languages: {
      en: 'Inglés',
      es: 'Español',
      fr: 'Francés',
      de: 'Alemán',
      hi: 'Hindi',
      ar: 'Árabe'
    },
    sidenav: {
      crm: 'CRM',
      masters: 'Maestros',
      items: {
        contacts: 'Contactos',
        deals: 'Negocios',
        leads: 'Clientes Potenciales',
        roles: 'Roles',
        inventory: 'Inventario'
      }
    },
    pages: {
      crm: {
        contacts: {
          title: 'Contactos',
          description: 'Administra tus contactos'
        },
        deals: {
          title: 'Negocios',
          description: 'Seguimiento de tus negocios'
        },
        leads: {
          title: 'Clientes Potenciales',
          description: 'Administra tus clientes potenciales'
        }
      },
      masters: {
        roles: {
          title: 'Roles',
          description: 'Administrar roles de usuario'
        },
        inventory: {
          title: 'Inventario',
          description: 'Administra tu inventario'
        }
      }
    }
  },
  fr: {
    app: {
      title: 'Qrosity',
      menu: {
        profile: 'Profil',
        settings: 'Paramètres',
        logout: 'Déconnexion'
      },
      theme: {
        light: 'Mode Clair',
        dark: 'Mode Sombre',
        colors: 'Couleurs du Thème'
      },
      search: 'Rechercher dans le menu...'
    },
    languages: {
      en: 'Anglais',
      es: 'Espagnol',
      fr: 'Français',
      de: 'Allemand',
      hi: 'Hindi',
      ar: 'Arabe'
    },
    sidenav: {
      crm: 'CRM',
      masters: 'Maîtres',
      items: {
        contacts: 'Contacts',
        deals: 'Affaires',
        leads: 'Prospects',
        roles: 'Rôles',
        inventory: 'Inventaire'
      }
    },
    pages: {
      crm: {
        contacts: {
          title: 'Contacts',
          description: 'Gérer vos contacts'
        },
        deals: {
          title: 'Affaires',
          description: 'Suivre vos affaires'
        },
        leads: {
          title: 'Prospects',
          description: 'Gérer vos prospects'
        }
      },
      masters: {
        roles: {
          title: 'Rôles',
          description: 'Gérer les rôles des utilisateurs'
        },
        inventory: {
          title: 'Inventaire',
          description: 'Gérer votre inventaire'
        }
      }
    }
  },
  de: {
    app: {
      title: 'Qrosity',
      menu: {
        profile: 'Profil',
        settings: 'Einstellungen',
        logout: 'Abmelden'
      },
      theme: {
        light: 'Heller Modus',
        dark: 'Dunkler Modus',
        colors: 'Themenfarben'
      },
      search: 'Menü durchsuchen...'
    },
    languages: {
      en: 'Englisch',
      es: 'Spanisch',
      fr: 'Französisch',
      de: 'Deutsch',
      hi: 'Hindi',
      ar: 'Arabisch'
    },
    sidenav: {
      crm: 'CRM',
      masters: 'Stammdaten',
      items: {
        contacts: 'Kontakte',
        deals: 'Geschäfte',
        leads: 'Leads',
        roles: 'Rollen',
        inventory: 'Inventar'
      }
    },
    pages: {
      crm: {
        contacts: {
          title: 'Kontakte',
          description: 'Verwalten Sie Ihre Kontakte'
        },
        deals: {
          title: 'Geschäfte',
          description: 'Verfolgen Sie Ihre Geschäfte'
        },
        leads: {
          title: 'Leads',
          description: 'Verwalten Sie Ihre Leads'
        }
      },
      masters: {
        roles: {
          title: 'Rollen',
          description: 'Benutzerrollen verwalten'
        },
        inventory: {
          title: 'Inventar',
          description: 'Verwalten Sie Ihr Inventar'
        }
      }
    }
  },
  hi: {
    app: {
      title: 'क्रोसिटी',
      menu: {
        profile: 'प्रोफाइल',
        settings: 'सेटिंग्स',
        logout: 'लॉगआउट'
      },
      theme: {
        light: 'लाइट मोड',
        dark: 'डार्क मोड',
        colors: 'थीम रंग'
      },
      search: 'मेनू खोजें...'
    },
    languages: {
      en: 'अंग्रेज़ी',
      es: 'स्पेनिश',
      fr: 'फ्रेंच',
      de: 'जर्मन',
      hi: 'हिंदी',
      ar: 'अरबी'
    },
    sidenav: {
      crm: 'सीआरएम',
      masters: 'मास्टर्स',
      items: {
        contacts: 'संपर्क',
        deals: 'डील्स',
        leads: 'लीड्स',
        roles: 'भूमिकाएँ',
        inventory: 'इन्वेंटरी'
      }
    },
    pages: {
      crm: {
        contacts: {
          title: 'संपर्क',
          description: 'अपने संपर्कों का प्रबंधन करें'
        },
        deals: {
          title: 'डील्स',
          description: 'अपनी डील्स का ट्रैक करें'
        },
        leads: {
          title: 'लीड्स',
          description: 'अपने लीड्स का प्रबंधन करें'
        }
      },
      masters: {
        roles: {
          title: 'भूमिकाएँ',
          description: 'उपयोगकर्ता भूमिकाओं का प्रबंधन करें'
        },
        inventory: {
          title: 'इन्वेंटरी',
          description: 'अपनी इन्वेंटरी का प्रबंधन करें'
        }
      }
    }
  },
  ar: {
    app: {
      title: 'كروسيتي',
      menu: {
        profile: 'الملف الشخصي',
        settings: 'الإعدادات',
        logout: 'تسجيل الخروج'
      },
      theme: {
        light: 'الوضع الفاتح',
        dark: 'الوضع الداكن',
        colors: 'ألوان السمة'
      },
      search: 'البحث في القائمة...'
    },
    languages: {
      en: 'الإنجليزية',
      es: 'الإسبانية',
      fr: 'الفرنسية',
      de: 'الألمانية',
      hi: 'الهندية',
      ar: 'العربية'
    },
    sidenav: {
      crm: 'إدارة علاقات العملاء',
      masters: 'الإدارة الرئيسية',
      items: {
        contacts: 'جهات الاتصال',
        deals: 'الصفقات',
        leads: 'العملاء المحتملين',
        roles: 'الأدوار',
        inventory: 'المخزون'
      }
    },
    pages: {
      crm: {
        contacts: {
          title: 'جهات الاتصال',
          description: 'إدارة جهات الاتصال الخاصة بك'
        },
        deals: {
          title: 'الصفقات',
          description: 'تتبع صفقاتك'
        },
        leads: {
          title: 'العملاء المحتملين',
          description: 'إدارة العملاء المحتملين'
        }
      },
      masters: {
        roles: {
          title: 'الأدوار',
          description: 'إدارة أدوار المستخدمين'
        },
        inventory: {
          title: 'المخزون',
          description: 'إدارة المخزون الخاص بك'
        }
      }
    }
  }
};

// Get translation for a key
export function getTranslation(key: string, language?: string): string {
  const currentLang = language || getCurrentLanguage();
  
  // Split the key by dots to navigate the nested object
  const keys = key.split('.');
  let result = translations[currentLang];
  
  // Navigate through the nested object
  for (const k of keys) {
    if (result && result[k]) {
      result = result[k];
    } else {
      // If translation not found, return the key
      return key;
    }
  }
  
  return typeof result === 'string' ? result : key;
}

// Get current language from localStorage or browser
export function getCurrentLanguage(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('appLanguage') || 
           navigator.language.split('-')[0] || 
           'en';
  }
  return 'en';
}

// Set language
export function setLanguage(lang: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('appLanguage', lang);
    // Force a reload to apply the language change
    window.location.reload();
  }
}

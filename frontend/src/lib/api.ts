import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1/',
  withCredentials: false, // For HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a function to set the auth token (to be called from components)
export const setAuthToken = (token: string | null) => {
  if (token) {
    // api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Auth token set (currently disabled):', token);
  } else {
    // delete api.defaults.headers.common['Authorization'];
    console.log('Auth token removed (currently disabled)');
  }
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      // You might want to redirect to login or refresh token here
      console.error('Unauthorized access (auth currently disabled):', error.response.data);
    }
    return Promise.reject(error);
  }
);

// Export common API endpoints
export interface ApiEndpoints {
  auth: {
    login: string;
    logout: string;
    me: string;
  };
  users: {
    list: string;
    detail: (id: string) => string;
  };
  products: {
    list: string;
    detail: (id: string) => string;
    categories: string;
  };
  catalogue: {
    divisions: {
      list: string;
      detail: (id: number) => string;
    };
    categories: {
      list: string;
      detail: (id: number) => string;
    };
    subcategories: {
      list: string;
      detail: (id: number) => string;
    };
    unitOfMeasures: {
      list: string;
      detail: (id: number) => string;
    };
    productStatuses: {
      list: string;
      detail: (id: number) => string;
    };
  };
  pricing: {
    customerGroups: {
      list: string;
      detail: (id: number) => string;
    };
    sellingChannels: {
      list: string;
      detail: (id: number) => string;
    };
    taxRegions: {
      list: string;
      detail: (id: number) => string;
    };
    taxRates: {
      list: string;
      detail: (id: number) => string;
    };
    taxRateProfiles: {
      list: string;
      detail: (id: number) => string;
    };
    countries: {
      list: string;
    };
  };
  attributes: {
    attributeGroups: {
      list: string;
      detail: (id: number) => string;
    };
    attributes: {
      list: string;
      detail: (id: number) => string;
    };
    attributeOptions: {
      list: string;
      detail: (id: number) => string;
      byAttribute: (attributeId: number) => string;
    };
  };
  settings: {
    tenant: (tenantId: number) => string;
  };
}

export const apiEndpoints: ApiEndpoints = {
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
    me: '/auth/me/',
  },
  users: {
    list: '/users/',
    detail: (id: string) => `/users/${id}/`,
  },
  products: {
    list: '/products/',
    detail: (id: string) => `/products/${id}/`,
    categories: '/product-categories/',
  },
  catalogue: {
    divisions: {
      list: '/products/catalogue/divisions/',
      detail: (id: number) => `/products/catalogue/divisions/${id}/`,
    },
    categories: {
      list: '/products/catalogue/categories/',
      detail: (id: number) => `/products/catalogue/categories/${id}/`,
    },
    subcategories: {
      list: '/products/catalogue/subcategories/',
      detail: (id: number) => `/products/catalogue/subcategories/${id}/`,
    },
    unitOfMeasures: {
      list: '/products/catalogue/unit-of-measures/',
      detail: (id: number) => `/products/catalogue/unit-of-measures/${id}/`,
    },
    productStatuses: {
      list: '/products/catalogue/product-statuses/',
      detail: (id: number) => `/products/catalogue/product-statuses/${id}/`,
    },
  },
  pricing: {
    customerGroups: {
      list: '/pricing/customer-groups/',
      detail: (id: number) => `/pricing/customer-groups/${id}/`,
    },
    sellingChannels: {
      list: '/pricing/selling-channels/',
      detail: (id: number) => `/pricing/selling-channels/${id}/`,
    },
    taxRegions: {
      list: '/pricing/tax-regions/',
      detail: (id: number) => `/pricing/tax-regions/${id}/`,
    },
    taxRates: {
      list: '/pricing/tax-rates/',
      detail: (id: number) => `/pricing/tax-rates/${id}/`,
    },
    taxRateProfiles: {
      list: '/pricing/tax-rate-profiles/',
      detail: (id: number) => `/pricing/tax-rate-profiles/${id}/`,
    },
    countries: {
      list: '/pricing/countries/',
    },
  },
  attributes: {
    attributeGroups: {
      list: '/products/attributes/groups/',
      detail: (id: number) => `/products/attributes/groups/${id}/`,
    },
    attributes: {
      list: '/products/attributes/',
      detail: (id: number) => `/products/attributes/${id}/`,
    },
    attributeOptions: {
      list: '/products/attributes/options/',
      detail: (id: number) => `/products/attributes/options/${id}/`,
      byAttribute: (attributeId: number) => `/products/attributes/${attributeId}/options/`,
    },
  },
  settings: {
    tenant: (tenantId: number) => `/settings/tenant/${tenantId}/`,
  },
};

export default api;

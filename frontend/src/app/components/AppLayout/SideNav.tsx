'use client';

import { useState, useMemo } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  styled,
  useTheme,
  Box,
  ListItemButton,
  TextField,
  InputAdornment,
  Tooltip,
  Divider,
  alpha,
} from '@mui/material';
import {
  ContactsOutlined,
  BusinessCenterOutlined,
  AssignmentOutlined,
  PeopleOutlineOutlined,
  SettingsOutlined,
  AdminPanelSettingsOutlined,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
  Search as SearchIcon,
  Dashboard,
  CategoryOutlined,
  InventoryOutlined,
  ListAltOutlined,
  StraightenOutlined,
  LabelOutlined,
  StyleOutlined,
  AttachMoneyOutlined,
  GroupOutlined,
  StorefrontOutlined,
  PublicOutlined,
  PercentOutlined,
  ReceiptOutlined,
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/app/i18n/LanguageContext';
import { getTranslation } from '@/app/i18n/languageUtils';

const DRAWER_WIDTH = 240;

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  translationKey: string;
}

interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  variant: 'permanent' | 'persistent' | 'temporary';
  collapsedWidth: number;
  isRTL?: boolean;
}

export default function SideNav({ isOpen, onClose, variant, collapsedWidth, isRTL = false }: SideNavProps) {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [crmOpen, setCrmOpen] = useState(true);
  const [mastersOpen, setMastersOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentLanguage } = useLanguage();

  // Function to translate text
  const t = (key: string) => getTranslation(key, currentLanguage);

  const crmItems: NavItem[] = [
    { title: t('sidenav.items.contacts'), path: '/Crm/contacts', icon: <ContactsOutlined />, translationKey: 'contacts' },
    { title: t('sidenav.items.deals'), path: '/Crm/deals', icon: <BusinessCenterOutlined />, translationKey: 'deals' },
    { title: t('sidenav.items.leads'), path: '/Crm/leads', icon: <AssignmentOutlined />, translationKey: 'leads' },
  ];

  const mastersItems: NavItem[] = [
    { title: t('sidenav.items.roles'), path: '/Masters/roles', icon: <AdminPanelSettingsOutlined />, translationKey: 'roles' },
    { title: t('sidenav.items.inventory'), path: '/Masters/inventory', icon: <InventoryOutlined />, translationKey: 'inventory' },
    // Catalogue Management Items
    { title: 'Divisions', path: '/Masters/catalogue/divisions', icon: <CategoryOutlined />, translationKey: 'divisions' },
    { title: 'Categories', path: '/Masters/catalogue/categories', icon: <ListAltOutlined />, translationKey: 'categories' },
    { title: 'Subcategories', path: '/Masters/catalogue/subcategories', icon: <LabelOutlined />, translationKey: 'subcategories' },
    { title: 'Unit of Measurement', path: '/Masters/catalogue/units-of-measure', icon: <StraightenOutlined />, translationKey: 'unitOfMeasures' },
    // Attributes Management Items
    { title: 'Attributes', path: '/Masters/attributes', icon: <StyleOutlined />, translationKey: 'attributes' },
    { title: 'AttributeGroups', path: '/Masters/attributes/attribute-groups', icon: <CategoryOutlined />, translationKey: 'attributeGroups' },
    { title: 'Attributes', path: '/Masters/attributes/attributes', icon: <ListAltOutlined />, translationKey: 'attributesList' },
    { title: 'AttributeOptions', path: '/Masters/attributes/attribute-options', icon: <LabelOutlined />, translationKey: 'attributeOptions' },
    // Pricing Management Items
    { title: 'Pricing', path: '/Masters/pricing', icon: <AttachMoneyOutlined />, translationKey: 'pricing' },
    { title: 'CustomerGroups', path: '/Masters/pricing/customer-groups', icon: <GroupOutlined />, translationKey: 'customerGroups' },
    { title: 'SellingChannels', path: '/Masters/pricing/selling-channels', icon: <StorefrontOutlined />, translationKey: 'sellingChannels' },
    { title: 'TaxRegions', path: '/Masters/pricing/tax-regions', icon: <PublicOutlined />, translationKey: 'taxRegions' },
    { title: 'TaxRates', path: '/Masters/pricing/tax-rates', icon: <PercentOutlined />, translationKey: 'taxRates' },
    { title: 'TaxRateProfiles', path: '/Masters/pricing/tax-rate-profiles', icon: <ReceiptOutlined />, translationKey: 'taxRateProfiles' },
  ];

  // Optimized navigation handler with immediate feedback
  const handleNavigation = (path: string) => {
    // Only close drawer if it's temporary and on mobile
    if (variant === 'temporary') {
      onClose();
    }
    
    // Use shallow routing for faster navigation within the same layout
    router.push(path, { scroll: false });
  };

  // Filter menu items based on search query - optimized dependencies
  const filteredCrmItems = useMemo(() => {
    if (!searchQuery) return crmItems;
    return crmItems.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, crmItems]);

  const filteredMastersItems = useMemo(() => {
    if (!searchQuery) return mastersItems;
    return mastersItems.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, mastersItems]);

  // Determine if sections should be shown based on search results
  const showCrmSection = filteredCrmItems.length > 0;
  const showMastersSection = filteredMastersItems.length > 0;

  // Expanded view for the sidebar - optimized transitions
  const ExpandedNavSection = ({ title, items, isOpen, onToggle }: {
    title: string;
    items: NavItem[];
    isOpen: boolean;
    onToggle: () => void;
  }) => (
    <List component="ul" aria-label={title}>
      <ListItem disablePadding>
        <ListItemButton 
          onClick={onToggle}
          sx={{
            transition: theme.transitions.create(['background-color'], {
              duration: theme.transitions.duration.shortest,
            }),
            // '&:hover': {
            //   backgroundColor: alpha(theme.palette.primary.main, 0.05),
            // }
          }}
        >
          <ListItemText primary={title} />
          <Box
            component="span"
            sx={{
              transition: theme.transitions.create('transform', {
                duration: theme.transitions.duration.shortest,
              }),
              transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          >
            {isOpen ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <Collapse 
          in={isOpen} 
          timeout="auto" 
          unmountOnExit={false} // Keep mounted to avoid re-rendering
          sx={{
            transition: theme.transitions.create('max-height', {
              duration: theme.transitions.duration.shortest,
            }),
            width: '100%'
          }}
        >
          <List component="ul" disablePadding>
            {items.map((item) => (
              <ListItem 
                key={item.path}
                disablePadding
                sx={{ 
                  borderLeft: pathname === item.path ? 
                    `3px solid ${theme.palette.primary.main}` : 'none',
                }}
              >
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  selected={pathname === item.path}
                  sx={{ pl: 2 }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.title} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </ListItem>
    </List>
  );

  // Collapsed view showing only icons - optimized animations
  const CollapsedNavSection = ({ title, items }: {
    title: string;
    items: NavItem[];
  }) => (
    <>
      <List component="ul" aria-label={title}>
        <ListItem disablePadding sx={{ justifyContent: 'center' }}>
          <ListItemButton sx={{ justifyContent: 'center', py: 1 }}>
            <Tooltip title={title} placement="right">
              <span>
                {title === t('sidenav.crm') ? <Dashboard fontSize="small" /> : <SettingsOutlined fontSize="small" />}
              </span>
            </Tooltip>
          </ListItemButton>
        </ListItem>
        <Divider />
        {items.map((item) => (
          <ListItem 
            key={item.path}
            disablePadding
            sx={{ 
              justifyContent: 'center', 
              py: 0,
              backgroundColor: pathname === item.path ? 
                alpha(theme.palette.primary.main, 0.12) : 'transparent',
            }}
          >
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                justifyContent: 'center',
                py: 1
              }}
            >
              <Tooltip title={item.title} placement="right">
                <span>
                  {item.icon}
                </span>
              </Tooltip>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Drawer
      variant={variant}
      open={variant === 'temporary' ? isOpen : true}
      onClose={onClose}
      anchor={isRTL ? 'right' : 'left'}
      sx={{
        width: isOpen ? DRAWER_WIDTH : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isOpen ? DRAWER_WIDTH : collapsedWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',  
          borderRight: isRTL ? 'none' : `1px solid ${theme.palette.divider}`,
          borderLeft: isRTL ? `1px solid ${theme.palette.divider}` : 'none',
          marginTop: '64px', // Height of the AppBar
          height: 'calc(100% - 64px)', // Subtract AppBar height
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shortest,
          }),
          boxShadow: isOpen ? 
            '0px 2px 4px -1px rgba(0,0,0,0.05), 0px 4px 5px 0px rgba(0,0,0,0.04), 0px 1px 10px 0px rgba(0,0,0,0.03)' : 
            'none',
        },
      }}
    >
      <Box component="nav" role="navigation" aria-label="Side navigation">
        {isOpen ? (
          <>
            <Box sx={{ overflow: 'auto' }}>
              {/* Search Box */}
              <Box sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={t('app.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: theme.transitions.create(['box-shadow'], {
                        duration: theme.transitions.duration.shortest,
                      }),
                      '&:hover': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                    }
                  }}
                />
              </Box>
              
              <nav aria-label="Main Navigation">
                {showCrmSection && (
                  <ExpandedNavSection
                    title={t('sidenav.crm')}
                    items={filteredCrmItems}
                    isOpen={crmOpen}
                    onToggle={() => setCrmOpen(!crmOpen)}
                  />
                )}
                {showMastersSection && (
                  <ExpandedNavSection
                    title={t('sidenav.masters')}
                    items={filteredMastersItems}
                    isOpen={mastersOpen}
                    onToggle={() => setMastersOpen(!mastersOpen)}
                  />
                )}
              </nav>
            </Box>
          </>
        ) : (
          // Collapsed view with only icons
          <Box sx={{ overflow: 'auto' }}>
            <nav aria-label="Main Navigation">
              {showCrmSection && (
                <CollapsedNavSection
                  title={t('sidenav.crm')}
                  items={filteredCrmItems}
                />
              )}
              {showMastersSection && (
                <CollapsedNavSection
                  title={t('sidenav.masters')}
                  items={filteredMastersItems}
                />
              )}
            </nav>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}

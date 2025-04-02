import React, { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  List, 
  Typography, 
  Divider, 
  IconButton, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Container,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  MonetizationOn as MonetizationOnIcon,
  Payments as PaymentsIcon,
  Inventory as InventoryIcon,
  Receipt as ReceiptIcon,
  Group as GroupIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  ShoppingBag as ProductsIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { AuthContext } from '../../context/AuthContext';
import { FinancialContext } from '../../context/FinancialContext';

const drawerWidth = 240;

export default function Layout() {
  const { user, logout } = useContext(AuthContext);
  const { loading } = useContext(FinancialContext);
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Add useEffect to check authentication
  useEffect(() => {
    if (!localStorage.token) {
      navigate('/login');
    }
  }, [navigate]);
  
  // Menu items for sidebar and bottom navigation
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Expenses', icon: <PaymentsIcon />, path: '/expenses' },
    { text: 'Revenues', icon: <MonetizationOnIcon />, path: '/revenues' },
    { text: 'Assets', icon: <InventoryIcon />, path: '/assets' },
    { text: 'Products', icon: <ProductsIcon />, path: '/products' }
  ];

  // Menu items only for sidebar (not in bottom nav)
  const sidebarOnlyItems = [
    { text: 'Transactions', icon: <ReceiptIcon />, path: '/transactions' },
    { text: 'Founder Contributions', icon: <GroupIcon />, path: '/founder-contributions' }
  ];

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentPath = location.pathname;
    
    if (currentPath === '/') return 'Dashboard';
    
    const allMenuItems = [...menuItems, ...sidebarOnlyItems];
    const currentItem = allMenuItems.find(item => item.path === currentPath);
    
    return currentItem ? currentItem.text : 'FinTools';
  };

  const handleDrawerToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleMenuClose();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleBottomNavChange = (event, newValue) => {
    navigate(newValue);
  };

  // Render drawer content
  const drawerContent = (
    <>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            key={item.text} 
            disablePadding 
            sx={{ 
              display: 'block',
              backgroundColor: location.pathname === item.path ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
              borderRadius: '12px',
              mx: 1,
              my: 0.5
            }}
          >
            <ListItemButton
              sx={{
                minHeight: 48,
                px: 2.5,
                borderRadius: '12px'
              }}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 3,
                  justifyContent: 'center',
                  color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.secondary
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                  color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.primary
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 1 }} />
      <List>
        {sidebarOnlyItems.map((item) => (
          <ListItem 
            key={item.text} 
            disablePadding 
            sx={{ 
              display: 'block',
              backgroundColor: location.pathname === item.path ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
              borderRadius: '12px',
              mx: 1,
              my: 0.5
            }}
          >
            <ListItemButton
              sx={{
                minHeight: 48,
                px: 2.5,
                borderRadius: '12px'
              }}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 3,
                  justifyContent: 'center',
                  color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.secondary
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiTypography-root': {
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  },
                  color: location.pathname === item.path ? theme.palette.primary.main : theme.palette.text.primary
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
        }}
      >
        <Toolbar>
          {isMobile && (
            location.pathname !== '/' ? (
              <IconButton
                color="primary"
                aria-label="back"
                edge="start"
                onClick={() => navigate(-1)}
                sx={{ mr: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
            ) : (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )
          )}
          
          {!isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 600,
              textAlign: isMobile ? 'center' : 'left',
              color: theme.palette.text.primary
            }}
          >
            {getCurrentPageTitle()}
          </Typography>
          
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <CircularProgress size={24} thickness={4} color="primary" />
            </Box>
          )}
          
          {!isSmallMobile && (
            <IconButton color="inherit" sx={{ mr: 1 }}>
              <SearchIcon />
            </IconButton>
          )}
          
          <IconButton
            onClick={handleMenu}
            color="inherit"
            size="large"
          >
            <Avatar sx={{ 
              width: 36, 
              height: 36, 
              bgcolor: theme.palette.primary.main,
              fontWeight: 500,
              fontSize: '0.9rem'
            }}>
              {user?.name?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={menuOpen}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                mt: 1
              }
            }}
          >
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar Drawer - Persistent for desktop and temporary for mobile */}
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={isMobile ? mobileOpen : open}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better performance on mobile
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none',
            boxShadow: isMobile ? '0 0 20px rgba(0, 0, 0, 0.1)' : 'none',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          pb: { xs: 9, sm: 3 }, // Add padding at bottom for mobile to account for bottom nav
          width: { xs: '100%', md: open ? `calc(100% - ${drawerWidth}px)` : '100%' },
          marginLeft: { xs: 0, md: open ? `${drawerWidth}px` : 0 },
          marginTop: '64px',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Container maxWidth="lg" disableGutters>
          <Outlet />
        </Container>
      </Box>
      
      {/* Bottom Navigation for Mobile */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderRadius: '0',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(0, 0, 0, 0.05)'
          }} 
          elevation={0}
        >
          <BottomNavigation
            showLabels
            value={location.pathname}
            onChange={handleBottomNavChange}
            sx={{ 
              height: 70,
              '& .MuiBottomNavigationAction-root': {
                maxWidth: '100%',
                py: 1.5
              }
            }}
          >
            {menuItems.map((item) => (
              <BottomNavigationAction 
                key={item.text} 
                label={item.text} 
                icon={item.icon} 
                value={item.path}
                sx={{
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  '& .MuiBottomNavigationAction-label': {
                    fontSize: '0.75rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    transition: 'font-weight 0.2s',
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
} 
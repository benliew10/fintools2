import React, { useEffect, useContext, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Grid,
  Chip,
  Tooltip,
  TablePagination,
  InputAdornment,
  Avatar,
  Fab,
  Slide,
  Stack,
  LinearProgress,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Search as SearchIcon,
  AttachFile as AttachFileIcon,
  Apartment as ApartmentIcon,
  Computer as ComputerIcon,
  DirectionsCar as CarIcon,
  Smartphone as PhoneIcon,
  Inventory as InventoryIcon,
  Handyman as HandymanIcon,
  Business as BusinessIcon,
  Store as StoreIcon,
  Close as CloseIcon,
  ArrowUpward as ArrowUpwardIcon,
  CalendarMonth as CalendarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { FinancialContext } from '../../context/FinancialContext';
import { AuthContext } from '../../context/AuthContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { format } from 'date-fns';

const assetCategories = [
  'Equipment',
  'Vehicle',
  'Electronics',
  'Property',
  'Furniture',
  'Inventory',
  'Tools',
  'Other'
];

const Assets = () => {
  const { 
    assets, 
    loadAssets, 
    assetsLoading, 
    assetsLoaded, 
    loadFinancialSummary, 
    getFinancialSummary,
    addAsset, 
    updateAsset, 
    deleteAsset,
    loading,
    error: contextError
  } = useContext(FinancialContext);
  
  const { /* user, */ } = useContext(AuthContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [open, setOpen] = useState(false);
  const [assetToCreate, setAssetToCreate] = useState({
    name: '',
    purchasePrice: '',
    category: '',
    purchaseDate: new Date(),
    currentValue: '',
    status: 'Active',
    notes: ''
  });
  const [currentAsset, setCurrentAsset] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc');
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    purchaseValue: '',
    currentValue: '',
    acquisitionDate: new Date(),
    description: '',
    condition: 'Good',
    location: '',
    depreciationRate: '',
    notes: ''
  });
  
  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Add loading state for delete operation
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      // Only load assets if they're not already loaded and not currently loading
      if (!assetsLoaded && !assetsLoading) {
        try {
          await loadAssets();
          if (getFinancialSummary) {
            await getFinancialSummary();
          }
        } catch (err) {
          console.error("Failed to load assets:", err);
          setError("Failed to load assets");
        }
      }
    };
    
    fetchData();
  }, [loadAssets, getFinancialSummary, assetsLoaded, assetsLoading]);
  
  // Show loading indicator when data is loading
  if (assetsLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Loading Assets Data...
        </Typography>
      </Box>
    );
  }
  
  // Filter assets
  const filteredAssets = assets.filter(asset => {
    return (
      (asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (asset.description && asset.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
       (asset.location && asset.location.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (categoryFilter === '' || asset.category === categoryFilter) &&
      (statusFilter === '' || asset.status === statusFilter)
    );
  });
  
  // Paginated assets
  const paginatedAssets = filteredAssets.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Add functions for category color, asset icon, depreciation, and asset age
  const getCategoryColor = (category) => {
    switch(category) {
      case 'Equipment': return 'primary';
      case 'Vehicle': return 'secondary';
      case 'Electronics': return 'info';
      case 'Property': return 'success';
      case 'Furniture': return 'warning';
      case 'Inventory': return 'error';
      case 'Tools': return 'primary';
      default: return 'default';
    }
  };

  const getAssetIcon = (category) => {
    switch(category) {
      case 'Equipment': return <BusinessIcon />;
      case 'Vehicle': return <CarIcon />;
      case 'Electronics': return <ComputerIcon />;
      case 'Property': return <ApartmentIcon />;
      case 'Furniture': return <InventoryIcon />;
      case 'Tools': return <HandymanIcon />;
      case 'Inventory': return <StoreIcon />;
      default: return <BusinessIcon />;
    }
  };

  const calculateDepreciation = (purchaseValue, depreciationRate, acquisitionDate) => {
    if (!depreciationRate || depreciationRate === 0) {
      return purchaseValue; // No depreciation
    }
    
    const purchaseDate = new Date(acquisitionDate);
    const currentDate = new Date();
    const ageInYears = (currentDate - purchaseDate) / (365 * 24 * 60 * 60 * 1000);
    
    // Calculate depreciated value: P * (1 - r)^t
    // where P is purchase value, r is depreciation rate (as decimal), t is time in years
    const depreciatedValue = purchaseValue * Math.pow(1 - (depreciationRate / 100), ageInYears);
    
    // Don't let value drop below 10% of purchase value as scrap value
    return Math.max(depreciatedValue, purchaseValue * 0.1);
  };

  const calculateAssetAge = (acquisitionDate) => {
    const purchaseDate = new Date(acquisitionDate);
    const currentDate = new Date();
    const ageInDays = (currentDate - purchaseDate) / (24 * 60 * 60 * 1000);
    
    if (ageInDays < 30) {
      return `${Math.floor(ageInDays)} days`;
    } else if (ageInDays < 365) {
      return `${Math.floor(ageInDays / 30)} months`;
    } else {
      const years = Math.floor(ageInDays / 365);
      const months = Math.floor((ageInDays % 365) / 30);
      return months > 0 ? `${years} years, ${months} months` : `${years} years`;
    }
  };
  
  if (error) {
    return (
      <Container>
        <Typography variant="h6" color="error">
          Error: {error}
        </Typography>
      </Container>
    );
  }
  
  // Group assets by category
  const assetsByCategory = {};
  
  assets.forEach(asset => {
    if (!assetsByCategory[asset.category]) {
      assetsByCategory[asset.category] = [];
    }
    assetsByCategory[asset.category].push(asset);
  });
  
  // Calculate depreciation for each asset
  const assetsWithDepreciation = assets.map(asset => {
    const depreciation = calculateDepreciation(
      asset.purchaseValue,
      asset.currentValue || asset.purchaseValue,
      asset.acquisitionDate
    );
    
    return {
      ...asset,
      depreciationRate: depreciation
    };
  });
  
  // Handle asset delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      setIsDeleting(true);
      console.log(`Attempting to delete asset: ${selectedAsset._id}`);
      
      const result = await deleteAsset(selectedAsset._id);
      
      if (result) {
        console.log('Delete successful, closing dialogs');
        setDeleteConfirmDialog(false);
      } else {
        // Error already set in context
        console.error(`Delete failed with error in context: ${contextError}`);
        // Keep dialog open to show error
        if (contextError) {
          setError(contextError);
        } else {
          setError("Failed to delete asset: Unknown error");
        }
      }
    } catch (err) {
      console.error("Error in delete confirmation:", err);
      setError(`Failed to delete asset: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      {/* Header with Title and Add Button */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        px: isMobile ? 1 : 0
      }}>
        <Typography 
          variant={isMobile ? 'h5' : 'h4'} 
          component="h1" 
          sx={{ 
            fontWeight: 700,
            fontSize: isMobile ? '1.5rem' : '2.125rem',
            background: 'linear-gradient(45deg, #007AFF, #5AC8FA)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Assets
        </Typography>
        
        {!isMobile && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setDialogMode('add');
              setFormData({
                name: '',
                category: '',
                purchaseValue: '',
                currentValue: '',
                acquisitionDate: new Date(),
                description: '',
                condition: 'Good',
                location: '',
                depreciationRate: '',
                notes: ''
              });
              setOpenDialog(true);
            }}
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1,
              boxShadow: '0 4px 10px rgba(0, 122, 255, 0.3)',
              fontWeight: 600
            }}
          >
            Add Asset
          </Button>
        )}
      </Box>
      
      {/* Summary Cards */}
      <Grid container spacing={isMobile ? 2 : 3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={0}
            className="ios-shadow"
            sx={{ 
              borderRadius: 4,
              height: '100%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2,
                    background: 'linear-gradient(45deg, #007AFF, #007AFFCC)',
                    boxShadow: '0 4px 10px rgba(0, 122, 255, 0.2)'
                  }}
                >
                  <ApartmentIcon sx={{ color: 'white', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Asset Value
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 700 }}>
                    {new Intl.NumberFormat('ms-MY', {
                      style: 'currency',
                      currency: 'MYR'
                    }).format(assets.reduce((sum, asset) => sum + (asset.currentValue || asset.purchaseValue), 0))}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Assets
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {assets.length}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Categories
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {Object.keys(assetsByCategory).length}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Card 
            elevation={0}
            className="ios-shadow"
            sx={{ 
              borderRadius: 4,
              height: '100%',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Assets by Category
              </Typography>
              
              <Grid container spacing={2}>
                {Object.keys(assetsByCategory).map(category => {
                  const categoryAssets = assetsByCategory[category];
                  const totalValue = categoryAssets.reduce((sum, asset) => sum + (asset.currentValue || asset.purchaseValue), 0);
                  const assetCount = categoryAssets.length;
                  
                  return (
                    <Grid item xs={6} md={4} key={category}>
                      <Paper 
                        elevation={0}
                        sx={{ 
                          p: 2,
                          borderRadius: 3,
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          height: '100%'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Avatar 
                            sx={{ 
                              width: 32, 
                              height: 32, 
                              mr: 1.5,
                              bgcolor: `${getCategoryColor(category)}20`,
                              color: getCategoryColor(category)
                            }}
                          >
                            {getAssetIcon(category)}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {category}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {assetCount} {assetCount === 1 ? 'Asset' : 'Assets'}
                        </Typography>
                        
                        <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>
                          {new Intl.NumberFormat('ms-MY', {
                            style: 'currency',
                            currency: 'MYR'
                          }).format(totalValue)}
                        </Typography>
                        
                        <LinearProgress 
                          variant="determinate" 
                          value={(totalValue / (assets.reduce((sum, asset) => sum + (asset.currentValue || asset.purchaseValue), 0) || 1)) * 100}
                          sx={{ 
                            height: 6,
                            borderRadius: 1,
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getCategoryColor(category),
                            }
                          }} 
                        />
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Assets List */}
      {assets.length > 0 ? (
        <Box sx={{ px: isMobile ? 1 : 0 }}>
          {/* Group assets by category */}
          {Object.keys(assetsByCategory).map(category => (
            <Box key={category} sx={{ mb: 4 }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mb: 2,
                  px: 1
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 34, 
                    height: 34, 
                    mr: 1.5,
                    bgcolor: `${getCategoryColor(category)}20`,
                    color: getCategoryColor(category)
                  }}
                >
                  {getAssetIcon(category)}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {category}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  ({assetsByCategory[category].length} {assetsByCategory[category].length === 1 ? 'asset' : 'assets'})
                </Typography>
              </Box>
              
              <Grid container spacing={isMobile ? 2 : 3}>
                {assetsByCategory[category].map(asset => (
                  <Grid item xs={12} sm={6} md={4} key={asset._id}>
                    <Card 
                      elevation={0}
                      className="ios-shadow"
                      sx={{ 
                        borderRadius: 4,
                        overflow: 'hidden',
                        position: 'relative',
                        '&:hover': {
                          '& .asset-actions': {
                            opacity: 1
                          }
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          height: 8, 
                          width: '100%', 
                          backgroundColor: getCategoryColor(asset.category) 
                        }} 
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {asset.name}
                          </Typography>
                          
                          <Box 
                            className="asset-actions"
                            sx={{ 
                              opacity: { xs: 1, md: 0 },
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <Tooltip title="Edit">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setDialogMode('edit');
                                  setSelectedAsset(asset);
                                  setFormData({
                                    name: asset.name,
                                    category: asset.category,
                                    purchaseValue: asset.purchaseValue,
                                    currentValue: asset.currentValue,
                                    acquisitionDate: new Date(asset.acquisitionDate),
                                    description: asset.description || '',
                                    condition: asset.condition,
                                    location: asset.location || '',
                                    depreciationRate: asset.depreciationRate || '',
                                    notes: asset.notes || ''
                                  });
                                  setOpenDialog(true);
                                }}
                                sx={{ 
                                  mr: 1,
                                  backgroundColor: 'rgba(0,0,0,0.03)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.07)',
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton 
                                size="small" 
                                onClick={() => {
                                  setSelectedAsset(asset);
                                  setDeleteConfirmDialog(true);
                                }}
                                sx={{ 
                                  color: theme.palette.error.main,
                                  backgroundColor: 'rgba(255,59,48,0.05)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255,59,48,0.1)',
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        
                        {asset.description && (
                          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            {asset.description}
                          </Typography>
                        )}
                        
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Current Value
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {new Intl.NumberFormat('ms-MY', {
                                style: 'currency',
                                currency: 'MYR'
                              }).format(asset.currentValue || asset.purchaseValue)}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" color="text.secondary" display="block">
                              Purchase Value
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {new Intl.NumberFormat('ms-MY', {
                                style: 'currency',
                                currency: 'MYR'
                              }).format(asset.purchaseValue)}
                            </Typography>
                          </Grid>
                        </Grid>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <CalendarIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', opacity: 0.7 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(asset.acquisitionDate)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Age: {calculateAssetAge(asset.acquisitionDate)}
                              </Typography>
                            </Box>
                          </Grid>
                          
                          {asset.depreciationRate > 0 && (
                            <Grid item xs={12} sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">
                                  Depreciation Rate:
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 500,
                                    color: theme.palette.error.main
                                  }}
                                >
                                  {asset.depreciationRate.toFixed(1)}% per year
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          
                          {asset.location && (
                            <Grid item xs={12} sx={{ mt: 0.5 }}>
                              <Typography variant="body2" color="text.secondary">
                                Location: {asset.location}
                              </Typography>
                            </Grid>
                          )}
                          
                          {asset.condition && (
                            <Grid item xs={12} sx={{ mt: 0.5 }}>
                              <Chip 
                                label={asset.condition} 
                                size="small"
                                sx={{ 
                                  fontWeight: 500,
                                  bgcolor: asset.condition === 'Excellent' ? 'rgba(52, 199, 89, 0.1)' :
                                           asset.condition === 'Good' ? 'rgba(0, 122, 255, 0.1)' :
                                           asset.condition === 'Fair' ? 'rgba(255, 149, 0, 0.1)' :
                                           'rgba(255, 59, 48, 0.1)',
                                  color: asset.condition === 'Excellent' ? '#34C759' :
                                         asset.condition === 'Good' ? '#007AFF' :
                                         asset.condition === 'Fair' ? '#FF9500' :
                                         '#FF3B30'
                                }}
                              />
                            </Grid>
                          )}
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      ) : (
        <Box 
          sx={{ 
            p: 3, 
            textAlign: 'center', 
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.02)',
            mt: 4
          }}
        >
          <ApartmentIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No assets found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Add your first asset to get started
          </Typography>
        </Box>
      )}
      
      {/* Add/Edit Asset Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => {
          setOpenDialog(false);
          setViewDialog(false);
          setDeleteConfirmDialog(false);
        }}
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 4,
            maxWidth: 'sm',
            width: '100%'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1,
          pt: isMobile ? 2 : 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {dialogMode === 'add' ? 'Add New Asset' : 'Edit Asset'}
          </Typography>
          {isMobile && (
            <IconButton edge="end" color="inherit" onClick={() => {
              setOpenDialog(false);
              setViewDialog(false);
              setDeleteConfirmDialog(false);
            }} aria-label="close">
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Asset Name"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description (Optional)"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  label="Category"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3
                    }
                  }}
                >
                  {assetCategories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="condition-label">Condition</InputLabel>
                <Select
                  labelId="condition-label"
                  name="condition"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  label="Condition"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3
                    }
                  }}
                >
                  <MenuItem value="Excellent">Excellent</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Acquisition Date"
                  value={formData.acquisitionDate}
                  onChange={(newDate) => setFormData({ ...formData, acquisitionDate: newDate })}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                      variant: 'outlined',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="purchaseValue"
                label="Purchase Value (RM)"
                type="number"
                fullWidth
                value={formData.purchaseValue}
                onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">RM</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="currentValue"
                label="Current Value (RM)"
                type="number"
                fullWidth
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">RM</InputAdornment>,
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="location"
                label="Location (Optional)"
                fullWidth
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          {!isMobile && (
            <Button 
              onClick={() => {
                setOpenDialog(false);
                setViewDialog(false);
                setDeleteConfirmDialog(false);
              }} 
              variant="outlined"
              sx={{ borderRadius: 3, px: 3 }}
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={() => {
              if (dialogMode === 'add') {
                addAsset(formData);
              } else {
                updateAsset(selectedAsset._id, formData);
              }
              setOpenDialog(false);
              setViewDialog(false);
              setDeleteConfirmDialog(false);
            }} 
            variant="contained" 
            color="primary"
            fullWidth={isMobile}
            sx={{ 
              borderRadius: 3, 
              px: 3,
              py: 1,
              boxShadow: '0 4px 10px rgba(0, 122, 255, 0.3)',
              fontWeight: 600
            }}
          >
            {dialogMode === 'add' ? 'Add Asset' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Mobile Fab for Adding Asset */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => {
            setDialogMode('add');
            setFormData({
              name: '',
              category: '',
              purchaseValue: '',
              currentValue: '',
              acquisitionDate: new Date(),
              description: '',
              condition: 'Good',
              location: '',
              depreciationRate: '',
              notes: ''
            });
            setOpenDialog(true);
          }}
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
            boxShadow: '0 4px 14px rgba(0, 122, 255, 0.5)',
          }}
        >
          <AddIcon />
        </Fab>
      )}
      
      {/* Add Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog}
        onClose={() => {
          // Only allow closing if not currently loading
          if (!loading && !isDeleting) {
            setDeleteConfirmDialog(false);
            setError(null);
          }
        }}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            maxWidth: '400px'
          }
        }}
      >
        {selectedAsset && (
          <>
            <DialogTitle sx={{ pt: 3, px: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Delete Asset
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ px: 3, pt: 1 }}>
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  {error}
                </Alert>
              )}
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to delete this asset?
              </Typography>
              
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  backgroundColor: 'rgba(0,0,0,0.03)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: `${getCategoryColor(selectedAsset.category)}.main`,
                    width: 40,
                    height: 40,
                    mr: 2
                  }}
                >
                  {getAssetIcon(selectedAsset.category)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
                    {selectedAsset.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(selectedAsset.currentValue)} • {formatDate(selectedAsset.acquisitionDate)}
                  </Typography>
                </Box>
              </Paper>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                onClick={() => {
                  setDeleteConfirmDialog(false);
                  setError(null);
                }}
                disabled={loading || isDeleting}
                sx={{ 
                  borderRadius: 8, 
                  px: 3,
                  color: 'text.secondary'
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                variant="contained"
                color="error"
                disabled={loading || isDeleting}
                startIcon={loading || isDeleting ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{ 
                  borderRadius: 8,
                  px: 3
                }}
              >
                {loading || isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Assets; 
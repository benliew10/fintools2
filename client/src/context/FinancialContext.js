import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const FinancialContext = createContext();

export const FinancialProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useContext(AuthContext);
  
  // Add these cache control variables
  const lastSummaryFetch = useRef(0);
  const MIN_FETCH_INTERVAL = 5000; // 5 seconds minimum between fetches
  const isMounted = useRef(true);
  
  const [financialSummary, setFinancialSummary] = useState({
    totalExpenses: 0,
    totalRevenue: 0,
    pureProfit: 0,
    totalAssets: 0,
    founderContributions: 0,
    cashBalance: {},
    dataLoaded: false
  });
  const [cashFlow, setCashFlow] = useState([]);
  const [founderContributions, setFounderContributions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [assets, setAssets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Use separate loading states for different data types
  const [loading, setLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [revenuesLoading, setRevenuesLoading] = useState(false);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  
  // Track whether each data type has been loaded
  const [expensesLoaded, setExpensesLoaded] = useState(false);
  const [revenuesLoaded, setRevenuesLoaded] = useState(false);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  
  const [error, setError] = useState(null);
  
  // Use useRef to store functions so they persist across renders
  const funcsRef = useRef({
    loadFinancialSummary: async () => Promise.resolve(),
    getFinancialSummary: async () => Promise.resolve(),
    loadExpenses: async () => Promise.resolve(),
    loadRevenues: async () => Promise.resolve(),
    loadCashFlowData: async () => Promise.resolve(),
    loadFounderContributions: async () => Promise.resolve(),
    addExpense: async () => Promise.resolve(),
    updateExpense: async () => Promise.resolve(),
    deleteExpense: async () => Promise.resolve(),
    addRevenue: async () => Promise.resolve(),
    updateRevenue: async () => Promise.resolve(),
    deleteRevenue: async () => Promise.resolve(),
    loadAssets: async () => Promise.resolve(),
    addAsset: async () => Promise.resolve(),
    updateAsset: async () => Promise.resolve(),
    deleteAsset: async () => Promise.resolve(),
    loadTransactions: async () => Promise.resolve(),
    addTransaction: async () => Promise.resolve(),
    loadProducts: async () => Promise.resolve(),
    addProduct: async () => Promise.resolve(),
    updateProduct: async () => Promise.resolve(),
    deleteProduct: async () => Promise.resolve(),
    markProductAsSold: async () => Promise.resolve(),
    createProductFromExpense: async () => Promise.resolve(),
    getProductForExpense: async () => Promise.resolve(),
    clearErrors: () => {}
  });
  
  // Add a variable to track if refreshData is currently running
  let isRefreshing = false;
  let refreshTimeout = null;
  
  // Implement the actual functionality
  useEffect(() => {
    // Define actual implementations

    // Add a function to refresh all data
    funcsRef.current.refreshData = async () => {
      try {
        // If already refreshing, don't start another refresh
        if (isRefreshing) {
          console.log('Data refresh already in progress, skipping');
          return Promise.resolve(false);
        }
        
        // Clear any existing refresh timeout to debounce multiple calls
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
        }
        
        // Set loading state only if not already loading
        if (!loading) {
          setLoading(true);
        }
        
        isRefreshing = true;
        
        // Use a timeout to debounce multiple refresh calls
        return new Promise((resolve) => {
          refreshTimeout = setTimeout(async () => {
            try {
              console.log('Starting comprehensive data refresh...');
              
              // Force refresh the summary using the force parameter
              console.log('Refreshing financial summary...');
              await funcsRef.current.loadFinancialSummary(true);
              
              // Add delay between API calls to reduce server load
              await new Promise(r => setTimeout(r, 500));
              
              // Then refresh revenues to show new revenue entries
              console.log('Refreshing revenues data...');
              await funcsRef.current.loadRevenues(true);
              
              // Add delay between API calls
              await new Promise(r => setTimeout(r, 500));
              
              // Then refresh products data
              console.log('Refreshing products data...');
              await funcsRef.current.loadProducts(true);
              
              console.log('All data refreshed successfully');
              resolve(true);
            } catch (err) {
              console.error('Error during data refresh:', err);
              setError('Failed to refresh data: ' + (err.message || 'Unknown error'));
              resolve(false);
            } finally {
              setLoading(false);
              refreshTimeout = null;
              isRefreshing = false;
            }
          }, 500); // 500ms debounce
        });
      } catch (err) {
        console.error('Error during data refresh:', err);
        setError('Failed to refresh data: ' + (err.message || 'Unknown error'));
        setLoading(false);
        isRefreshing = false;
        return false;
      }
    };

    funcsRef.current.loadFinancialSummary = async (force = false) => {
      // Skip if already loading
      if (loading) {
        console.log('Already loading financial summary, skipping request');
        return;
      }
      
      const now = Date.now();
      // Only fetch if forced or enough time has passed since last fetch
      if (!force && now - lastSummaryFetch.current < MIN_FETCH_INTERVAL) {
        console.log('Skipping financial summary fetch due to throttling');
        return;
      }
      
      try {
        console.log('Loading financial summary...');
        setLoading(true);
        lastSummaryFetch.current = now;
        
        const res = await axios.get('/api/v1/dashboard/summary');
        
        // Only update state if the component is still mounted
        if (isMounted.current) {
          setFinancialSummary({
            ...res.data.data,
            dataLoaded: true
          });
        }
      } catch (err) {
        console.error('Failed to load financial summary:', err);
        if (isMounted.current) {
          setError(err.response?.data?.error || 'Failed to load financial summary');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    // Alias for loadFinancialSummary for backward compatibility
    funcsRef.current.getFinancialSummary = funcsRef.current.loadFinancialSummary;
    
    funcsRef.current.loadExpenses = async (forceRefresh = false) => {
      // Skip if already loading or if data is already loaded and not forcing refresh
      if (expensesLoading) {
        console.log('Expenses already loading, skipping request');
        return; 
      }
      if (expensesLoaded && !forceRefresh) {
        console.log('Expenses already loaded, skipping request');
        return;
      }
      
      console.log('Loading expenses data...');
      try {
        setExpensesLoading(true);
        const res = await axios.get('/api/v1/expenses');
        setExpenses(res.data.data);
        setExpensesLoaded(true);
        console.log('Expenses data loaded successfully');
      } catch (err) {
        console.error('Failed to load expenses:', err);
        setError(err.response?.data?.error || 'Failed to load expenses');
      } finally {
        setExpensesLoading(false);
      }
    };

    funcsRef.current.loadRevenues = async (forceRefresh = false) => {
      // Skip if already loading or if data is already loaded and not forcing refresh
      if (revenuesLoading) return;
      if (revenuesLoaded && !forceRefresh) return;
      
      try {
        setRevenuesLoading(true);
        const res = await axios.get('/api/v1/revenues');
        setRevenues(res.data.data);
        setRevenuesLoaded(true);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load revenues');
      } finally {
        setRevenuesLoading(false);
      }
    };

    funcsRef.current.loadCashFlowData = async (startDate, endDate, interval = 'month') => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/v1/dashboard/cash-flow?startDate=${startDate}&endDate=${endDate}&interval=${interval}`);
        setCashFlow(res.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load cash flow data');
        setLoading(false);
      }
    };

    funcsRef.current.loadFounderContributions = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/v1/dashboard/founder-contributions');
        setFounderContributions(res.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load founder contributions');
        setLoading(false);
      }
    };

    funcsRef.current.addExpense = async (expenseData) => {
      try {
        const res = await axios.post('/api/v1/expenses', expenseData);
        setExpenses([res.data.data, ...expenses]);
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to add expense');
        return false;
      }
    };

    funcsRef.current.updateExpense = async (id, expenseData) => {
      try {
        const res = await axios.put(`/api/v1/expenses/${id}`, expenseData);
        setExpenses(expenses.map(expense => expense._id === id ? res.data.data : expense));
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to update expense');
        return false;
      }
    };

    funcsRef.current.deleteExpense = async (id) => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        console.log(`Attempting to delete expense with ID: ${id}`);
        
        const response = await axios.delete(`/api/v1/expenses/${id}`);
        console.log('Delete response:', response.data);
        
        if (response.data.success) {
          console.log('Successfully deleted expense');
          
          // Filter out the deleted expense
          setExpenses(expenses.filter(expense => expense._id !== id));
          
          // If the expense was an asset, refresh assets
          const deletedExpense = expenses.find(expense => expense._id === id);
          if (deletedExpense && deletedExpense.isAsset) {
            console.log('Refreshing assets after deleting asset-type expense');
            await funcsRef.current.loadAssets(true);
          }
          
          // If the expense is tracked as a product, refresh products
          if (deletedExpense && deletedExpense.isProductCreated) {
            console.log('Refreshing products after deleting product-related expense');
            await funcsRef.current.loadProducts(true);
          }
          
          // Refresh financial summary
          await funcsRef.current.loadFinancialSummary();
          
          return true;
        } else {
          const errorMsg = response.data.error || "Failed to delete expense";
          console.error("Delete failed with success=false:", errorMsg);
          setError(errorMsg);
          return false;
        }
      } catch (err) {
        console.error("Error in deleteExpense:", err);
        
        // Check if there's a response with an error message
        if (err.response) {
          console.error("Server error response:", err.response.data);
          const errorMessage = err.response.data.error || "Failed to delete expense";
          
          // Provide specific error message based on status code
          if (err.response.status === 400) {
            setError(errorMessage || "Cannot delete this expense - it may have sold products associated with it");
          } else if (err.response.status === 404) {
            setError("Expense not found or already deleted");
          } else if (err.response.status === 500) {
            setError(`Server error: ${errorMessage}`);
          } else {
            setError(errorMessage);
          }
        } else if (err.request) {
          // Request was made but no response received
          console.error("No response received:", err.request);
          setError("No response from server. Please check your connection.");
        } else {
          // Something else caused the error
          setError(`Error: ${err.message || "Unknown error occurred"}`);
        }
        
        return false;
      } finally {
        setLoading(false);
      }
    };

    funcsRef.current.addRevenue = async (revenueData) => {
      try {
        const res = await axios.post('/api/v1/revenues', revenueData);
        setRevenues([res.data.data, ...revenues]);
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to add revenue');
        return false;
      }
    };

    funcsRef.current.updateRevenue = async (id, revenueData) => {
      try {
        const res = await axios.put(`/api/v1/revenues/${id}`, revenueData);
        setRevenues(revenues.map(revenue => revenue._id === id ? res.data.data : revenue));
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to update revenue');
        return false;
      }
    };

    funcsRef.current.deleteRevenue = async (id) => {
      try {
        // Skip if already loading
        if (loading) {
          console.log('Already processing a request, please wait');
          return false;
        }
        
        setLoading(true);
        setError(null); // Clear any previous errors
        
        console.log(`Attempting to delete revenue with ID: ${id}`);
        
        const response = await axios.delete(`/api/v1/revenues/${id}`);
        console.log('Delete response:', response.data);
        
        if (response.data.success) {
          console.log('Successfully deleted revenue');
          
          // Optimistic UI update - filter out the deleted revenue
          setRevenues(revenues.filter(revenue => revenue._id !== id));
          
          // Update financial summary directly without a full refresh
          setFinancialSummary(prev => {
            // Find the revenue amount to subtract
            const deletedRevenue = revenues.find(r => r._id === id);
            const amountToSubtract = deletedRevenue ? deletedRevenue.amount : 0;
            
            return {
              ...prev,
              totalRevenue: prev.totalRevenue - amountToSubtract,
              pureProfit: prev.pureProfit - amountToSubtract
            };
          });
          
          return true;
        } else {
          const errorMsg = response.data.error || "Failed to delete revenue";
          console.error("Delete failed with success=false:", errorMsg);
          setError(errorMsg);
          return false;
        }
      } catch (err) {
        console.error("Error deleting revenue:", err);
        
        // Check if there's a response with an error message
        if (err.response) {
          console.error("Server error response:", err.response.data);
          const errorMessage = err.response.data.error || "Failed to delete revenue";
          
          // Provide specific error message based on status code
          if (err.response.status === 404) {
            setError("Revenue not found or already deleted");
          } else if (err.response.status === 500) {
            setError(`Server error: ${errorMessage}`);
          } else {
            setError(errorMessage);
          }
        } else if (err.request) {
          // Request was made but no response received
          console.error("No response received:", err.request);
          setError("No response from server. Please check your connection.");
        } else {
          // Something else caused the error
          setError(`Error: ${err.message || "Unknown error occurred"}`);
        }
        
        return false;
      } finally {
        setLoading(false);
      }
    };

    funcsRef.current.loadAssets = async (forceRefresh = false) => {
      // Skip if already loading or if data is already loaded and not forcing refresh
      if (assetsLoading) {
        console.log('Assets already loading, skipping request');
        return;
      }
      if (assetsLoaded && !forceRefresh) {
        console.log('Assets already loaded, skipping request');
        return;
      }
      
      console.log('Loading assets data...');
      try {
        setAssetsLoading(true);
        const res = await axios.get('/api/v1/assets');
        setAssets(res.data.data);
        setAssetsLoaded(true);
        console.log('Assets data loaded successfully');
      } catch (err) {
        console.error('Failed to load assets:', err);
        setError(err.response?.data?.error || 'Failed to load assets');
      } finally {
        setAssetsLoading(false);
      }
    };

    funcsRef.current.addAsset = async (assetData) => {
      try {
        const res = await axios.post('/api/v1/assets', assetData);
        setAssets([res.data.data, ...assets]);
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to add asset');
        return false;
      }
    };

    funcsRef.current.updateAsset = async (id, assetData) => {
      try {
        const res = await axios.put(`/api/v1/assets/${id}`, assetData);
        setAssets(assets.map(asset => asset._id === id ? res.data.data : asset));
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to update asset');
        return false;
      }
    };

    funcsRef.current.deleteAsset = async (id) => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        console.log(`Attempting to delete asset with ID: ${id}`);
        
        const response = await axios.delete(`/api/v1/assets/${id}`);
        console.log('Delete response:', response.data);
        
        if (response.data.success) {
          console.log('Successfully deleted asset');
          
          // Filter out the deleted asset
          setAssets(assets.filter(asset => asset._id !== id));
          
          // Refresh financial summary
          await funcsRef.current.loadFinancialSummary();
          
          return true;
        } else {
          const errorMsg = response.data.error || "Failed to delete asset";
          console.error("Delete failed with success=false:", errorMsg);
          setError(errorMsg);
          return false;
        }
      } catch (err) {
        console.error("Error in deleteAsset:", err);
        
        // Check if there's a response with an error message
        if (err.response) {
          console.error("Server error response:", err.response.data);
          const errorMessage = err.response.data.error || "Failed to delete asset";
          
          // Provide specific error message based on status code
          if (err.response.status === 404) {
            setError("Asset not found or already deleted");
          } else if (err.response.status === 500) {
            setError(`Server error: ${errorMessage}`);
          } else {
            setError(errorMessage);
          }
        } else if (err.request) {
          // Request was made but no response received
          console.error("No response received:", err.request);
          setError("No response from server. Please check your connection.");
        } else {
          // Something else caused the error
          setError(`Error: ${err.message || "Unknown error occurred"}`);
        }
        
        return false;
      } finally {
        setLoading(false);
      }
    };

    funcsRef.current.loadTransactions = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/v1/transactions');
        setTransactions(res.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load transactions');
        setLoading(false);
      }
    };

    funcsRef.current.addTransaction = async (transactionData) => {
      try {
        const res = await axios.post('/api/v1/transactions', transactionData);
        setTransactions([res.data.data, ...transactions]);
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to add transaction');
        return false;
      }
    };

    funcsRef.current.loadProducts = async (forceRefresh = false) => {
      // Skip if already loading or if data is already loaded and not forcing refresh
      if (productsLoading) {
        console.log('Products already loading, skipping request');
        return;
      }
      if (productsLoaded && !forceRefresh) {
        console.log('Products already loaded, skipping request');
        return;
      }
      
      console.log('Loading products data...');
      try {
        setProductsLoading(true);
        const res = await axios.get('/api/v1/products');
        setProducts(res.data.data);
        setProductsLoaded(true);
        console.log('Products data loaded successfully');
      } catch (err) {
        console.error('Failed to load products:', err);
        setError(err.response?.data?.error || 'Failed to load products');
      } finally {
        setProductsLoading(false);
      }
    };

    funcsRef.current.addProduct = async (productData) => {
      try {
        const res = await axios.post('/api/v1/products', productData);
        setProducts([res.data.data, ...products]);
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to add product');
        return false;
      }
    };

    funcsRef.current.updateProduct = async (id, productData) => {
      try {
        const res = await axios.put(`/api/v1/products/${id}`, productData);
        setProducts(products.map(product => product._id === id ? res.data.data : product));
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return true;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to update product');
        return false;
      }
    };

    funcsRef.current.deleteProduct = async (id) => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        
        console.log(`Attempting to delete product with ID: ${id}`);
        
        const response = await axios.delete(`/api/v1/products/${id}`);
        console.log('Delete response:', response.data);
        
        if (response.data.success) {
          console.log('Successfully deleted product');
          
          // Filter out the deleted product
          setProducts(products.filter(product => product._id !== id));
          
          // Refresh financial summary
          await funcsRef.current.loadFinancialSummary();
          
          return true;
        } else {
          const errorMsg = response.data.error || "Failed to delete product";
          console.error("Delete failed with success=false:", errorMsg);
          setError(errorMsg);
          return false;
        }
      } catch (err) {
        console.error("Error in deleteProduct:", err);
        
        // Check if there's a response with an error message
        if (err.response) {
          console.error("Server error response:", err.response.data);
          const errorMessage = err.response.data.error || "Failed to delete product";
          
          // Provide specific error message based on status code
          if (err.response.status === 400) {
            if (err.response.data.error && err.response.data.error.includes('sold')) {
              setError("Cannot delete a product that has been sold. Please use archive instead.");
            } else {
              setError(errorMessage || "Cannot delete this product - it may have dependencies");
            }
          } else if (err.response.status === 404) {
            setError("Product not found or already deleted");
          } else if (err.response.status === 500) {
            setError(`Server error: ${errorMessage}`);
          } else {
            setError(errorMessage);
          }
        } else if (err.request) {
          // Request was made but no response received
          console.error("No response received:", err.request);
          setError("No response from server. Please check your connection.");
        } else {
          // Something else caused the error
          setError(`Error: ${err.message || "Unknown error occurred"}`);
        }
        
        return false;
      } finally {
        setLoading(false);
      }
    };

    funcsRef.current.markProductAsSold = async (productId, saleData) => {
      try {
        // Skip if already loading
        if (loading) {
          console.log('Already processing another request, please wait');
          return false;
        }
        
        setLoading(true);
        setError(null);
        
        console.log(`Marking product ${productId} as sold:`, saleData);
        
        const res = await axios.put(`/api/v1/products/${productId}/mark-sold`, saleData);
        
        console.log("Mark product as sold response:", res.data);
        
        if (res.data.success) {
          // Optimistic UI updates to avoid loading all data again
          
          // 1. Update products state directly with the response data
          if (res.data.data.products) {
            // Create a new products array to avoid reference issues
            const updatedProducts = [...products];
            
            // Handle the case where we might get back more than one product (original + new sold one)
            res.data.data.products.forEach(updatedProduct => {
              const index = updatedProducts.findIndex(p => p._id === updatedProduct._id);
              
              if (index !== -1) {
                updatedProducts[index] = updatedProduct;
              } else {
                updatedProducts.push(updatedProduct);
              }
            });
            
            // Update the products state
            setProducts(updatedProducts);
            // Also mark products as loaded
            if (!productsLoaded) {
              setProductsLoaded(true);
            }
          }
          
          // 2. If a revenue was created, update the revenues state directly
          if (res.data.data.revenue) {
            console.log("Revenue created from product sale:", res.data.data.revenue);
            
            // Add the new revenue to the state
            const newRevenue = res.data.data.revenue;
            setRevenues(prevRevenues => [newRevenue, ...prevRevenues]);
            
            // Also mark revenues as loaded
            if (!revenuesLoaded) {
              setRevenuesLoaded(true);
            }
            
            // 3. Update financial summary with the new revenue amount
            setFinancialSummary(prev => ({
              ...prev,
              totalRevenue: prev.totalRevenue + newRevenue.amount,
              pureProfit: prev.pureProfit + newRevenue.amount,
              dataLoaded: true
            }));
          }
          
          console.log('Successfully updated UI with sale data');
          return true;
        } else {
          const errorMsg = res.data.error || 'Failed to mark product as sold';
          console.error("Sale failed with success=false:", errorMsg);
          setError(errorMsg);
          return false;
        }
      } catch (err) {
        console.error("Error marking product as sold:", err);
        // Provide more helpful error messages
        if (err.response) {
          const statusCode = err.response.status;
          if (statusCode === 404) {
            setError("Product not found. It may have been deleted.");
          } else if (statusCode === 400) {
            setError(err.response.data.error || "Invalid sale data. Please check the form and try again.");
          } else {
            setError(err.response?.data?.error || "Server error while processing sale. Please try again.");
          }
        } else if (err.request) {
          setError("Network error. Please check your connection and try again.");
        } else {
          setError(err.message || 'An error occurred while marking product as sold');
        }
        return false;
      } finally {
        setLoading(false);
      }
    };

    funcsRef.current.createProductFromExpense = async (productData) => {
      try {
        if (!productData) {
          throw new Error('Product data is required');
        }
        
        // Ensure required fields are present
        if (!productData.name || !productData.category || !productData.purchasePrice) {
          throw new Error('Missing required product fields: name, category, or purchasePrice');
        }
        
        // Ensure purchasePrice is a number
        if (isNaN(parseFloat(productData.purchasePrice))) {
          throw new Error('Purchase price must be a valid number');
        }
        
        // Add createdBy field if not present
        if (!productData.createdBy) {
          productData.createdBy = localStorage.getItem('userId');
        }
        
        const res = await axios.post('/api/v1/products', productData);
        setProducts([res.data.data, ...products]);
        
        // If product is related to an expense, update the expense
        if (productData.relatedExpense) {
          // Update expense in the expenses state to mark as product created
          setExpenses(expenses.map(expense => 
            expense._id === productData.relatedExpense 
              ? { ...expense, isProductCreated: true } 
              : expense
          ));
        }
        
        funcsRef.current.loadFinancialSummary(); // Refresh summary data
        return res.data.data;
      } catch (err) {
        console.error('Error creating product from expense:', err);
        setError(err.response?.data?.error || err.message || 'Failed to create product from expense');
        return null;
      }
    };

    funcsRef.current.getProductForExpense = async (expenseId) => {
      try {
        const res = await axios.get(`/api/v1/expenses/${expenseId}/product`);
        return res.data.data;
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to get product for expense');
        return null;
      }
    };

    funcsRef.current.clearErrors = () => setError(null);
  }, [
    // Remove most state dependencies that cause continuous re-renders
    // Keep only the necessary dependencies for initialization
  ]);
  
  // Add useEffect for cleanup to prevent memory leaks and update after unmount
  useEffect(() => {
    // Component mounted
    isMounted.current = true;
    
    // Cleanup function - runs when component unmounts
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Update this main data loading effect to be more conservative
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Only load financial summary if not already loaded
      if (!financialSummary.dataLoaded) {
        // Small timeout to prevent immediate triggering on mount
        const timer = setTimeout(() => {
          if (isMounted.current) {
            funcsRef.current.loadFinancialSummary();
          }
        }, 100);
        
        return () => clearTimeout(timer);
      }
      
      // Load other data only if not already loaded, with even more conservative checks
      if (!expensesLoaded && !expensesLoading) {
        const timer = setTimeout(() => {
          if (isMounted.current) {
            funcsRef.current.loadExpenses();
          }
        }, 200);
        return () => clearTimeout(timer);
      }
      
      if (!revenuesLoaded && !revenuesLoading) {
        const timer = setTimeout(() => {
          if (isMounted.current) {
            funcsRef.current.loadRevenues();
          }
        }, 300);
        return () => clearTimeout(timer);
      }
      
      if (!assetsLoaded && !assetsLoading) {
        const timer = setTimeout(() => {
          if (isMounted.current) {
            funcsRef.current.loadAssets();
          }
        }, 400);
        return () => clearTimeout(timer);
      }
      
      if (!productsLoaded && !productsLoading) {
        const timer = setTimeout(() => {
          if (isMounted.current) {
            funcsRef.current.loadProducts();
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [isAuthenticated, authLoading, financialSummary.dataLoaded, 
      expensesLoaded, revenuesLoaded, assetsLoaded, productsLoaded,
      expensesLoading, revenuesLoading, assetsLoading, productsLoading]);

  // Reset loaded states when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('User logged out, resetting loaded states');
      setExpensesLoaded(false);
      setRevenuesLoaded(false);
      setAssetsLoaded(false);
      setProductsLoaded(false);
      setFinancialSummary(prevState => ({
        ...prevState,
        dataLoaded: false
      }));
    }
  }, [isAuthenticated]);

  return (
    <FinancialContext.Provider
      value={{
        financialSummary,
        cashFlow,
        founderContributions,
        expenses,
        revenues,
        assets,
        transactions,
        products,
        loading,
        expensesLoading,
        revenuesLoading,
        assetsLoading,
        productsLoading,
        expensesLoaded,
        revenuesLoaded,
        assetsLoaded,
        productsLoaded,
        error,
        loadFinancialSummary: (...args) => funcsRef.current.loadFinancialSummary(...args),
        getFinancialSummary: (...args) => funcsRef.current.getFinancialSummary(...args),
        loadCashFlowData: (...args) => funcsRef.current.loadCashFlowData(...args),
        loadFounderContributions: (...args) => funcsRef.current.loadFounderContributions(...args),
        loadExpenses: (...args) => funcsRef.current.loadExpenses(...args),
        addExpense: (...args) => funcsRef.current.addExpense(...args),
        updateExpense: (...args) => funcsRef.current.updateExpense(...args),
        deleteExpense: (...args) => funcsRef.current.deleteExpense(...args),
        loadRevenues: (...args) => funcsRef.current.loadRevenues(...args),
        addRevenue: (...args) => funcsRef.current.addRevenue(...args),
        updateRevenue: (...args) => funcsRef.current.updateRevenue(...args),
        deleteRevenue: (...args) => funcsRef.current.deleteRevenue(...args),
        loadAssets: (...args) => funcsRef.current.loadAssets(...args),
        addAsset: (...args) => funcsRef.current.addAsset(...args),
        updateAsset: (...args) => funcsRef.current.updateAsset(...args),
        deleteAsset: (...args) => funcsRef.current.deleteAsset(...args),
        loadTransactions: (...args) => funcsRef.current.loadTransactions(...args),
        addTransaction: (...args) => funcsRef.current.addTransaction(...args),
        loadProducts: (...args) => funcsRef.current.loadProducts(...args),
        addProduct: (...args) => funcsRef.current.addProduct(...args),
        updateProduct: (...args) => funcsRef.current.updateProduct(...args),
        deleteProduct: (...args) => funcsRef.current.deleteProduct(...args),
        markProductAsSold: (...args) => funcsRef.current.markProductAsSold(...args),
        createProductFromExpense: (...args) => funcsRef.current.createProductFromExpense(...args),
        getProductForExpense: (...args) => funcsRef.current.getProductForExpense(...args),
        clearErrors: () => funcsRef.current.clearErrors(),
        refreshData: () => funcsRef.current.refreshData()
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}; 
import React, { useContext } from 'react';
import { Box, Typography, Grid, Avatar, Divider } from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';
import { FinancialContext } from '../../context/FinancialContext';

const FinanceSummary = ({ isMobile }) => {
  const { financialSummary } = useContext(FinancialContext);

  // Format currency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const summaryItems = [
    { 
      title: 'Total Revenue', 
      value: formatCurrency(financialSummary.totalRevenue || 0),
      icon: <MonetizationOnIcon />,
      color: '#34C759'
    },
    { 
      title: 'Total Expenses', 
      value: formatCurrency(financialSummary.totalExpenses || 0),
      icon: <ShoppingCartIcon />,
      color: '#FF3B30'
    },
    { 
      title: 'Net Profit', 
      value: formatCurrency((financialSummary.totalRevenue || 0) - (financialSummary.totalExpenses || 0)),
      icon: <TrendingUpIcon />,
      color: '#007AFF'
    },
    { 
      title: 'Asset Value', 
      value: formatCurrency(financialSummary.totalAssets || 0),
      icon: <AccountBalanceIcon />,
      color: '#5856D6'
    }
  ];

  return (
    <Box sx={{ p: 3, pt: 2 }}>
      <Grid container spacing={isMobile ? 2 : 3}>
        {summaryItems.map((item, index) => (
          <Grid item xs={12} sm={6} key={index}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2
              }}
            >
              <Avatar
                sx={{
                  bgcolor: `${item.color}20`,
                  color: item.color,
                  mr: 2
                }}
              >
                {item.icon}
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {item.title}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {item.value}
                </Typography>
              </Box>
            </Box>
            {isMobile && index < summaryItems.length - 1 && <Divider sx={{ opacity: 0.6, mb: 2 }} />}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FinanceSummary; 
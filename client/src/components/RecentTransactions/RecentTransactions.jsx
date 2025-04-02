import React, { useContext } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  Divider,
  Chip
} from '@mui/material';
import { 
  TrendingUp as TrendingUpIcon, 
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { FinancialContext } from '../../context/FinancialContext';

const RecentTransactions = ({ isMobile }) => {
  const { revenues, expenses } = useContext(FinancialContext);

  // Format currency function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date function
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Combine revenues and expenses
  const transactions = [
    ...revenues.map(r => ({ ...r, type: 'revenue' })),
    ...expenses.map(e => ({ ...e, type: 'expense' }))
  ]
  // Sort by date (newest first)
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  // Take only the first 5 transactions
  .slice(0, 5);

  return (
    <Box>
      {transactions.length > 0 ? (
        <List sx={{ p: 0 }}>
          {transactions.map((transaction, index) => (
            <React.Fragment key={transaction._id}>
              <ListItem
                alignItems="flex-start"
                sx={{ 
                  px: 3, 
                  py: 2,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.02)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: transaction.type === 'revenue' ? 'success.light' : 'error.light',
                      color: transaction.type === 'revenue' ? 'success.main' : 'error.main'
                    }}
                  >
                    {transaction.type === 'revenue' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, mr: 1, flex: 1 }}>
                        {transaction.description}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 600, 
                          color: transaction.type === 'revenue' ? 'success.main' : 'error.main'
                        }}
                      >
                        {transaction.type === 'revenue' 
                          ? formatCurrency(transaction.amount) 
                          : `-${formatCurrency(transaction.amount)}`}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', mt: 0.5, alignItems: 'center' }}>
                      <Chip
                        label={transaction.category}
                        size="small"
                        sx={{ 
                          mr: 1, 
                          height: 20, 
                          fontSize: '0.7rem', 
                          fontWeight: 500,
                          bgcolor: transaction.type === 'revenue' ? 'success.light' : 'error.light',
                          color: transaction.type === 'revenue' ? 'success.dark' : 'error.dark',
                          '& .MuiChip-label': { px: 1 }
                        }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarIcon sx={{ fontSize: '0.875rem', mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(transaction.date)}
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
              {index < transactions.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          height: isMobile ? 150 : 200,
          bgcolor: 'rgba(0,0,0,0.02)',
          borderRadius: 2,
          m: 2
        }}>
          <Typography variant="body1" color="text.secondary" align="center">
            No recent transactions
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Transactions will appear here as you add them
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RecentTransactions; 
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const Expense = require('../models/Expense');
const Revenue = require('../models/Revenue');
const Asset = require('../models/Asset');
const Transaction = require('../models/Transaction');

// @route   GET api/v1/dashboard/summary
// @desc    Get financial summary
// @access  Private
router.get('/summary', protect, async (req, res) => {
  try {
    // Get total expenses
    const totalExpenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get total revenue
    const totalRevenue = await Revenue.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get total assets value
    const totalAssets = await Asset.aggregate([
      { $group: { _id: null, total: { $sum: '$currentValue' } } }
    ]);
    
    // Get founder contributions
    const founderContributions = await User.aggregate([
      { $match: { role: 'founder' } },
      { $group: { _id: null, total: { $sum: '$fundContribution' } } }
    ]);
    
    // Get cash balance
    const cashBalance = await Transaction.aggregate([
      {
        $group: {
          _id: '$account',
          balance: {
            $sum: {
              $cond: [
                { $in: ['$type', ['income', 'investment']] },
                '$amount',
                { $multiply: ['$amount', -1] }
              ]
            }
          }
        }
      }
    ]);
    
    // Calculate pure profit
    const pureProfit = (totalRevenue[0]?.total || 0) - (totalExpenses[0]?.total || 0);
    
    // Create the response object
    const summary = {
      totalExpenses: totalExpenses[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0,
      pureProfit,
      totalAssets: totalAssets[0]?.total || 0,
      founderContributions: founderContributions[0]?.total || 0,
      cashBalance: cashBalance.reduce((acc, curr) => {
        acc[curr._id] = curr.balance;
        return acc;
      }, {})
    };
    
    res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   GET api/v1/dashboard/cash-flow
// @desc    Get cash flow data for a specific period
// @access  Private
router.get('/cash-flow', protect, async (req, res) => {
  try {
    const { startDate, endDate, interval = 'month' } = req.query;
    
    // Parse dates
    const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const end = endDate ? new Date(endDate) : new Date();
    
    // Determine the grouping format based on interval
    let dateFormat;
    if (interval === 'day') {
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    } else if (interval === 'week') {
      dateFormat = { 
        $dateToString: { 
          format: '%Y-%U', 
          date: '$date' 
        } 
      };
    } else if (interval === 'month') {
      dateFormat = { 
        $dateToString: { 
          format: '%Y-%m', 
          date: '$date' 
        } 
      };
    } else {
      dateFormat = { 
        $dateToString: { 
          format: '%Y', 
          date: '$date' 
        } 
      };
    }
    
    // Get cash flow data
    const cashFlow = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: dateFormat,
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          income: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0]
            }
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0]
            }
          },
          investment: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'investment'] }, '$total', 0]
            }
          },
          transfer: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'transfer'] }, '$total', 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          income: 1,
          expense: 1,
          investment: 1,
          transfer: 1,
          netCashFlow: { $subtract: ['$income', '$expense'] }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);
    
    res.json({
      success: true,
      data: cashFlow
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   GET api/v1/dashboard/founder-contributions
// @desc    Get founder contributions
// @access  Private
router.get('/founder-contributions', protect, async (req, res) => {
  try {
    const founders = await User.find({ role: 'founder' }).select('name fundContribution');
    
    res.json({
      success: true,
      data: founders
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router; 
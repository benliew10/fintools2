const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

// @route   GET api/v1/expenses
// @desc    Get all expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({ date: -1 })
      .populate('paidBy', 'name')
      .populate('approvedBy', 'name');
    
    res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   GET api/v1/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('paidBy', 'name')
      .populate('approvedBy', 'name');
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// Helper function to create a product from expense
const createProductFromExpense = async (expense, userId) => {
  // Only create product for Phone and Accessories categories and if isAsset is true
  if ((expense.category === 'Phone' || expense.category === 'Accessories') && expense.isAsset) {
    try {
      // Create product
      const product = await Product.create({
        name: expense.description,
        description: `Product from expense: ${expense.description}`,
        category: expense.category,
        purchasePrice: expense.amount,
        quantity: 1,
        purchaseDate: expense.date,
        relatedExpense: expense._id,
        isAsset: true,
        assetValue: expense.amount,
        createdBy: userId
      });
      
      // Update expense to mark product as created
      await Expense.findByIdAndUpdate(expense._id, { isProductCreated: true });
      
      return product;
    } catch (error) {
      console.error('Error creating product from expense:', error);
      return null;
    }
  }
  
  return null;
};

// @route   POST api/v1/expenses
// @desc    Add expense
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { description, amount, category, date, notes, isAsset } = req.body;
    
    // Determine if expense should be treated as asset automatically
    const autoAsset = (category === 'Phone' || category === 'Accessories');
    
    // Create expense
    const expense = await Expense.create({
      description,
      amount,
      category,
      date,
      notes,
      paidBy: req.user.id,
      isAsset: isAsset !== undefined ? isAsset : autoAsset
    });
    
    // Create product if it's a Phone or Accessories expense
    let product = null;
    if (expense.isAsset && (category === 'Phone' || category === 'Accessories')) {
      product = await createProductFromExpense(expense, req.user.id);
    }
    
    res.status(201).json({
      success: true,
      data: expense,
      product: product
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
});

// @route   PUT api/v1/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    // Check if category or isAsset status has changed
    const categoryChanged = req.body.category && req.body.category !== expense.category;
    const assetStatusChanged = req.body.isAsset !== undefined && req.body.isAsset !== expense.isAsset;
    
    // Update expense
    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('paidBy', 'name');
    
    // Create product if changed to Phone/Accessories category and isAsset is true
    let product = null;
    if ((categoryChanged || assetStatusChanged) && expense.isAsset && 
        (expense.category === 'Phone' || expense.category === 'Accessories') && 
        !expense.isProductCreated) {
      product = await createProductFromExpense(expense, req.user.id);
    }
    
    res.json({
      success: true,
      data: expense,
      product: product
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      
      return res.status(400).json({
        success: false,
        error: messages
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Server Error'
      });
    }
  }
});

// @route   DELETE api/v1/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // First, check if the expense exists
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    // If the expense has associated products, handle them first
    if (expense.isProductCreated) {
      // Find all products associated with this expense
      const products = await Product.find({ relatedExpense: expense._id });
      console.log(`Found ${products.length} products associated with expense ${expense._id}`);
      
      // Check if any products are already sold (can't delete sold products)
      const soldProducts = products.filter(p => !p.inStock);
      if (soldProducts.length > 0) {
        console.log(`Found ${soldProducts.length} sold products, cannot delete`);
        return res.status(400).json({
          success: false,
          error: `This expense cannot be deleted because it has ${soldProducts.length} related products that have been sold`
        });
      }
      
      // Delete all associated products 
      if (products.length > 0) {
        try {
          // Delete each product individually to trigger any hooks
          for (const product of products) {
            await Product.findByIdAndDelete(product._id);
            console.log(`Deleted associated product ${product._id}`);
          }
        } catch (err) {
          console.error(`Error deleting products: ${err.message}`);
          return res.status(500).json({
            success: false,
            error: `Failed to delete associated products: ${err.message}`
          });
        }
      }
    }
    
    // Now delete the expense
    await Expense.findByIdAndDelete(expense._id);
    console.log(`Successfully deleted expense ${expense._id}`);
    
    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error in DELETE /expenses/${req.params.id}:`, err);
    return res.status(500).json({
      success: false,
      error: `Server Error: ${err.message || 'Unknown error'}`
    });
  }
});

// @route   PUT api/v1/expenses/:id/approve
// @desc    Approve expense
// @access  Private
router.put('/:id/approve', protect, async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    // Check if user is an admin
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to approve expenses'
      });
    }
    
    // Update approval status
    expense = await Expense.findByIdAndUpdate(
      req.params.id, 
      {
        approved: true,
        approvedBy: req.user.id,
        approvalDate: Date.now()
      }, 
      {
        new: true,
        runValidators: true
      }
    ).populate('paidBy', 'name')
     .populate('approvedBy', 'name');
    
    res.json({
      success: true,
      data: expense
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   GET api/v1/expenses/:id/product
// @desc    Get product associated with an expense
// @access  Private
router.get('/:id/product', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    if (!expense.isProductCreated) {
      return res.status(404).json({
        success: false,
        error: 'No product associated with this expense'
      });
    }
    
    const product = await Product.findOne({ relatedExpense: expense._id });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router; 
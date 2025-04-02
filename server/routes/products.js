const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Expense = require('../models/Expense');
const Revenue = require('../models/Revenue');

// @route   GET api/v1/products
// @desc    Get all products
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .populate('relatedExpense');
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   GET api/v1/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('relatedExpense');
    
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

// @route   POST api/v1/products
// @desc    Add product
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    console.log('Creating new product with data:', req.body);
    
    // Validate required fields
    const { name, category, purchasePrice } = req.body;
    if (!name || !category || purchasePrice === undefined) {
      console.error('Missing required fields:', { name, category, purchasePrice });
      return res.status(400).json({
        success: false,
        error: 'Please provide name, category and purchase price'
      });
    }
    
    // Create product
    const product = await Product.create({
      ...req.body,
      createdBy: req.user.id,
      assetValue: req.body.purchasePrice * (req.body.quantity || 1)
    });
    
    console.log('Product created successfully:', product._id);
    
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (err) {
    console.error('Error creating product:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      console.error('Validation error messages:', messages);
      
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

// @route   PUT api/v1/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Calculate asset value based on purchase price and quantity
    let updateData = {
      ...req.body
    };
    
    if (req.body.purchasePrice || req.body.quantity) {
      const newPrice = req.body.purchasePrice || product.purchasePrice;
      const newQuantity = req.body.quantity || product.quantity;
      updateData.assetValue = newPrice * newQuantity;
    }
    
    // Update product
    product = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: product
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

// @route   DELETE api/v1/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Check if product is already sold
    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a product that has been sold'
      });
    }
    
    // Delete the product using findByIdAndDelete
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete product. Please try again.'
      });
    }
    
    // If this product was related to an expense, update the expense
    if (product.relatedExpense) {
      try {
        const relatedExpense = await Expense.findById(product.relatedExpense);
        if (relatedExpense) {
          // Check if there are any other products related to this expense
          const otherProducts = await Product.countDocuments({ relatedExpense: product.relatedExpense });
          
          if (otherProducts === 0) {
            // This was the last product, update the expense
            await Expense.findByIdAndUpdate(product.relatedExpense, { isProductCreated: false });
          }
        }
      } catch (updateErr) {
        console.error(`Warning: Could not update related expense: ${updateErr.message}`);
        // We still want to continue even if updating the expense fails
      }
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error deleting product: ${err.message}`);
    res.status(500).json({
      success: false,
      error: `Server Error: ${err.message}`
    });
  }
});

// @route   PUT api/v1/products/:id/mark-sold
// @desc    Mark a product as sold
// @access  Private
router.put('/:id/mark-sold', protect, async (req, res) => {
  try {
    const { sellingPrice, soldDate, notes, quantity: quantityToSell } = req.body;
    
    // Input validation
    if (!sellingPrice || !soldDate) {
      return res.status(400).json({
        success: false,
        error: 'Please provide selling price and sold date'
      });
    }
    
    // Find the product
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    // Check if product is already sold
    if (!product.inStock) {
      return res.status(400).json({
        success: false,
        error: 'Product is already marked as sold'
      });
    }
    
    // Check if there's enough quantity available
    if (quantityToSell > product.quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${product.quantity} item(s) available`
      });
    }
    
    const remainingQuantity = product.quantity - quantityToSell;
    const soldPrice = parseFloat(sellingPrice);
    let updatedProducts = [];
    
    // If we're selling all available quantity
    if (remainingQuantity === 0) {
      // Mark product as no longer in stock
      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          inStock: false,
          soldDate,
          soldPrice,
          notes: notes || product.notes
        },
        { new: true }
      );
      
      updatedProducts.push(updatedProduct);
    } else {
      // Selling only part of the quantity - create a new product record for the sold portion
      // Update the original product with the remaining quantity
      const updatedOriginalProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          quantity: remainingQuantity,
          assetValue: product.assetValue ? (product.assetValue / product.quantity) * remainingQuantity : null
        },
        { new: true }
      );
      
      // Create a new product record for the sold portion
      const soldProductPortion = new Product({
        name: product.name,
        description: product.description,
        category: product.category,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        quantity: quantityToSell,
        inStock: false,
        purchaseDate: product.purchaseDate,
        soldDate,
        soldPrice,
        supplier: product.supplier,
        serialNumber: product.serialNumber,
        relatedExpense: product.relatedExpense,
        isAsset: product.isAsset,
        assetValue: product.assetValue ? (product.assetValue / product.quantity) * quantityToSell : null,
        notes: notes || product.notes,
        createdBy: product.createdBy
      });
      
      const savedSoldProduct = await soldProductPortion.save();
      updatedProducts.push(updatedOriginalProduct, savedSoldProduct);
    }
    
    // Create a revenue entry for the sale
    const revenue = new Revenue({
      description: `Sale of ${quantityToSell} ${product.name}`,
      amount: soldPrice * quantityToSell,
      category: 'Sales',
      date: soldDate,
      notes: notes || `Revenue from selling ${product.name}`,
      receivedBy: req.user.id
    });
    
    const savedRevenue = await revenue.save();
    
    // Send back the updated product(s) and created revenue
    res.json({
      success: true,
      data: {
        products: updatedProducts,
        revenue: savedRevenue
      }
    });
  } catch (err) {
    console.error(`Error marking product as sold: ${err.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   POST api/v1/products/from-expense/:expenseId
// @desc    Create product from expense
// @access  Private
router.post('/from-expense/:expenseId', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.expenseId);
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }
    
    // Check if product already exists for this expense
    const existingProduct = await Product.findOne({ relatedExpense: expense._id });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        error: 'A product already exists for this expense'
      });
    }
    
    // Create default product data from expense
    const defaultProductData = {
      name: req.body.name || expense.description,
      description: req.body.description || `Product from expense: ${expense.description}`,
      category: ['Phone', 'Accessories'].includes(expense.category) ? expense.category : 'Other',
      purchasePrice: expense.amount,
      quantity: req.body.quantity || 1,
      purchaseDate: expense.date,
      supplier: req.body.supplier || '',
      serialNumber: req.body.serialNumber || '',
      relatedExpense: expense._id,
      isAsset: true,
      assetValue: expense.amount * (req.body.quantity || 1),
      notes: req.body.notes || '',
      createdBy: req.user.id
    };
    
    // Create the product with combined data
    const product = await Product.create({
      ...defaultProductData,
      ...req.body,
      relatedExpense: expense._id,
      createdBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: product
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
        error: 'Server Error',
        message: err.message
      });
    }
  }
});

module.exports = router; 
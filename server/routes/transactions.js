const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Asset = require('../models/Asset');
const { protect } = require('../middleware/auth');

// @route   GET api/v1/transactions
// @desc    Get all transactions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user', 'name email')
      .populate('relatedEntity')
      .sort({ date: -1 });
    
    res.json(transactions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/v1/transactions/:id
// @desc    Get transaction by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'name email')
      .populate('relatedEntity');
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    res.json(transaction);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST api/v1/transactions
// @desc    Create a transaction
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { 
      type, 
      amount, 
      description, 
      category, 
      date, 
      account,
      notes,
      isAsset,
      assetDetails
    } = req.body;
    
    // Start a MongoDB session for transaction (to ensure both asset and transaction are created)
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Create transaction object
      const newTransaction = new Transaction({
        user: req.user.id,
        type,
        amount,
        description,
        category,
        date,
        account: account || 'main',
        notes,
        createdBy: req.user.id
      });

      // If the expense is also an asset, create an asset entry
      if (type === 'expense' && isAsset && assetDetails) {
        const newAsset = new Asset({
          name: assetDetails.name || description,
          category: assetDetails.category || category,
          purchaseValue: assetDetails.purchaseValue || amount,
          currentValue: assetDetails.currentValue || amount,
          acquisitionDate: assetDetails.acquisitionDate || date,
          description: assetDetails.description || notes,
          condition: assetDetails.condition || 'Good',
          depreciationRate: assetDetails.depreciationRate || 0,
          lastValuationDate: new Date()
        });

        // Save the asset
        const savedAsset = await newAsset.save({ session });

        // Link the asset to the transaction
        newTransaction.relatedEntity = savedAsset._id;
        newTransaction.entityModel = 'Asset';
      }

      // Save the transaction
      const transaction = await newTransaction.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the complete transaction with populated fields
      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate('user', 'name email')
        .populate('relatedEntity');
      
      res.json(populatedTransaction);
    } catch (err) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/v1/transactions/:id
// @desc    Update a transaction
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { 
      type, 
      amount, 
      description, 
      category, 
      date, 
      account,
      notes,
      isAsset,
      assetDetails
    } = req.body;
    
    // Find transaction by ID
    let transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    // Check if transaction belongs to user
    if (transaction.createdBy && transaction.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Update transaction fields
      transaction.type = type || transaction.type;
      transaction.amount = amount || transaction.amount;
      transaction.description = description || transaction.description;
      transaction.category = category || transaction.category;
      transaction.date = date || transaction.date;
      transaction.account = account || transaction.account;
      transaction.notes = notes || transaction.notes;
      
      // Handle asset relationship
      if (type === 'expense' && isAsset) {
        // If the transaction already has a related asset
        if (transaction.relatedEntity && transaction.entityModel === 'Asset') {
          // Update the existing asset
          const existingAsset = await Asset.findById(transaction.relatedEntity);
          
          if (existingAsset) {
            existingAsset.name = assetDetails.name || description || existingAsset.name;
            existingAsset.category = assetDetails.category || category || existingAsset.category;
            existingAsset.purchaseValue = assetDetails.purchaseValue || amount || existingAsset.purchaseValue;
            existingAsset.currentValue = assetDetails.currentValue || amount || existingAsset.currentValue;
            existingAsset.acquisitionDate = assetDetails.acquisitionDate || date || existingAsset.acquisitionDate;
            existingAsset.description = assetDetails.description || notes || existingAsset.description;
            existingAsset.condition = assetDetails.condition || existingAsset.condition;
            existingAsset.depreciationRate = assetDetails.depreciationRate || existingAsset.depreciationRate;
            existingAsset.lastValuationDate = new Date();
            
            await existingAsset.save({ session });
          }
        } else if (assetDetails) {
          // Create a new asset for this transaction
          const newAsset = new Asset({
            name: assetDetails.name || description,
            category: assetDetails.category || category,
            purchaseValue: assetDetails.purchaseValue || amount,
            currentValue: assetDetails.currentValue || amount,
            acquisitionDate: assetDetails.acquisitionDate || date,
            description: assetDetails.description || notes,
            condition: assetDetails.condition || 'Good',
            depreciationRate: assetDetails.depreciationRate || 0,
            lastValuationDate: new Date()
          });
          
          const savedAsset = await newAsset.save({ session });
          
          // Link the new asset to the transaction
          transaction.relatedEntity = savedAsset._id;
          transaction.entityModel = 'Asset';
        }
      }
      
      // Save the updated transaction
      await transaction.save({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      // Fetch the updated transaction with populated fields
      const updatedTransaction = await Transaction.findById(transaction._id)
        .populate('user', 'name email')
        .populate('relatedEntity');
      
      res.json(updatedTransaction);
    } catch (err) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/v1/transactions/:id
// @desc    Delete a transaction
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // Find transaction by ID
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    // Check if transaction belongs to user
    if (transaction.createdBy && transaction.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // If the transaction is linked to an asset, ask if the asset should be deleted as well
      if (transaction.relatedEntity && transaction.entityModel === 'Asset') {
        // For now, we're not automatically deleting the asset when a transaction is deleted
        // This ensures that assets aren't accidentally removed
        // The asset will remain in the database
      }
      
      // Delete the transaction
      await transaction.remove({ session });
      
      // Commit the transaction
      await session.commitTransaction();
      session.endSession();
      
      res.json({ msg: 'Transaction removed' });
    } catch (err) {
      // If an error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Transaction not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router; 
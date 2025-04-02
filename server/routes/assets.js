const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Asset = require('../models/Asset');

// @route   GET api/v1/assets
// @desc    Get all assets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const assets = await Asset.find().sort({ name: 1 });
    
    res.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   GET api/v1/assets/:id
// @desc    Get single asset
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    res.json({
      success: true,
      data: asset
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   POST api/v1/assets
// @desc    Add asset
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    
    res.status(201).json({
      success: true,
      data: asset
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

// @route   PUT api/v1/assets/:id
// @desc    Update asset
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    // Update asset
    asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: asset
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

// @route   DELETE api/v1/assets/:id
// @desc    Delete asset
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // First check if asset exists
    const asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    // Check if the asset has any dependencies or relationships in other collections
    // This would need to be implemented based on your data model

    // Delete the asset using findByIdAndDelete instead of remove()
    const deletedAsset = await Asset.findByIdAndDelete(req.params.id);
    
    if (!deletedAsset) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete asset. Please try again.'
      });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error deleting asset: ${err.message}`);
    res.status(500).json({
      success: false,
      error: `Server Error: ${err.message}`
    });
  }
});

// @route   PUT api/v1/assets/:id/update-value
// @desc    Update asset value
// @access  Private
router.put('/:id/update-value', protect, async (req, res) => {
  try {
    const { currentValue, lastValuationDate = new Date() } = req.body;
    
    if (!currentValue) {
      return res.status(400).json({
        success: false,
        error: 'Current value is required'
      });
    }
    
    let asset = await Asset.findById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
    }
    
    // Update asset value
    asset = await Asset.findByIdAndUpdate(
      req.params.id, 
      {
        currentValue,
        lastValuationDate
      }, 
      {
        new: true,
        runValidators: true
      }
    );
    
    res.json({
      success: true,
      data: asset
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

// @route   GET api/v1/assets/category/:categoryName
// @desc    Get assets by category
// @access  Private
router.get('/category/:categoryName', protect, async (req, res) => {
  try {
    const assets = await Asset.find({ 
      category: req.params.categoryName 
    }).sort({ name: 1 });
    
    res.json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router; 
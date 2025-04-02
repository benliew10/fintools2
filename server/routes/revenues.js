const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Revenue = require('../models/Revenue');

// @route   GET api/v1/revenues
// @desc    Get all revenues
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const revenues = await Revenue.find()
      .sort({ date: -1 })
      .populate('receivedBy', 'name')
      .populate('verifiedBy', 'name');
    
    res.json({
      success: true,
      count: revenues.length,
      data: revenues
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   GET api/v1/revenues/:id
// @desc    Get single revenue
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const revenue = await Revenue.findById(req.params.id)
      .populate('receivedBy', 'name')
      .populate('verifiedBy', 'name');
    
    if (!revenue) {
      return res.status(404).json({
        success: false,
        error: 'Revenue not found'
      });
    }
    
    res.json({
      success: true,
      data: revenue
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

// @route   POST api/v1/revenues
// @desc    Add revenue
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { description, amount, category, date, client, notes } = req.body;
    
    // Create revenue
    const revenue = await Revenue.create({
      description,
      amount,
      category,
      date,
      client,
      notes,
      receivedBy: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: revenue
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

// @route   PUT api/v1/revenues/:id
// @desc    Update revenue
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let revenue = await Revenue.findById(req.params.id);
    
    if (!revenue) {
      return res.status(404).json({
        success: false,
        error: 'Revenue not found'
      });
    }
    
    // Update revenue
    revenue = await Revenue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('receivedBy', 'name');
    
    res.json({
      success: true,
      data: revenue
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

// @route   DELETE api/v1/revenues/:id
// @desc    Delete revenue
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    // First check if revenue exists
    const revenue = await Revenue.findById(req.params.id);
    
    if (!revenue) {
      return res.status(404).json({
        success: false,
        error: 'Revenue not found'
      });
    }
    
    // Check if the revenue has any dependencies or relationships
    // For now, just delete the revenue directly since there are no dependencies
    
    // Delete the revenue using findByIdAndDelete instead of remove()
    const deletedRevenue = await Revenue.findByIdAndDelete(req.params.id);
    
    if (!deletedRevenue) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete revenue. Please try again.'
      });
    }
    
    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(`Error deleting revenue: ${err.message}`);
    res.status(500).json({
      success: false,
      error: `Server Error: ${err.message}`
    });
  }
});

// @route   PUT api/v1/revenues/:id/verify
// @desc    Verify revenue
// @access  Private
router.put('/:id/verify', protect, async (req, res) => {
  try {
    let revenue = await Revenue.findById(req.params.id);
    
    if (!revenue) {
      return res.status(404).json({
        success: false,
        error: 'Revenue not found'
      });
    }
    
    // Check if user is an admin
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to verify revenues'
      });
    }
    
    // Update verification status
    revenue = await Revenue.findByIdAndUpdate(
      req.params.id, 
      {
        verified: true,
        verifiedBy: req.user.id,
        verificationDate: Date.now()
      }, 
      {
        new: true,
        runValidators: true
      }
    ).populate('receivedBy', 'name')
     .populate('verifiedBy', 'name');
    
    res.json({
      success: true,
      data: revenue
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
});

module.exports = router; 
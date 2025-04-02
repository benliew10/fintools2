const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'Real Estate', 
      'Vehicle', 
      'Equipment', 
      'Technology', 
      'Furniture', 
      'Intellectual Property', 
      'Investment', 
      'Other'
    ]
  },
  purchaseValue: {
    type: Number,
    required: [true, 'Please provide a purchase value'],
    min: [0, 'Value cannot be negative']
  },
  currentValue: {
    type: Number,
    required: [true, 'Please provide a current value'],
    min: [0, 'Value cannot be negative']
  },
  acquisitionDate: {
    type: Date,
    required: [true, 'Please provide an acquisition date']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor'],
    default: 'Good'
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  documents: {
    type: [String],
    // URLs to documents related to the asset
  },
  depreciationRate: {
    type: Number,
    min: [0, 'Depreciation rate cannot be negative'],
    max: [100, 'Depreciation rate cannot exceed 100%'],
    default: 0
  },
  lastValuationDate: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  }
});

// Create index for efficient queries
AssetSchema.index({ category: 1 });
AssetSchema.index({ acquisitionDate: -1 });

module.exports = mongoose.model('Asset', AssetSchema); 
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Phone', 'Accessories', 'Other']
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Please provide a purchase price'],
    min: [0, 'Price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  quantity: {
    type: Number,
    required: [true, 'Please provide quantity'],
    default: 1,
    min: [0, 'Quantity cannot be negative']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
    required: [true, 'Please provide purchase date']
  },
  soldDate: {
    type: Date
  },
  supplier: {
    type: String,
    trim: true
  },
  serialNumber: {
    type: String,
    trim: true
  },
  relatedExpense: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expense'
  },
  isAsset: {
    type: Boolean,
    default: true
  },
  assetValue: {
    type: Number
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
ProductSchema.index({ category: 1 });
ProductSchema.index({ inStock: 1 });
ProductSchema.index({ purchaseDate: -1 });

module.exports = mongoose.model('Product', ProductSchema); 
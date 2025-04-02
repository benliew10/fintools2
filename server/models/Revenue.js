const mongoose = require('mongoose');

const RevenueSchema = new mongoose.Schema({
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: [
      'Sales', 
      'Services', 
      'Investments', 
      'Grants', 
      'Royalties', 
      'Interest', 
      'Other'
    ]
  },
  date: {
    type: Date,
    default: Date.now
  },
  client: {
    type: String,
    trim: true
  },
  receivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invoice: {
    type: String,
    // URL to invoice document
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verificationDate: {
    type: Date
  }
});

// Create index for efficient queries
RevenueSchema.index({ date: -1 });
RevenueSchema.index({ category: 1 });
RevenueSchema.index({ client: 1 });

module.exports = mongoose.model('Revenue', RevenueSchema); 
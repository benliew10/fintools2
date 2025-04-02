const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: [true, 'Please provide a transaction type'],
    enum: ['income', 'expense', 'transfer', 'investment']
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount cannot be negative']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  date: {
    type: Date,
    default: Date.now,
    required: [true, 'Please provide a transaction date']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category']
  },
  account: {
    type: String,
    required: [true, 'Please specify the account'],
    enum: ['main', 'savings', 'investment', 'petty-cash']
  },
  relatedEntity: {
    type: mongoose.Schema.Types.ObjectId,
    // This can reference a User, Expense, Revenue, or Asset document
    refPath: 'entityModel'
  },
  entityModel: {
    type: String,
    enum: ['User', 'Expense', 'Revenue', 'Asset']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  attachments: {
    type: [String],
    // URLs to any related documents
  },
  reconciled: {
    type: Boolean,
    default: false
  }
});

// Create indexes for efficient queries
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ account: 1 });
TransactionSchema.index({ category: 1 });

module.exports = mongoose.model('Transaction', TransactionSchema); 
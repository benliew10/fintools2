const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
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
      'Salary', 
      'Rental', 
      'Utilities', 
      'Office Supplies', 
      'Equipment', 
      'Marketing', 
      'Transport', 
      'Insurance', 
      'Taxes', 
      'Phone',
      'Accessories',
      'Courier',
      'Bonus',
      'Advertisement',
      'Other'
    ]
  },
  date: {
    type: Date,
    default: Date.now
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receipt: {
    type: String,
    // URL to uploaded receipt image
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvalDate: {
    type: Date
  },
  isAsset: {
    type: Boolean,
    default: false
  },
  isProductCreated: {
    type: Boolean,
    default: false
  }
});

// Create index for efficient queries
ExpenseSchema.index({ date: -1 });
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ paidBy: 1 });
ExpenseSchema.index({ isAsset: 1 });
ExpenseSchema.index({ isProductCreated: 1 });

// Pre-remove hook to handle associated products
ExpenseSchema.pre('findOneAndDelete', async function(next) {
  try {
    const expenseId = this.getQuery()._id;
    
    // Check if expense exists and has products
    const expense = await this.model.findOne(this.getQuery());
    
    if (expense && expense.isProductCreated) {
      // We'll handle this in the route handler
      console.log(`Expense ${expenseId} has products attached that need handling`);
    }
    
    next();
  } catch (err) {
    console.error(`Error in expense pre-remove hook: ${err.message}`);
    next(err);
  }
});

module.exports = mongoose.model('Expense', ExpenseSchema); 
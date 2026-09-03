import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  monthlyBudget: {
    type: Number,
    required: [true, 'Please provide a monthly budget'],
    min: [0, 'Monthly budget must be greater than or equal to 0']
  },
  categoryBudgets: [
    {
      category: {
        type: String,
        required: true
      },
      limit: {
        type: Number,
        required: true,
        min: [0, 'Category limit must be greater than or equal to 0']
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

budgetSchema.index({ userId: 1 }, { unique: true });

export default mongoose.model('Budget', budgetSchema);

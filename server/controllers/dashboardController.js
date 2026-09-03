import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const [transactions, budget] = await Promise.all([
      Transaction.find({ userId: req.userId }).sort({ transactionDate: -1 }),
      Budget.findOne({ userId: req.userId })
    ]);

    const { totalIncome, totalExpense, savings, budgetRemaining, monthlyTrend, categoryBreakdown } =
      summarizeTransactions(transactions, budget);

    return res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        savings,
        budgetRemaining,
        monthlyTrend,
        categoryBreakdown,
        recentTransactions: transactions.slice(0, 5)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

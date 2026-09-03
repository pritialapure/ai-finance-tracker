import PDFDocument from 'pdfkit';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { summarizeTransactions } from '../services/financeAnalyzer.js';

const formatCurrency = (value) => `INR ${Math.round(value || 0).toLocaleString('en-IN')}`;

export const getMonthlyReport = async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = req.query.month !== undefined ? Number(req.query.month) : now.getMonth();

    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 1);

    const transactions = await Transaction.find({
      userId: req.userId,
      transactionDate: { $gte: start, $lt: end }
    }).sort({ transactionDate: -1 });

    const budget = await Budget.findOne({ userId: req.userId });

    const { totalIncome, totalExpense, savings, budgetRemaining, categoryBreakdown, monthlyTrend } =
      summarizeTransactions(transactions, budget);

    const period = `${start.toLocaleString('en-IN', { month: 'long' })} ${year}`;

    const report = {
      period,
      totalIncome,
      totalExpense,
      savings,
      budgetRemaining,
      categoryBreakdown,
      monthlyTrend,
      transactions
    };

    if (req.query.format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=finance-report-${year}-${String(month + 1).padStart(2, '0')}.pdf`
      );

      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);

      doc.fontSize(20).text('Finance Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(14).text(`Period: ${period}`);
      doc.moveDown();

      doc.fontSize(12);
      doc.text(`Total Income: ${formatCurrency(totalIncome)}`);
      doc.text(`Total Expense: ${formatCurrency(totalExpense)}`);
      doc.text(`Savings: ${formatCurrency(savings)}`);
      doc.text(`Budget Remaining: ${formatCurrency(budgetRemaining)}`);
      doc.moveDown();

      doc.fontSize(14).text('Category Breakdown', { underline: true });
      doc.fontSize(12);
      if (categoryBreakdown.length === 0) {
        doc.text('No expenses recorded for this period.');
      } else {
        categoryBreakdown.forEach((item) => {
          doc.text(`${item.category}: ${formatCurrency(item.amount)}`);
        });
      }
      doc.moveDown();

      doc.fontSize(14).text('Transactions', { underline: true });
      doc.fontSize(10);
      const limitedTransactions = transactions.slice(0, 40);
      if (limitedTransactions.length === 0) {
        doc.text('No transactions recorded for this period.');
      } else {
        limitedTransactions.forEach((t) => {
          const dateStr = new Date(t.transactionDate).toLocaleDateString('en-IN');
          doc.text(
            `${dateStr}  |  ${t.type.toUpperCase()}  |  ${t.title}  |  ${t.category}  |  ${formatCurrency(t.amount)}`
          );
        });
      }

      doc.end();
      return;
    }

    return res.status(200).json({ success: true, data: report });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

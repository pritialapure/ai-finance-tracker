const currency = (value) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`;

export const getMonthRange = (date = new Date()) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
};

export const summarizeTransactions = (transactions = [], budget = null) => {
  const income = transactions.filter((item) => item.type === 'income');
  const expenses = transactions.filter((item) => item.type === 'expense');

  const totalIncome = income.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const savings = totalIncome - totalExpense;

  const monthlyBudget = budget?.monthlyBudget || 0;
  const budgetRemaining = monthlyBudget > 0 ? monthlyBudget - totalExpense : savings;

  const categoryTotals = expenses.reduce((acc, item) => {
    const category = item.category || 'Other';
    acc[category] = (acc[category] || 0) + Number(item.amount || 0);
    return acc;
  }, {});

  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);

  const monthlyBuckets = new Map();
  transactions.forEach((item) => {
    const date = new Date(item.transactionDate || item.createdAt || Date.now());
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyBuckets.has(key)) {
      monthlyBuckets.set(key, { month: key, income: 0, expense: 0 });
    }

    const bucket = monthlyBuckets.get(key);
    if (item.type === 'income') {
      bucket.income += Number(item.amount || 0);
    } else {
      bucket.expense += Number(item.amount || 0);
    }
  });

  const monthlyTrend = Array.from(monthlyBuckets.values()).sort((a, b) =>
    a.month.localeCompare(b.month)
  );

  return {
    totalIncome,
    totalExpense,
    savings,
    budgetRemaining,
    monthlyBudget,
    categoryBreakdown,
    monthlyTrend
  };
};

export const analyzeFinance = ({ transactions = [], budget = null }) => {
  const summary = summarizeTransactions(transactions, budget);
  const expenses = transactions.filter((item) => item.type === 'expense');

  const insights = [];
  const recommendations = [];

  if (transactions.length === 0) {
    return {
      ...summary,
      insights: [
        'Add your first income and expense entries to start seeing personalized insights.',
        'Set a monthly budget so we can track how your spending compares against your goals.'
      ],
      recommendations: [
        'Start by logging your salary or primary income source.',
        'Record a few recent expenses to build a category breakdown.'
      ],
      predictedExpense: 0,
      confidence: 0
    };
  }

  const { totalIncome, totalExpense, savings, budgetRemaining, monthlyBudget, categoryBreakdown, monthlyTrend } =
    summary;

  if (categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0];
    const percentOfExpense = totalExpense > 0 ? Math.round((top.amount / totalExpense) * 100) : 0;
    insights.push(
      `${top.category} is your biggest expense category at ${currency(top.amount)} (${percentOfExpense}% of total spending).`
    );
  }

  if (monthlyBudget > 0) {
    if (budgetRemaining < 0) {
      insights.push(
        `You have exceeded your monthly budget of ${currency(monthlyBudget)} by ${currency(Math.abs(budgetRemaining))}.`
      );
    } else if (budgetRemaining < monthlyBudget * 0.2) {
      insights.push(
        `You are nearing your monthly budget limit — only ${currency(budgetRemaining)} remaining out of ${currency(monthlyBudget)}.`
      );
    } else {
      insights.push(
        `You are within budget with ${currency(budgetRemaining)} remaining out of your ${currency(monthlyBudget)} monthly limit.`
      );
    }
  }

  const categoryBudgets = budget?.categoryBudgets || [];
  categoryBudgets.forEach((cb) => {
    const spent = categoryBreakdown.find((c) => c.category === cb.category)?.amount || 0;
    if (spent > cb.limit) {
      insights.push(
        `You have overspent on ${cb.category} by ${currency(spent - cb.limit)} against a limit of ${currency(cb.limit)}.`
      );
    }
  });

  if (savings < 0) {
    insights.push(`Your expenses exceeded your income this period by ${currency(Math.abs(savings))}.`);
  } else {
    insights.push(`You saved ${currency(savings)} this period, which is a great sign of financial discipline.`);
  }

  if (categoryBreakdown.length > 0) {
    const top = categoryBreakdown[0];
    const potentialSavings = Math.round(top.amount * 0.15);
    recommendations.push(
      `Try reducing ${top.category} spending by 15% to save an extra ${currency(potentialSavings)} next month.`
    );
  }

  if (monthlyBudget > 0 && budgetRemaining < 0) {
    recommendations.push('Consider revisiting your monthly budget or cutting down on discretionary categories.');
  }

  if (totalIncome > 0 && savings / totalIncome < 0.1) {
    recommendations.push('Aim to save at least 10-20% of your income by trimming non-essential expenses.');
  }

  const expenseValues = monthlyTrend.map((bucket) => bucket.expense).filter((value) => value > 0);
  const predictedExpense =
    expenseValues.length > 0
      ? Math.round(expenseValues.reduce((sum, value) => sum + value, 0) / expenseValues.length)
      : totalExpense;

  const confidence = Math.min(95, Math.max(55, 60 + expenses.length * 3));

  return {
    ...summary,
    insights,
    recommendations,
    predictedExpense,
    confidence
  };
};

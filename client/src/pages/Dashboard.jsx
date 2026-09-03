import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import SummaryCard from '../components/dashboard/SummaryCard'
import { getDashboardSummary } from '../services/dashboardService'
import { formatCurrency, formatDate } from '../utils/format'

const COLORS = ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getDashboardSummary()
        setSummary(response.data.data)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return <p className="text-gray-500">Loading dashboard...</p>
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
        {error}
      </div>
    )
  }

  const trend = summary?.monthlyTrend || []
  const categories = summary?.categoryBreakdown || []
  const incomeExpense = trend.map((t) => ({ month: t.month, Income: t.income, Expense: t.expense }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500">Your financial overview at a glance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Income" value={formatCurrency(summary?.totalIncome)} tone="green" />
        <SummaryCard label="Total Expense" value={formatCurrency(summary?.totalExpense)} tone="red" />
        <SummaryCard label="Remaining Budget" value={formatCurrency(summary?.budgetRemaining)} tone="blue" />
        <SummaryCard label="Savings" value={formatCurrency(summary?.savings)} tone="slate" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="font-medium text-gray-800">Monthly Spending Trend</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={2} name="Expense" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-medium text-gray-800">Category Distribution</h3>
          <div className="mt-4 h-72">
            {categories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => entry.category}
                  >
                    {categories.map((entry, index) => (
                      <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-gray-500 flex items-center justify-center h-full">No expense data yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="font-medium text-gray-800">Income vs Expense</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpense}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="Income" fill="#059669" />
                <Bar dataKey="Expense" fill="#dc2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-medium text-gray-800">Recent Transactions</h3>
          <div className="mt-4 space-y-3">
            {summary?.recentTransactions?.length > 0 ? (
              summary.recentTransactions.map((t) => (
                <div key={t._id} className="flex justify-between items-start border-b pb-2 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      {t.category} • {formatDate(t.transactionDate)}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'income' ? '+' : '-'}
                    {formatCurrency(t.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No transactions yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard

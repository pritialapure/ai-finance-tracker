import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadMonthlyReport, getMonthlyReport } from '../services/reportService'
import { formatCurrency, formatDate } from '../utils/format'

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function Reports() {
  const now = new Date()
  const [period, setPeriod] = useState({ month: now.getMonth(), year: now.getFullYear() })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const params = useMemo(() => ({ ...period }), [period.month, period.year])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await getMonthlyReport(params)
        setReport(response.data.data)
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load report')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params])

  const exportPdf = async () => {
    try {
      const response = await downloadMonthlyReport(params)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute(
        'download',
        `finance-report-${period.year}-${String(period.month + 1).padStart(2, '0')}.pdf`
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to export PDF')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Reports</h2>
          <p className="text-sm text-gray-500">Monthly summary of your finances.</p>
        </div>
        <button
          onClick={exportPdf}
          className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Export PDF
        </button>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            value={period.month}
            onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            {monthNames.map((name, idx) => (
              <option key={name} value={idx}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={period.year}
            onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
        </div>
      </section>

      {loading && <p className="text-gray-500">Loading report...</p>}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      {report && !loading && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Income</p>
              <p className="text-xl font-bold text-emerald-600 mt-2">{formatCurrency(report.totalIncome)}</p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Expense</p>
              <p className="text-xl font-bold text-rose-600 mt-2">{formatCurrency(report.totalExpense)}</p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Savings</p>
              <p className="text-xl font-bold text-gray-800 mt-2">{formatCurrency(report.savings)}</p>
            </div>
            <div className="rounded-lg border bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-xl font-bold text-sky-600 mt-2">{formatCurrency(report.budgetRemaining)}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
              <h3 className="font-medium text-gray-800">Category Analytics</h3>
              <div className="mt-4 h-72">
                {report.categoryBreakdown?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500 flex items-center justify-center h-full">
                    No expense data for this period.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border bg-white p-5 shadow-sm">
              <h3 className="font-medium text-gray-800">Transactions</h3>
              <div className="mt-4 max-h-72 space-y-3 overflow-auto">
                {report.transactions?.length > 0 ? (
                  report.transactions.map((t) => (
                    <div key={t._id} className="flex justify-between items-start border-b pb-2 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{t.title}</p>
                        <p className="text-xs text-gray-500">
                          {t.category} • {formatDate(t.transactionDate)}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-semibold ${
                          t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No transactions for this period.</p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default Reports

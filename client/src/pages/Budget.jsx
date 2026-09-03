import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBudget, saveBudget } from '../redux/slices/budgetSlice'
import { getDashboardSummary } from '../services/dashboardService'
import { categories, formatCurrency } from '../utils/format'

function Budget() {
  const dispatch = useDispatch()
  const budget = useSelector((state) => state.budget)

  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [categoryBudgets, setCategoryBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [message, setMessage] = useState('')

  const loadSummary = async () => {
    try {
      const response = await getDashboardSummary()
      setSummary(response.data.data)
    } catch {
      // silently ignore; budget form can still function
    }
  }

  useEffect(() => {
    dispatch(fetchBudget())
    loadSummary()
  }, [dispatch])

  useEffect(() => {
    setMonthlyBudget(budget.monthlyBudget || 0)
    setCategoryBudgets(budget.categories || [])
  }, [budget.monthlyBudget, budget.categories])

  const addCategory = () => {
    setCategoryBudgets([...categoryBudgets, { category: categories[0], limit: 0 }])
  }

  const updateCategory = (i, field, value) => {
    const updated = [...categoryBudgets]
    updated[i] = { ...updated[i], [field]: field === 'limit' ? Number(value) : value }
    setCategoryBudgets(updated)
  }

  const removeCategory = (i) => {
    setCategoryBudgets(categoryBudgets.filter((_, idx) => idx !== i))
  }

  const save = async (e) => {
    e.preventDefault()
    setMessage('')
    const result = await dispatch(saveBudget({ monthlyBudget: Number(monthlyBudget), categoryBudgets }))
    if (saveBudget.fulfilled.match(result)) {
      setMessage('Budget saved successfully.')
      loadSummary()
    }
  }

  const totalExpense = summary?.totalExpense || 0
  const remaining = monthlyBudget - totalExpense
  const usedPercent = monthlyBudget > 0 ? Math.min(100, (totalExpense / monthlyBudget) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Budget</h2>
        <p className="text-sm text-gray-500">Set your monthly and category-wise spending limits.</p>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-md px-4 py-3">
          {message}
        </div>
      )}
      {budget.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
          {budget.error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <form onSubmit={save} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget</label>
              <input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
                min="0"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-800">Category Budgets</h3>
              <button
                type="button"
                onClick={addCategory}
                className="text-sm text-secondary font-medium hover:underline"
              >
                + Add Category
              </button>
            </div>

            <div className="space-y-3">
              {categoryBudgets.map((cb, i) => {
                const spent = summary?.categoryBreakdown?.find((c) => c.category === cb.category)?.amount || 0
                const percent = cb.limit > 0 ? Math.min(100, (spent / cb.limit) * 100) : 0

                return (
                  <div key={i} className="border rounded-md p-3 space-y-2">
                    <div className="flex gap-2 items-center">
                      <select
                        value={cb.category}
                        onChange={(e) => updateCategory(i, 'category', e.target.value)}
                        className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                      >
                        {categories.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={cb.limit}
                        onChange={(e) => updateCategory(i, 'limit', e.target.value)}
                        min="0"
                        className="w-28 border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeCategory(i)}
                        className="text-rose-600 text-sm hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${percent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(spent)} of {formatCurrency(cb.limit)} spent
                    </p>
                  </div>
                )
              })}
            </div>

            <button
              type="submit"
              disabled={budget.loading}
              className="bg-secondary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
            >
              {budget.loading ? 'Saving...' : 'Save Budget'}
            </button>
          </form>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-medium text-gray-800">Monthly Progress</h3>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Spent</p>
              <p className="text-lg font-semibold text-gray-800">{formatCurrency(totalExpense)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className={`text-lg font-semibold ${remaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Budget Used</p>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full ${usedPercent >= 100 ? 'bg-rose-500' : 'bg-sky-500'}`}
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
            </div>
            {remaining < 0 && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-md px-3 py-2">
                You have exceeded your monthly budget.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Budget

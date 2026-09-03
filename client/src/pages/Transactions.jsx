import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTransactions,
  removeTransactionById,
  saveTransaction
} from '../redux/slices/transactionSlice'
import { categories, formatCurrency, formatDate, paymentMethods } from '../utils/format'

const emptyForm = {
  type: 'expense',
  title: '',
  amount: '',
  category: 'Food',
  paymentMethod: 'upi',
  description: '',
  transactionDate: new Date().toISOString().slice(0, 10)
}

function Transactions() {
  const dispatch = useDispatch()
  const { transactions, pagination, loading, error } = useSelector((state) => state.transactions)

  const [filters, setFilters] = useState({ search: '', type: '', category: '', sort: 'latest', page: 1 })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const query = useMemo(() => ({ ...filters, limit: 10 }), [filters])

  useEffect(() => {
    dispatch(fetchTransactions(query))
  }, [dispatch, query])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (item) => {
    setEditingId(item._id)
    setForm({
      type: item.type,
      title: item.title,
      amount: item.amount,
      category: item.category,
      paymentMethod: item.paymentMethod,
      description: item.description || '',
      transactionDate: item.transactionDate ? item.transactionDate.slice(0, 10) : emptyForm.transactionDate
    })
    setShowForm(true)
  }

  const submitForm = async (e) => {
    e.preventDefault()
    setMessage('')
    const result = await dispatch(saveTransaction({ id: editingId, data: form }))
    if (saveTransaction.fulfilled.match(result)) {
      setShowForm(false)
      dispatch(fetchTransactions(query))
      setMessage(editingId ? 'Transaction updated successfully.' : 'Transaction added successfully.')
    } else {
      setMessage(result.payload || 'Failed to save transaction')
    }
  }

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return
    const result = await dispatch(removeTransactionById(item._id))
    if (removeTransactionById.fulfilled.match(result)) {
      dispatch(fetchTransactions(query))
      setMessage('Transaction deleted.')
    } else {
      setMessage(result.payload || 'Failed to delete transaction')
    }
  }

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: key === 'page' ? value : 1 }))
  }

  const resetFilters = () => {
    setFilters({ search: '', type: '', category: '', sort: 'latest', page: 1 })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Transactions</h2>
          <p className="text-sm text-gray-500">Track your income and expenses.</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          + Add Transaction
        </button>
      </div>

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          />
          <select
            value={filters.type}
            onChange={(e) => updateFilter('type', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="amount_desc">Amount high to low</option>
            <option value="amount_asc">Amount low to high</option>
          </select>
          <button
            onClick={resetFilters}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </section>

      {(error || message) && (
        <div
          className={`text-sm rounded-md px-4 py-3 border ${
            error
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {error || message}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3">{t.title}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{t.category}</td>
                    <td className="px-4 py-3">{formatDate(t.transactionDate)}</td>
                    <td className="px-4 py-3 capitalize">{t.paymentMethod?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(t.amount)}</td>
                    <td className="px-4 py-3 space-x-2">
                      <button onClick={() => openEdit(t)} className="text-secondary hover:underline">
                        Edit
                      </button>
                      <button onClick={() => deleteItem(t)} className="text-rose-600 hover:underline">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
          <span className="text-gray-500">
            Page {pagination.page} of {pagination.pages || 1}
          </span>
          <div className="space-x-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => updateFilter('page', pagination.page - 1)}
              className="border rounded-md px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => updateFilter('page', pagination.page + 1)}
              className="border rounded-md px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <input
                type="text"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />

              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
                min="0.01"
                step="0.01"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {paymentMethods.map((p) => (
                  <option key={p} value={p}>
                    {p.replace('_', ' ')}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={form.transactionDate}
                onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />

              <textarea
                placeholder="Description (optional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-white py-2.5 rounded-md font-medium hover:bg-blue-600 transition-colors disabled:opacity-60"
              >
                {loading ? 'Saving...' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions

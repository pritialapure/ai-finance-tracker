import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights, fetchPrediction } from '../redux/slices/insightSlice'
import { formatCurrency } from '../utils/format'

function Insights() {
  const dispatch = useDispatch()
  const { insights, predictions, provider, loading, error } = useSelector((state) => state.insights)

  const refresh = () => {
    dispatch(fetchInsights())
    dispatch(fetchPrediction())
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">AI Insights</h2>
          <p className="text-sm text-gray-500">Personalized recommendations based on your spending.</p>
        </div>
        <button
          onClick={refresh}
          className="bg-secondary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Refresh Insights
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-gray-800">Recommendations</h3>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600 capitalize">
              {provider || 'heuristic'}
            </span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Generating insights...</p>
          ) : insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm text-slate-700">
                  {insight}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Add transactions to generate insights.</p>
          )}
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-medium text-gray-800">Spending Prediction</h3>
          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Predicted Expense</p>
              <p className="text-lg font-semibold text-gray-800">
                {formatCurrency(predictions.predictedExpense)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Confidence</p>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="h-2.5 rounded-full bg-secondary"
                  style={{ width: `${predictions.confidence || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{predictions.confidence || 0}%</p>
            </div>
            {predictions.budgetRisk && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-md px-3 py-2">
                Predicted spending is above your monthly budget.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Insights

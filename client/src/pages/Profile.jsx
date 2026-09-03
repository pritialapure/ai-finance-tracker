import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfileThunk } from '../redux/slices/authSlice'
import { changePassword, getAccountStats } from '../services/authService'
import { formatCurrency } from '../utils/format'

function Profile() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  const [profile, setProfile] = useState({ name: '', email: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, email: user.email })
    }

    const loadStats = async () => {
      try {
        const response = await getAccountStats()
        setStats(response.data.data)
      } catch {
        // stats are supplementary; ignore failure
      }
    }
    loadStats()
  }, [user])

  const saveProfile = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    const result = await dispatch(updateProfileThunk(profile))
    if (updateProfileThunk.fulfilled.match(result)) {
      setMessage('Profile updated successfully.')
    } else {
      setError(result.payload || 'Failed to update profile')
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setMessage('Password changed successfully.')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to change password')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
        <p className="text-sm text-gray-500">Manage your account details and security.</p>
      </div>

      {message && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-md px-4 py-3">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">{error}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="font-medium text-gray-800">User Details</h3>
          <form onSubmit={saveProfile} className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              type="text"
              placeholder="Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="md:col-span-2 bg-secondary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors w-fit"
            >
              Save Profile
            </button>
          </form>

          <h3 className="font-medium text-gray-800 mt-8">Change Password</h3>
          <form onSubmit={savePassword} className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              type="password"
              placeholder="Current password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              required
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="New password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              required
              minLength={6}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="md:col-span-2 bg-secondary text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors w-fit"
            >
              Change Password
            </button>
          </form>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-medium text-gray-800">Account Statistics</h3>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-lg font-semibold text-gray-800">{stats?.transactionCount ?? 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Income</p>
              <p className="text-lg font-semibold text-emerald-600">{formatCurrency(stats?.totalIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expenses</p>
              <p className="text-lg font-semibold text-rose-600">{formatCurrency(stats?.totalExpense)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Savings</p>
              <p className="text-lg font-semibold text-gray-800">{formatCurrency(stats?.savings)}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Profile

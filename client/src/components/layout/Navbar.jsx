import { useSelector } from 'react-redux'

function Navbar() {
  const { user } = useSelector((state) => state.auth)

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-800">Finance Dashboard</h1>
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

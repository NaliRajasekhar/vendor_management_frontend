import ContactForm from './components/ContactForm.jsx'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import { createVendor } from './api/vendors.js'
import { postContact } from './api/index.js'
import SearchPage from './components/SearchPage.jsx'
import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { notifySuccess } from './lib/notify.js'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import Login from './components/Login.jsx'
import Logout from './components/Logout.jsx'
import VendorsList from './components/VendorsList.jsx'
import EditVendor from './components/EditVendor.jsx'
import Dashboard from './components/Dashboard.jsx'
import VendorClientPreview from './components/VendorClientPreview.jsx'
import VendorPreview from './components/VendorPreview.jsx'

function Layout() {
  const { isAuthenticated, user } = useAuth()
  return (
    <div>
      {isAuthenticated && (
        <nav className="top-nav">
          <div className="nav-left">
            <Link className="brand" to="/vendors" aria-label="Logisoft Home">
              <img className="brand-img" src= '/logisoft-logo.png' alt="Logisoft logo" />
            </Link>
          </div>
          <div className="nav-right">
            <Link className="btn" to="/dashboard">Dashboard</Link>
            <Link className="btn" to="/">Add Vendor</Link>
            <Link className="btn" to="/vendors">Active Vendors List</Link>
            <Link className="btn" to="/search">Search Vendors</Link>
            <div className="profile">
              <AccountCircleIcon className="avatar" />
              <div className="profile-menu">
                <div className="profile-name">{user?.email}</div>
                <Link className="profile-logout" to="/logout">Logout</Link>
              </div>
            </div>
          </div>
        </nav>
      )}
      <Outlet />
    </div>
  )
}

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function NewVendorPage() {
  async function handleSubmit(values) {
    // Route through contacts API to support MSV upload
    await postContact(values)
    notifySuccess('Saved contact to server.')
  }
  return (
    <div className="app">
      <h1 className="title">Add Vendor</h1>
      <ContactForm onSubmit={handleSubmit} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" gutter={8} />
        <Routes>
          <Route element={<Layout />}> 
            <Route index element={<RequireAuth><NewVendorPage /></RequireAuth>} />
            <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="vendors" element={<RequireAuth><VendorsList /></RequireAuth>} />
            <Route path="vendors/:id" element={<RequireAuth><VendorClientPreview /></RequireAuth>} />
            <Route path="vendors/:id/edit" element={<RequireAuth><EditVendor /></RequireAuth>} />
            <Route path="vendor/:vendorId" element={<RequireAuth><VendorPreview /></RequireAuth>} />
            <Route path="search" element={<RequireAuth><SearchPage /></RequireAuth>} />
            <Route path="login" element={<Login />} />
            <Route path="logout" element={<Logout />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}


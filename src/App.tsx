import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

// Lazy load pages
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Products = React.lazy(() => import('./pages/Products').then(module => ({ default: module.Products })));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails').then(module => ({ default: module.ProductDetails })));
const AddProduct = React.lazy(() => import('./pages/AddProduct').then(module => ({ default: module.AddProduct })));
const Categories = React.lazy(() => import('./pages/Categories').then(module => ({ default: module.Categories })));
const Attributes = React.lazy(() => import('./pages/Attributes').then(module => ({ default: module.Attributes })));
const Coupons = React.lazy(() => import('./pages/Coupons').then(module => ({ default: module.Coupons })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Ratings = React.lazy(() => import('./pages/Ratings').then(module => ({ default: module.Ratings })));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Orders = React.lazy(() => import('./pages/Orders').then(module => ({ default: module.Orders })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<AddProduct />} />
                <Route path="products/:id" element={<ProductDetails />} />
                <Route path="categories" element={<Categories />} />
                <Route path="attributes" element={<Attributes />} />
                <Route path="coupons" element={<Coupons />} />
                <Route path="ratings" element={<Ratings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

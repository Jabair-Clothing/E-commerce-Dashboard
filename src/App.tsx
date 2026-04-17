import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load pages
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Products = React.lazy(() => import('./pages/Products').then(module => ({ default: module.Products })));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails').then(module => ({ default: module.ProductDetails })));
const AddProduct = React.lazy(() => import('./pages/AddProduct').then(module => ({ default: module.AddProduct })));
const Categories = React.lazy(() => import('./pages/Categories').then(module => ({ default: module.Categories })));
const Attributes = React.lazy(() => import('./pages/Attributes').then(module => ({ default: module.Attributes })));
const Clients = React.lazy(() => import('./pages/Clients').then(module => ({ default: module.Clients })));
const ClientDetails = React.lazy(() => import('./pages/ClientDetails').then(module => ({ default: module.ClientDetails })));
const Contacts = React.lazy(() => import('./pages/Contacts').then(module => ({ default: module.Contacts })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));


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
        <Router basename={import.meta.env.BASE_URL}>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/login" element={<Login />} />



              <Route path="/" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<Products />} />
                <Route path="products/new" element={<AddProduct />} />
                <Route path="products/:id" element={
                  <ErrorBoundary>
                    <ProductDetails />
                  </ErrorBoundary>
                } />
                <Route path="categories" element={<Categories />} />
                <Route path="attributes" element={<Attributes />} />
                <Route path="clients" element={<Clients />} />
                <Route path="clients/:id" element={<ClientDetails />} />
                <Route path="contacts" element={<Contacts />} />
                <Route path="profile" element={<Profile />} />
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

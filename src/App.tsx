import React, { Suspense, lazy } from 'react';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout';

const HomePage = lazy(() => import('./pages/home'));
const WonCodesPage = lazy(() => import('./pages/won-codes'));
const AdminPage = lazy(() => import('./pages/admin'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
    },
  },
});

function PageLoader() {
  return <div className="py-12 text-center text-white">جاري التحميل...</div>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/won" component={WonCodesPage} />
              <Route path="/admin" component={AdminPage} />
              <Route>404</Route>
            </Switch>
          </Suspense>
        </Layout>
      </WouterRouter>
    </QueryClientProvider>
  );
}

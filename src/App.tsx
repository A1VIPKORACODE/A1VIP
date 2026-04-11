import React from 'react';
import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout';
import HomePage from './pages/home';
import WonCodesPage from './pages/won-codes';
import AdminPage from './pages/admin';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 30_000 } } });

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter>
        <Layout>
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/won" component={WonCodesPage} />
            <Route path="/admin" component={AdminPage} />
            <Route>404</Route>
          </Switch>
        </Layout>
      </WouterRouter>
    </QueryClientProvider>
  );
}

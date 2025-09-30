import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header, { type PageKey } from '@/components/Header';
import Register from '@/pages/Register';
import Feed from '@/pages/Feed';
import Compose from '@/pages/Compose';
import Groups from '@/pages/Groups';
import { apiClient } from '@/api/client';
import { storage } from '@/utils/storage';

interface HealthResponse {
  status: string;
  db: 'ok' | 'down';
  redis: 'ok' | 'down';
}

function RequireAuth() {
  return (
    <section aria-live="polite">
      <h1>需要匿名身份</h1>
      <p>请先前往 Register 页面获取 token，随后即可访问此区域。</p>
    </section>
  );
}

export function App() {
  const [page, setPage] = useState<PageKey>('register');
  const [token, setToken] = useState<string | null>(() => storage.getToken());
  const [shadowId, setShadowId] = useState<string | null>(() => storage.getShadowId());

  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.get<HealthResponse>('/health', { skipAuth: true }),
    refetchInterval: 30000,
    refetchOnWindowFocus: false
  });

  const isAuthenticated = useMemo(() => Boolean(token && shadowId), [token, shadowId]);

  let pageContent: JSX.Element;
  switch (page) {
    case 'register':
      pageContent = (
        <Register
          onRegistered={(data) => {
            setToken(data.token);
            setShadowId(data.shadowId);
          }}
          currentToken={token}
          shadowId={shadowId}
        />
      );
      break;
    case 'feed':
      pageContent = <Feed />;
      break;
    case 'compose':
      pageContent = isAuthenticated ? <Compose /> : <RequireAuth />;
      break;
    case 'groups':
      pageContent = isAuthenticated ? <Groups /> : <RequireAuth />;
      break;
    default:
      pageContent = <Feed />;
  }

  return (
    <>
      <Header
        currentPage={page}
        onNavigate={setPage}
        isAuthenticated={isAuthenticated}
        health={healthQuery.data}
        healthLoading={healthQuery.isLoading}
      />
      <main>{pageContent}</main>
    </>
  );
}

export default App;

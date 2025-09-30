import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { storage } from '@/utils/storage';

interface RegisterResponse {
  token: string;
  shadowId: string;
}

interface RegisterProps {
  onRegistered: (payload: RegisterResponse) => void;
  currentToken: string | null;
  shadowId: string | null;
}

export function Register({ onRegistered, currentToken, shadowId }: RegisterProps) {
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      return apiClient.post<RegisterResponse, { deviceFingerprint: string | null }>('/v1/register', {
        deviceFingerprint: null
      });
    },
    onSuccess: (data) => {
      storage.setAuth(data.token, data.shadowId);
      setError(null);
      onRegistered(data);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : '注册失败，请稍后再试';
      setError(message);
    }
  });

  return (
    <section aria-labelledby="register-title">
      <h1 id="register-title">注册匿名身份</h1>
      <p>点击下方按钮即可加入匿名社区并获取 shadowId 与访问 token。</p>
      <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? '生成中…' : 'Join as Anonymous'}
      </button>
      {error ? (
        <div className="alert" role="alert">
          {error}
        </div>
      ) : null}
      {currentToken && shadowId ? (
        <div className="success" role="status" aria-live="polite">
          已登录。Shadow ID：<code>{shadowId}</code>
          <br />访问 Token：<code>{currentToken}</code>
        </div>
      ) : null}
    </section>
  );
}

export default Register;

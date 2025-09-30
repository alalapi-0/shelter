import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

interface ComposePayload {
  text: string;
  topicTags: string[];
  groupId?: string | null;
}

export function Compose({ groupId }: { groupId?: string | null }) {
  const [text, setText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation<unknown, Error, ComposePayload>({
    mutationFn: async (payload) => {
      return apiClient.post('/v1/posts', payload);
    },
    onSuccess: (_data, variables) => {
      setFeedback('已发送匿名帖子');
      setError(null);
      setText('');
      setTagsInput('');
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (variables.groupId) {
        void queryClient.invalidateQueries({ queryKey: ['group-posts', variables.groupId] });
      }
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : '发送失败，请稍后再试';
      setFeedback(null);
      setError(message);
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!text.trim()) {
      setError('请填写想说的话。');
      return;
    }
    const topicTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    mutation.mutate({ text, topicTags, groupId: groupId ?? undefined });
  };

  return (
    <section aria-labelledby="compose-title">
      <h1 id="compose-title">发布匿名帖子</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="compose-text">想说的话</label>
          <textarea
            id="compose-text"
            name="compose-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={6}
            aria-required="true"
          />
        </div>
        <div className="form-group">
          <label htmlFor="compose-tags">主题标签（逗号分隔，可选）</label>
          <input
            id="compose-tags"
            type="text"
            name="compose-tags"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="生活, 情绪, 夜聊"
          />
        </div>
        <button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? '发布中…' : groupId ? '在小群里发一条' : '发布到主广场'}
        </button>
      </form>
      {feedback ? (
        <div className="success" role="status" aria-live="polite">
          {feedback}
        </div>
      ) : null}
      {error ? (
        <div className="alert" role="alert">
          {error}
        </div>
      ) : null}
    </section>
  );
}

export default Compose;

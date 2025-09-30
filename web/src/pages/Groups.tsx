import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import PostCard, { type Post } from '@/components/PostCard';

interface Group {
  id: string;
  name: string;
  capacity: number;
  memberCount: number;
}

interface GroupPostsResponse {
  items: Post[];
}

export function Groups() {
  const [group, setGroup] = useState<Group | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [postFeedback, setPostFeedback] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => apiClient.post<Group>('/v1/groups/join'),
    onSuccess: (data) => {
      setGroup(data);
      setJoinError(null);
      void queryClient.invalidateQueries({ queryKey: ['group-posts', data.id] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : '加入小群失败';
      setJoinError(message);
    }
  });

  const postsQuery = useQuery({
    queryKey: ['group-posts', group?.id],
    enabled: Boolean(group?.id),
    queryFn: () => apiClient.get<GroupPostsResponse>(`/v1/groups/${group!.id}/posts`)
  });

  const postMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/v1/posts', {
        text: newMessage,
        topicTags: [],
        groupId: group?.id
      }),
    onSuccess: () => {
      setPostFeedback('已在小群里发送一条悄悄话。');
      setPostError(null);
      setNewMessage('');
      void queryClient.invalidateQueries({ queryKey: ['group-posts', group?.id] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : '发送失败，请稍后再试';
      setPostFeedback(null);
      setPostError(message);
    }
  });

  const handlePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!group?.id) {
      setPostError('请先加入一个小群。');
      return;
    }
    if (!newMessage.trim()) {
      setPostError('请输入想分享的内容。');
      return;
    }
    postMutation.mutate();
  };

  return (
    <section aria-labelledby="groups-title">
      <h1 id="groups-title">匿名小群</h1>
      <p>加入一个容量有限的小群，与少数陌生影子低声对话。</p>
      <button type="button" onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
        {joinMutation.isPending ? '匹配中…' : 'Join a small group'}
      </button>
      {joinError ? (
        <div className="alert" role="alert">
          {joinError}
        </div>
      ) : null}
      {group ? (
        <div className="success" role="status" aria-live="polite">
          已加入小群 <strong>{group.name}</strong>（{group.memberCount}/{group.capacity} 人）
        </div>
      ) : null}

      {group ? (
        <form onSubmit={handlePost} aria-labelledby="group-compose-label">
          <div className="form-group">
            <label id="group-compose-label" htmlFor="group-message">
              在小群里说点什么
            </label>
            <input
              id="group-message"
              type="text"
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="一句悄悄话"
            />
          </div>
          <button type="submit" disabled={postMutation.isPending}>
            {postMutation.isPending ? '发送中…' : '发送到小群'}
          </button>
        </form>
      ) : null}

      {postFeedback ? (
        <div className="success" role="status" aria-live="polite">
          {postFeedback}
        </div>
      ) : null}
      {postError ? (
        <div className="alert" role="alert">
          {postError}
        </div>
      ) : null}

      {group ? (
        <section aria-label="小群帖子">
          <h2>群内最新帖子</h2>
          {postsQuery.isLoading ? <p role="status">加载中…</p> : null}
          {postsQuery.error ? (
            <div className="alert" role="alert">
              {(postsQuery.error as Error).message}
            </div>
          ) : null}
          <div className="posts-grid">
            {postsQuery.data?.items?.length
              ? postsQuery.data.items.map((post) => <PostCard key={post.id} post={post} />)
              : null}
            {postsQuery.data && postsQuery.data.items.length === 0 ? <p>小群里还很安静。</p> : null}
          </div>
        </section>
      ) : null}
    </section>
  );
}

export default Groups;

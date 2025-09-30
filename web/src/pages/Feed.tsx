import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import PostCard, { type Post } from '@/components/PostCard';

interface FeedResponse {
  items: Post[];
  nextCursor: string | null;
}

export function Feed() {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['feed'],
    queryFn: () => apiClient.get<FeedResponse>('/v1/posts')
  });

  return (
    <section aria-labelledby="feed-title">
      <h1 id="feed-title">匿名主广场</h1>
      {isLoading ? <p role="status">加载中…</p> : null}
      {error ? (
        <div className="alert" role="alert">
          {(error as Error).message}
        </div>
      ) : null}
      <div className="posts-grid">
        {data?.items?.length ? data.items.map((post) => <PostCard key={post.id} post={post} />) : null}
        {data && data.items.length === 0 ? <p>暂时还没有新的匿名帖子。</p> : null}
      </div>
      <button type="button" onClick={() => refetch()} disabled={isRefetching} aria-label="刷新主广场">
        {isRefetching ? '刷新中…' : '刷新'}
      </button>
    </section>
  );
}

export default Feed;

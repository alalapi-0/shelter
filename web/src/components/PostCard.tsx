import type { FC } from 'react';
import styles from './PostCard.module.css';

export interface Post {
  id: string;
  textClean: string;
  topicTags: string[];
  createdAt: string;
  groupId?: string | null;
}

export const PostCard: FC<{ post: Post }> = ({ post }) => {
  const createdLabel = new Date(post.createdAt).toLocaleString();
  return (
    <article className={styles.card} aria-label="Anonymous post">
      <div className={styles.meta}>
        <span>匿名影子</span>
        <time dateTime={post.createdAt}>{createdLabel}</time>
      </div>
      <div className={styles.content}>{post.textClean}</div>
      {post.groupId ? <div className={styles.meta}>群组：{post.groupId}</div> : null}
      {post.topicTags.length > 0 ? (
        <div className={styles.tags} aria-label="Topic tags">
          {post.topicTags.map((tag) => (
            <span key={tag} className={styles.tag}>
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default PostCard;

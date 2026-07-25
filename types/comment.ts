export interface CommentData {
  id: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  user: { id: string; username: string; name: string | null; image: string | null };
  replies: CommentData[];
}

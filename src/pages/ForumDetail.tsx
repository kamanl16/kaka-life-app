import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const ForumDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPostAndComments = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch post
        const { data: postData, error: postError } = await supabase
          .from('forum_posts')
          .select('*, profiles(username)')
          .eq('id', id)
          .single();
          
        if (postError) throw postError;
        setPost(postData);

        // Fetch comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('forum_comments')
          .select('*, profiles(username)')
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;
        setComments(commentsData || []);
        
      } catch (err: any) {
        console.error(err);
        setError("找不到此文章，可能已被刪除。");
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("請先登入才能留言！");
      navigate('/login');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase.from('forum_comments').insert([
      {
        post_id: id,
        author_id: user.id,
        content: newComment.trim()
      }
    ]).select('*, profiles(username)').single();

    setIsSubmitting(false);

    if (error) {
      alert("留言失敗：" + error.message);
    } else if (data) {
      setComments(prev => [...prev, data]);
      setNewComment('');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("您確定要刪除這篇文章嗎？（所有留言也會一併被刪除）")) return;

    const { error } = await supabase.from('forum_posts').delete().eq('id', id);
    if (error) {
      alert("刪除失敗：" + error.message);
    } else {
      navigate('/forum');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("確定刪除此留言？")) return;

    const { error } = await supabase.from('forum_comments').delete().eq('id', commentId);
    if (error) {
      alert("刪除失敗：" + error.message);
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center py-20 text-primary">
        <span className="material-symbols-outlined animate-spin text-[40px]">refresh</span>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
        <h2 className="font-headline-sm text-on-surface mb-6">{error || "文章不存在"}</h2>
        <Link to="/forum" className="text-primary hover:underline font-label-lg">回到論壇列表</Link>
      </div>
    );
  }

  const isPostAuthor = user?.id === post.author_id;
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-4 lg:py-8 flex flex-col gap-6">
      
      {/* Breadcrumb */}
      <nav className="flex items-center text-on-surface-variant font-label-md mb-2">
        <Link to="/forum" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">forum</span>
          論壇交流
        </Link>
        <span className="material-symbols-outlined text-[16px] mx-1">chevron_right</span>
        <span className="truncate">{post.category}</span>
      </nav>

      {/* Main Post */}
      <article className="bg-surface rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant relative">
        {(isPostAuthor || isAdmin) && (
          <button 
            onClick={handleDeletePost}
            className="absolute top-6 right-6 text-on-surface-variant hover:text-error hover:bg-error/10 p-2 rounded-full transition-all flex items-center justify-center"
            title="刪除文章"
          >
            <span className="material-symbols-outlined text-[20px]">delete</span>
          </button>
        )}
        
        <div className="flex items-center gap-3 mb-4 pr-10">
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-md text-label-md">
            {post.category}
          </span>
          <span className="text-on-surface-variant font-label-md flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">person</span>
            {post.profiles?.username || '用戶'}
          </span>
          <span className="text-on-surface-variant font-label-md flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            {new Date(post.created_at).toLocaleString()}
          </span>
        </div>

        <h1 className="font-headline-md md:font-headline-lg font-bold text-on-surface mb-6 leading-tight">
          {post.title}
        </h1>

        <div className="font-body-lg text-on-surface whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
      </article>

      {/* Comments Section */}
      <section className="bg-surface rounded-2xl p-6 md:p-8 shadow-sm border border-outline-variant mt-2">
        <h3 className="font-title-lg font-bold text-on-surface mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">chat</span>
          留言回覆 ({comments.length})
        </h3>

        {/* Comment List */}
        <div className="flex flex-col gap-5 mb-8">
          {comments.length === 0 ? (
            <p className="text-on-surface-variant font-body-md text-center py-6 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
              目前還沒有留言，快來搶頭香吧！
            </p>
          ) : (
            comments.map(comment => {
              const isCommentAuthor = user?.id === comment.author_id;
              
              return (
                <div key={comment.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 font-bold font-title-md">
                    {(comment.profiles?.username || 'U')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 bg-surface-container-lowest rounded-2xl rounded-tl-none p-4 border border-outline-variant/50 relative">
                    {(isCommentAuthor || isAdmin) && (
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="absolute top-3 right-3 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                        title="刪除留言"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-label-md font-bold text-on-surface">{comment.profiles?.username || '用戶'}</span>
                      <span className="font-label-sm text-on-surface-variant">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <div className="font-body-md text-on-surface whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 font-bold font-title-md">
            {user ? (profile?.username || user.email || 'U')[0].toUpperCase() : '?'}
          </div>
          <div className="flex-1 flex flex-col items-end gap-3">
            <textarea
              required
              rows={3}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder={user ? "寫下你的回覆..." : "請先登入才能留言"}
              disabled={!user || isSubmitting}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-4 font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-y disabled:opacity-50 disabled:bg-surface-variant"
            />
            <button
              type="submit"
              disabled={!user || !newComment.trim() || isSubmitting}
              className="bg-primary text-on-primary font-label-md px-6 py-2 rounded-full font-bold hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : null}
              送出留言
            </button>
          </div>
        </form>
      </section>

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = ['閒聊', '發問', '分享', '求助'];

export const Forum: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('forum_posts')
      .select(`
        *,
        profiles ( username ),
        forum_comments ( count )
      `)
      .order('created_at', { ascending: false });
    
    if (selectedCategory) {
      query = query.eq('category', selectedCategory);
    }
    
    if (debouncedQuery) {
      query = query.or(`title.ilike.%${debouncedQuery}%,content.ilike.%${debouncedQuery}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching forum posts:", error);
    } else if (data) {
      setPosts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, debouncedQuery]);

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("請先登入才能發佈文章！");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    const { error } = await supabase.from('forum_posts').insert([
      {
        author_id: user.id,
        title: newTitle,
        category: newCategory,
        content: newContent
      }
    ]);

    setIsSubmitting(false);

    if (error) {
      alert("發佈失敗：" + error.message);
    } else {
      setIsModalOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewCategory(CATEGORIES[0]);
      fetchPosts(); // Refresh the list
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("您確定要刪除這篇文章嗎？")) return;

    const { error } = await supabase.from('forum_posts').delete().eq('id', id);
    if (error) {
      alert("刪除失敗：" + error.message);
    } else {
      setPosts(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 lg:py-8 flex flex-col gap-6">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl shadow-sm border border-outline-variant">
        <div>
          <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2">論壇交流</h1>
          <p className="font-body-lg text-on-surface-variant">在這裡與卡加利的華人社群分享生活、發問求助。</p>
        </div>
        <button 
          onClick={() => {
            if (!user) navigate('/login');
            else setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-full font-label-lg font-bold hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
        >
          <span className="material-symbols-outlined">edit_square</span>
          發佈新文章
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 md:pb-0">
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`whitespace-nowrap px-4 py-2 rounded-full font-label-md transition-colors ${!selectedCategory ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
          >
            全部文章
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-label-md transition-colors ${selectedCategory === cat ? 'bg-primary text-on-primary' : 'bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋標題或內容..." 
            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-full text-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>
      </div>

      {/* Post List */}
      <div className="flex flex-col gap-4">
        {loading ? (
          <div className="py-12 flex justify-center text-primary">
            <span className="material-symbols-outlined animate-spin text-[40px]">refresh</span>
          </div>
        ) : posts.length > 0 ? (
          posts.map(post => {
            const isAuthor = user?.id === post.author_id;
            const isAdmin = profile?.role === 'admin';
            const canDelete = isAuthor || isAdmin;
            
            // Extract comment count safely
            const commentCount = post.forum_comments && post.forum_comments[0] ? post.forum_comments[0].count : 0;

            return (
              <Link 
                to={`/forum/${post.id}`} 
                key={post.id}
                className="bg-surface border border-outline-variant rounded-xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group relative flex flex-col md:flex-row gap-4 md:items-center"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-label-sm text-label-sm">
                      {post.category}
                    </span>
                    <span className="text-on-surface-variant font-label-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">person</span>
                      {post.profiles?.username || '用戶'}
                    </span>
                    <span className="text-on-surface-variant font-label-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="font-title-lg text-title-lg font-bold text-on-surface mb-2 group-hover:text-primary transition-colors line-clamp-1">{post.title}</h2>
                  <p className="font-body-md text-on-surface-variant line-clamp-2 md:line-clamp-1">{post.content}</p>
                </div>
                
                <div className="flex items-center justify-between md:flex-col md:justify-center md:items-end gap-2 md:w-24 shrink-0 border-t md:border-t-0 md:border-l border-outline-variant/50 pt-3 md:pt-0 md:pl-4">
                  <div className="flex items-center gap-1.5 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                    <span className="font-label-lg font-bold">{commentCount}</span>
                  </div>
                  {canDelete && (
                    <button 
                      onClick={(e) => handleDelete(e, post.id)} 
                      className="text-error hover:bg-error/10 p-1.5 rounded-full transition-colors flex items-center justify-center"
                      title="刪除文章"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
              </Link>
            )
          })
        ) : (
          <div className="py-16 flex flex-col items-center text-center bg-surface rounded-2xl border border-outline-variant border-dashed">
            <span className="material-symbols-outlined text-6xl text-surface-variant mb-4">forum</span>
            <h3 className="font-headline-sm text-on-surface mb-2">目前沒有相關討論</h3>
            <p className="text-on-surface-variant font-body-md">成為第一個發起討論的人吧！</p>
          </div>
        )}
      </div>

      {/* New Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl max-h-full rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface shrink-0">
              <h2 className="font-title-lg font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_square</span>
                發佈新文章
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmitPost} className="overflow-y-auto p-6 flex flex-col gap-5">
              <div>
                <label className="block font-label-md text-on-surface mb-1.5">分類</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-4 py-1.5 rounded-full font-label-md border transition-colors ${newCategory === cat ? 'bg-primary-container text-on-primary-container border-primary-container font-bold' : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-variant'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-label-md text-on-surface mb-1.5">標題 <span className="text-error">*</span></label>
                <input 
                  required
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="請輸入一個清楚的標題" 
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-label-md text-on-surface mb-1.5">內容 <span className="text-error">*</span></label>
                <textarea 
                  required
                  rows={8}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="詳細描述您的問題或分享..." 
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-y"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-outline-variant">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-lg font-label-md text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 rounded-lg font-label-md bg-primary text-on-primary font-bold hover:shadow-md hover:brightness-110 transition-all disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting ? <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span> : null}
                  發佈文章
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

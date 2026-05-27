import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface NewsArticle {
  id: string;
  title: string;
  link: string;
  pub_date: string;
  content_snippet: string;
  image_url: string;
  source: string;
  category: string;
}

export const News: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('全部新聞');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10); // Load more state

  const categories = ['全部新聞', '本地', '社區', '經濟', '活動', '生活'];

  // Reset pagination when category changes
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setVisibleCount(10);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('pub_date', { ascending: false });

      if (error) {
        console.error('Error fetching news:', error);
      } else {
        setArticles(data || []);
      }
    } catch (error) {
      console.error('Error in fetchNews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter articles based on active category
  const filteredArticles = activeCategory === '全部新聞' 
    ? articles 
    : articles.filter(article => article.category === activeCategory);

  // Extract the featured article (latest) and the rest of the list
  const featuredArticle = filteredArticles.length > 0 ? filteredArticles[0] : null;
  const allListArticles = filteredArticles.length > 1 ? filteredArticles.slice(1) : [];
  
  // Sliced articles for 'Load More' pattern
  const currentListArticles = allListArticles.slice(0, visibleCount);
  const hasMore = visibleCount < allListArticles.length;

  // Helper to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 lg:py-8 flex flex-col gap-8">
      
      {/* Header and Category Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-outline-variant pb-4">
        <div>
          <h1 className="font-display-lg-mobile md:font-headline-md text-display-lg-mobile md:text-headline-md text-on-surface font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl md:text-4xl" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>newspaper</span>
            新聞動態
          </h1>
          <p className="font-body-md text-on-surface-variant mt-2">為您提供卡加利最新、最熱門的在地資訊。</p>
        </div>
        
        {/* Category Chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button 
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-label-md text-label-md transition-colors border ${
                activeCategory === cat 
                  ? 'bg-primary text-on-primary border-primary shadow-sm' 
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Featured & Main List */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          
          {loading ? (
            <div className="flex justify-center py-20 text-on-surface-variant">
              <p>載入新聞中...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant bg-surface-container-lowest rounded-2xl border border-outline-variant">
              <span className="material-symbols-outlined text-4xl mb-2">article</span>
              <p>目前沒有 {activeCategory !== '全部新聞' ? activeCategory : ''} 相關的新聞</p>
            </div>
          ) : (
            <>
              {/* Featured Article */}
              {featuredArticle && (
                <article 
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative"
                  onClick={() => window.open(featuredArticle.link, '_blank')}
                >
                  <div className="h-64 sm:h-80 w-full relative overflow-hidden bg-surface-variant flex items-center justify-center">
                    {featuredArticle.image_url ? (
                      <img 
                        alt="Featured News" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        src={featuredArticle.image_url} 
                      />
                    ) : (
                      <span className="material-symbols-outlined text-6xl text-outline opacity-50">image</span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-primary text-on-primary font-label-sm text-label-sm px-3 py-1.5 rounded-full shadow-md font-bold">{featuredArticle.category || '最新消息'}</span>
                    </div>
                    <div className="absolute bottom-0 left-0 p-6 w-full text-on-tertiary">
                      <h2 className="font-headline-md text-2xl md:text-3xl font-bold mb-2 drop-shadow-md line-clamp-2">{featuredArticle.title}</h2>
                      <div className="flex items-center gap-4 text-sm text-surface-variant font-label-sm">
                        <span>{formatDate(featuredArticle.pub_date)}</span>
                        <span>{featuredArticle.source}</span>
                      </div>
                    </div>
                  </div>
                </article>
              )}

              {/* Article List */}
              {currentListArticles.length > 0 && (
                <div className="flex flex-col gap-6">
                  <h3 className="font-headline-sm text-on-surface font-bold border-l-4 border-primary pl-3">其他發佈</h3>
                  
                  {currentListArticles.map((article) => (
                    <article 
                      key={article.id} 
                      className="flex flex-col sm:flex-row gap-4 bg-surface-container-lowest rounded-xl p-4 border border-outline-variant hover:shadow-md transition-shadow group cursor-pointer"
                      onClick={() => window.open(article.link, '_blank')}
                    >
                      <div className="w-full sm:w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-surface-variant flex items-center justify-center">
                        {article.image_url ? (
                          <img 
                            src={article.image_url} 
                            alt="News" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-4xl text-outline opacity-50">newspaper</span>
                        )}
                      </div>
                      <div className="flex flex-col flex-grow">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-secondary/10 text-secondary font-label-sm px-2 py-0.5 rounded">{article.category || '新聞'}</span>
                          <span className="text-on-surface-variant font-label-sm">{formatDate(article.pub_date)}</span>
                          <span className="text-on-surface-variant font-label-sm text-xs ml-auto border border-outline px-2 rounded-full">{article.source}</span>
                        </div>
                        <h4 className="font-headline-sm text-lg font-bold text-on-surface line-clamp-2 group-hover:text-primary transition-colors mb-2">{article.title}</h4>
                        <p className="font-body-md text-on-surface-variant line-clamp-2">{article.content_snippet}</p>
                      </div>
                    </article>
                  ))}

                  {/* Pagination Button */}
                  {hasMore && (
                    <div className="flex justify-center mt-4">
                      <button 
                        onClick={() => setVisibleCount(prev => prev + 10)}
                        className="px-6 py-2 border border-outline text-on-surface font-label-md rounded-lg hover:bg-surface-container-low transition-colors"
                      >
                        加載更多新聞
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side: Sidebar */}
        <aside className="flex flex-col gap-6">
          
          {/* Trending Topics Widget */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
            <h3 className="font-headline-sm text-on-surface font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">trending_up</span>
              熱門新聞
            </h3>
            <ul className="flex flex-col gap-4">
              {articles.slice(0, 4).map((article, index) => {
                const colorClasses = ['text-primary', 'text-secondary', 'text-tertiary', 'text-outline'];
                const colorClass = colorClasses[index] || 'text-outline';
                return (
                  <li 
                    key={article.id} 
                    className="flex items-start gap-3 cursor-pointer group"
                    onClick={() => window.open(article.link, '_blank')}
                  >
                    <span className={`font-bold text-lg ${colorClass}`}>{index + 1}</span>
                    <div>
                      <h4 className="font-label-md text-on-surface group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {article.title}
                      </h4>
                      <span className="font-label-sm text-on-surface-variant flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]">language</span>
                        {article.source}
                      </span>
                    </div>
                  </li>
                );
              })}
              {articles.length === 0 && (
                <li className="text-on-surface-variant font-label-md py-4 text-center border border-dashed border-outline-variant rounded-lg">
                  正在載入熱門新聞...
                </li>
              )}
            </ul>
          </div>
        </aside>

      </div>
    </div>
  );
};

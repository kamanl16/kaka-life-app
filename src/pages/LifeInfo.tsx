import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const SUBCATEGORIES: Record<string, string[]> = {
  '房屋資訊': ['獨立屋', '公寓', '房間分租', '短期租約', '其他'],
  '招聘求職': ['全職', '兼職', '合約', '實習', '其他'],
  '二手交易': ['電子產品', '傢俱寢具', '汽車與配件', '衣物飾品', '其他'],
  '社區資訊': ['活動聚會', '尋人尋物', '義工招募', '其他'],
  '生活服務': ['搬家接送', '清潔保潔', '維修裝修', '專業服務', '其他'],
};

export const LifeInfo: React.FC = () => {
  const { user, profile } = useAuth();
  const [classifieds, setClassifieds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [viewingAd, setViewingAd] = useState<any>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedSubcategory(null);
  }, [selectedCategory]);

  useEffect(() => {
    const fetchClassifieds = async () => {
      setLoading(true);
      let query = supabase
        .from('classifieds')
        .select(`
          *,
          profiles ( username )
        `)
        .order('created_at', { ascending: false });
      
      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }
      
      if (selectedSubcategory) {
        query = query.eq('subcategory', selectedSubcategory);
      }
      
      if (debouncedQuery) {
        query = query.or(`title.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching classifieds:", error);
      }
      
      if (data) {
        let sortedData = [...data];
        
        if (sortBy !== 'newest') {
          // Helper to extract numbers from text (e.g. "$1,500/mo" -> 1500)
          const extractPrice = (priceStr: string) => {
            if (!priceStr) return 0;
            const match = priceStr.match(/\d+(?:,\d+)*(?:\.\d+)?/);
            return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
          };

          sortedData.sort((a, b) => {
            const priceA = extractPrice(a.price);
            const priceB = extractPrice(b.price);
            return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
          });
        }
        
        setClassifieds(sortedData);
      }
      setLoading(false);
    };

    fetchClassifieds();
  }, [selectedCategory, selectedSubcategory, sortBy, debouncedQuery]);

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("您確定要刪除這筆貼文嗎？")) return;

    const { error } = await supabase.from('classifieds').delete().eq('id', id);
    if (error) {
      alert("刪除失敗：" + error.message);
    } else {
      setClassifieds(prev => prev.filter(ad => ad.id !== id));
    }
  };
  return (
    <div className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 lg:py-8 flex flex-col lg:flex-row gap-gutter">
      {/* SideNavBar */}
      <aside className="hidden lg:flex w-full lg:w-64 shrink-0 bg-surface rounded-xl shadow-md border border-outline-variant flex-col gap-base p-4 h-fit sticky top-[104px]">
        <div className="mb-4">
          <h2 className="font-headline-sm text-headline-sm font-bold text-primary">生活分類</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">卡加利在地指南</p>
        </div>
        <nav className="flex flex-col gap-2">
          <div className="relative mb-2">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" 
              placeholder="搜尋生活服務、租屋..." 
              type="text" 
            />
          </div>
          <button onClick={() => handleCategoryClick('房屋資訊')} className={`${selectedCategory === '房屋資訊' ? 'bg-primary-container text-on-primary-container font-bold opacity-100' : 'text-on-surface-variant hover:bg-surface-variant opacity-80'} rounded-lg font-label-md text-label-md p-3 flex items-center gap-3 transition-colors text-left`}>
            <span className="material-symbols-outlined" data-icon="home" data-weight={selectedCategory === '房屋資訊' ? 'fill' : 'regular'} style={selectedCategory === '房屋資訊' ? { fontVariationSettings: '"FILL" 1' } : {}}>home</span>房屋資訊
          </button>
          <button onClick={() => handleCategoryClick('招聘求職')} className={`${selectedCategory === '招聘求職' ? 'bg-primary-container text-on-primary-container font-bold opacity-100' : 'text-on-surface-variant hover:bg-surface-variant opacity-80'} rounded-lg font-label-md text-label-md p-3 flex items-center gap-3 transition-colors text-left`}>
            <span className="material-symbols-outlined" data-icon="work">work</span>招聘求職
          </button>
          <button onClick={() => handleCategoryClick('二手交易')} className={`${selectedCategory === '二手交易' ? 'bg-primary-container text-on-primary-container font-bold opacity-100' : 'text-on-surface-variant hover:bg-surface-variant opacity-80'} rounded-lg font-label-md text-label-md p-3 flex items-center gap-3 transition-colors text-left`}>
            <span className="material-symbols-outlined" data-icon="shopping_bag">shopping_bag</span>二手交易
          </button>
          <button onClick={() => handleCategoryClick('社區資訊')} className={`${selectedCategory === '社區資訊' ? 'bg-primary-container text-on-primary-container font-bold opacity-100' : 'text-on-surface-variant hover:bg-surface-variant opacity-80'} rounded-lg font-label-md text-label-md p-3 flex items-center gap-3 transition-colors text-left`}>
            <span className="material-symbols-outlined" data-icon="groups">groups</span>社區資訊
          </button>
          <button onClick={() => handleCategoryClick('生活服務')} className={`${selectedCategory === '生活服務' ? 'bg-primary-container text-on-primary-container font-bold opacity-100' : 'text-on-surface-variant hover:bg-surface-variant opacity-80'} rounded-lg font-label-md text-label-md p-3 flex items-center gap-3 transition-colors text-left`}>
            <span className="material-symbols-outlined" data-icon="build">build</span>生活服務
          </button>
        </nav>
        <div className="mt-6 pt-6 border-t border-outline-variant">
          <Link to="/publish" className="block w-full bg-secondary-container text-on-secondary-container font-label-md text-label-md font-bold px-4 py-3 rounded-lg shadow-sm hover:brightness-95 transition-all text-center">立即刊登</Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col gap-6">
        
        {/* Mobile Search Bar */}
        <section className="lg:hidden w-full">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm" 
              placeholder="搜尋生活服務、租屋..." 
              type="text" 
            />
          </div>
        </section>

        {/* Mobile Category Chips */}
        <section className="lg:hidden w-full">
          <h2 className="font-headline-sm text-headline-sm text-on-background mb-3">生活分類</h2>
          <div className="flex flex-wrap gap-2.5 pb-2">
            <button onClick={() => handleCategoryClick('房屋資訊')} className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-transform active:scale-95 ${selectedCategory === '房屋資訊' ? 'bg-primary text-on-primary shadow-sm' : 'bg-primary-container/10 text-primary border border-primary-container/20'}`}>
              <span className="material-symbols-outlined text-sm" data-icon="home">home</span>
              <span className="font-label-md text-label-md">房屋資訊</span>
            </button>
            <button onClick={() => handleCategoryClick('招聘求職')} className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-transform active:scale-95 ${selectedCategory === '招聘求職' ? 'bg-secondary text-on-secondary shadow-sm' : 'bg-secondary-container/10 text-secondary border border-secondary-container/20'}`}>
              <span className="material-symbols-outlined text-sm" data-icon="work">work</span>
              <span className="font-label-md text-label-md">招聘求職</span>
            </button>
            <button onClick={() => handleCategoryClick('二手交易')} className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-transform active:scale-95 ${selectedCategory === '二手交易' ? 'bg-tertiary text-on-tertiary shadow-sm' : 'bg-tertiary-container/10 text-tertiary border border-tertiary-container/20'}`}>
              <span className="material-symbols-outlined text-sm" data-icon="shopping_bag">shopping_bag</span>
              <span className="font-label-md text-label-md">二手交易</span>
            </button>
            <button onClick={() => handleCategoryClick('社區資訊')} className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-transform active:scale-95 ${selectedCategory === '社區資訊' ? 'bg-primary text-on-primary shadow-sm' : 'bg-primary-container/10 text-primary border border-primary-container/20'}`}>
              <span className="material-symbols-outlined text-sm" data-icon="groups">groups</span>
              <span className="font-label-md text-label-md">社區資訊</span>
            </button>
            <button onClick={() => handleCategoryClick('生活服務')} className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-transform active:scale-95 ${selectedCategory === '生活服務' ? 'bg-secondary text-on-secondary shadow-sm' : 'bg-secondary-container/10 text-secondary border border-secondary-container/20'}`}>
              <span className="material-symbols-outlined text-sm" data-icon="build">build</span>
              <span className="font-label-md text-label-md">生活服務</span>
            </button>
          </div>
        </section>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 rounded-xl shadow-[0_2px_8px_rgba(42,24,0,0.05)] border border-outline-variant/30">
          <div className="flex flex-wrap gap-2 pb-2 sm:pb-0 w-full sm:w-auto">
            {selectedCategory ? (
              <>
                <button 
                  onClick={() => setSelectedSubcategory(null)}
                  className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-md text-label-md border transition-colors ${!selectedSubcategory ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant border-outline-variant'}`}
                >
                  全部{selectedCategory}
                </button>
                {SUBCATEGORIES[selectedCategory].map(sub => (
                  <button 
                    key={sub}
                    onClick={() => setSelectedSubcategory(sub)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full font-label-md text-label-md border transition-colors ${selectedSubcategory === sub ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-variant border-outline-variant'}`}
                  >
                    {sub}
                  </button>
                ))}
              </>
            ) : (
              <span className="text-on-surface-variant text-label-md py-1.5">請先選擇上方的大分類以查看細項...</span>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 text-on-surface-variant w-full sm:w-auto ml-auto">
            <span className="material-symbols-outlined" data-icon="sort">sort</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-label-md font-label-md focus:ring-0 outline-none cursor-pointer"
            >
              <option value="newest">最新發佈</option>
              <option value="price_asc">價格：由低到高</option>
              <option value="price_desc">價格：由高到低</option>
            </select>
          </div>
        </div>

        {/* Bento Grid Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center text-primary">
              <span className="material-symbols-outlined animate-spin text-[40px]">refresh</span>
            </div>
          ) : classifieds.length > 0 ? (
            classifieds.map(ad => {
              const isAuthor = user?.id === ad.author_id;
              const isAdmin = profile?.role === 'admin';
              const canDelete = isAuthor || isAdmin;

              return (
                <article 
                  key={ad.id} 
                  onClick={() => setViewingAd(ad)}
                  className="relative bg-surface rounded-2xl border border-[#E0E0E0] overflow-hidden shadow-[0_4px_12px_rgba(0,7,103,0.08)] hover:shadow-[0_8px_24px_rgba(0,7,103,0.12)] transition-shadow duration-300 flex flex-col group cursor-pointer"
                >
                  {canDelete && (
                    <button 
                      onClick={(e) => handleDelete(e, ad.id)} 
                      className="absolute top-3 right-3 bg-error/90 backdrop-blur-sm text-on-error w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-error hover:scale-110 transition-all z-20"
                      title="刪除貼文"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}

                  {ad.image_url ? (
                  <div className="h-48 bg-surface-container relative overflow-hidden">
                    <img alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={ad.image_url} />
                    {ad.price && (
                      <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-on-primary px-2 py-1 rounded font-label-sm text-label-sm shadow-sm">
                        {ad.price}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-surface-container to-surface-container-high relative overflow-hidden flex items-center justify-center">
                    <span className="material-symbols-outlined text-[64px] text-surface-variant">image_not_supported</span>
                    {ad.price && (
                      <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-on-primary px-2 py-1 rounded font-label-sm text-label-sm shadow-sm">
                        {ad.price}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded font-label-sm text-label-sm">{ad.category}</span>
                    {ad.subcategory && (
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded font-label-sm text-label-sm border border-outline-variant">{ad.subcategory}</span>
                    )}
                    {ad.location && (
                      <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center max-w-[120px] truncate ml-auto"><span className="material-symbols-outlined text-[14px] mr-1" data-icon="location_on">location_on</span>{ad.location}</span>
                    )}
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 mb-2 group-hover:text-primary transition-colors">{ad.title}</h3>
                  <p className="font-body-sm text-on-surface-variant line-clamp-2 mb-4">{ad.description}</p>
                  <div className="mt-auto flex justify-between items-center text-on-surface-variant border-t border-outline-variant/30 pt-3">
                    <span className="font-label-sm text-label-sm truncate max-w-[150px]">
                      {ad.profiles?.username || '卡卡用戶'} • {new Date(ad.created_at).toLocaleDateString()}
                    </span>
                    <span className="material-symbols-outlined text-outline" data-icon="bookmark_border">bookmark_border</span>
                  </div>
                </div>
              </article>
            );
          })
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center text-center">
              <span className="material-symbols-outlined text-6xl text-surface-variant mb-4">search_off</span>
              <h3 className="font-headline-sm text-on-surface mb-2">目前沒有相關資訊</h3>
              <p className="text-on-surface-variant font-body-md mb-6">成為第一個發佈「{selectedCategory || '生活資訊'}」的人吧！</p>
              <Link to="/publish" className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md shadow-sm hover:brightness-110 transition-all">立即發佈</Link>
            </div>
          )}
        </div>

        {/* Pagination - Show only when there are many posts (dummy UI for now) */}
        {classifieds.length > 12 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors disabled:opacity-50">
                <span className="material-symbols-outlined" data-icon="chevron_left">chevron_left</span>
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm">1</button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors font-label-md text-label-md">2</button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors font-label-md text-label-md">3</button>
              <span className="text-on-surface-variant mx-1">...</span>
              <button className="w-10 h-10 rounded-full flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors">
                <span className="material-symbols-outlined" data-icon="chevron_right">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Detail Popup Modal */}
      {viewingAd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setViewingAd(null)}>
          <div className="bg-surface w-full max-w-3xl max-h-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header with Close Button */}
            <div className="flex justify-between items-center p-4 border-b border-outline-variant bg-surface shrink-0">
              <h2 className="font-title-md font-bold text-on-surface line-clamp-1">{viewingAd.title}</h2>
              <button onClick={() => setViewingAd(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors ml-2 shrink-0">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-0 sm:p-6 bg-surface">
              {viewingAd.image_url && (
                <div className="w-full h-64 sm:h-80 md:h-96 bg-surface-container rounded-none sm:rounded-xl overflow-hidden mb-6 flex items-center justify-center">
                  <img src={viewingAd.image_url} alt={viewingAd.title} className="max-w-full max-h-full object-contain drop-shadow-md" />
                </div>
              )}
              
              <div className="px-5 sm:px-0 space-y-6 pb-6 pt-5 sm:pt-0">
                {/* Tags & Date */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full font-label-md text-label-md">{viewingAd.category}</span>
                  {viewingAd.subcategory && (
                    <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-md text-label-md border border-outline-variant">{viewingAd.subcategory}</span>
                  )}
                  <span className="ml-auto text-on-surface-variant font-label-md flex items-center">
                    <span className="material-symbols-outlined text-[16px] mr-1" data-icon="schedule">schedule</span>
                    {new Date(viewingAd.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {/* Title, Price, Location */}
                <div>
                  <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-4 leading-tight">{viewingAd.title}</h1>
                  <div className="flex flex-wrap gap-4 mb-6">
                    {viewingAd.price && (
                      <div className="flex items-center gap-2 text-primary font-title-lg font-bold bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
                        <span className="material-symbols-outlined text-[22px]">payments</span>
                        {viewingAd.price}
                      </div>
                    )}
                    {viewingAd.location && (
                      <div className="flex items-center gap-2 text-on-surface-variant font-body-lg bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/50">
                        <span className="material-symbols-outlined text-[22px]">location_on</span>
                        {viewingAd.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info (Prominent) */}
                <div className="bg-primary-container/20 border border-primary/30 rounded-xl p-5 mb-6 shadow-sm">
                  <h3 className="font-title-md font-bold text-on-surface flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary">connect_without_contact</span>
                    聯絡發佈者
                  </h3>
                  <div className="bg-surface border border-outline-variant rounded-lg p-3 mt-3">
                    <p className="font-body-lg text-on-surface select-all break-all font-medium text-center">{viewingAd.contact_info || "未提供聯絡資訊"}</p>
                  </div>
                  <p className="font-body-sm text-on-surface-variant mt-3 text-center">
                    聯絡時請說明是在「卡卡生活」看到的喔！發佈者：<span className="font-bold">{viewingAd.profiles?.username || '卡卡用戶'}</span>
                  </p>
                </div>

                {/* Full Description */}
                <div>
                  <h3 className="font-title-md font-bold text-on-surface mb-3 border-b border-outline-variant/50 pb-2">詳細說明</h3>
                  <div className="font-body-lg text-on-surface whitespace-pre-wrap leading-relaxed bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30">
                    {viewingAd.description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

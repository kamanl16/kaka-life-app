import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const Home: React.FC = () => {
  const [weather, setWeather] = useState<{ temp: number | null, description: string, icon: string, loading: boolean }>({
    temp: null,
    description: '載入中...',
    icon: 'cloud',
    loading: true
  });
  const [popularPlaces, setPopularPlaces] = useState<any[]>([]);
  const [latestNews, setLatestNews] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Calgary Weather from Open-Meteo
    const fetchWeather = async () => {
      try {
        // Latitude 51.0501, Longitude -114.0853 for Calgary
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=51.0501&longitude=-114.0853&current_weather=true');
        const data = await response.json();

        if (data.current_weather) {
          const wmoCode = data.current_weather.weathercode;
          const { description, icon } = getWeatherInfo(wmoCode);

          setWeather({
            temp: Math.round(data.current_weather.temperature),
            description,
            icon,
            loading: false
          });
        }
      } catch (error) {
        console.error("Failed to fetch weather", error);
        setWeather(prev => ({ ...prev, description: '無法獲取天氣', loading: false }));
      }
    };

    const fetchPlaces = async () => {
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('rating', { ascending: false })
        .limit(2);
      if (!error && data) {
        setPopularPlaces(data);
      }
    };

    const fetchNews = async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('pub_date', { ascending: false })
        .limit(3);
      if (!error && data) {
        setLatestNews(data);
      }
    };

    const fetchForumPosts = async () => {
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*, forum_comments(count)')
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data) {
        setForumPosts(data);
      }
    };

    fetchWeather();
    fetchPlaces();
    fetchNews();
    fetchForumPosts();
  }, []);

  // Helper to map WMO Weather interpretation codes
  const getWeatherInfo = (code: number) => {
    if (code === 0) return { description: '晴天', icon: 'sunny' };
    if (code === 1 || code === 2) return { description: '多雲轉晴', icon: 'partly_cloudy_day' };
    if (code === 3) return { description: '陰天', icon: 'cloud' };
    if (code >= 45 && code <= 48) return { description: '有霧', icon: 'foggy' };
    if (code >= 51 && code <= 67) return { description: '雨天', icon: 'rainy' };
    if (code >= 71 && code <= 77) return { description: '下雪', icon: 'snowing' };
    if (code >= 80 && code <= 82) return { description: '陣雨', icon: 'rainy' };
    if (code >= 85 && code <= 86) return { description: '陣雪', icon: 'snowing' };
    if (code >= 95) return { description: '雷雨', icon: 'thunderstorm' };
    return { description: '多雲', icon: 'cloud' };
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex text-secondary text-sm my-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        ))}
        {hasHalfStar && (
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex-grow w-full">
      {/* Hero Section */}
      <section
        className="relative w-full h-[500px] flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCUJI0GaLd6G3GCCi2S8e2hD3sAuiY2Up05lix0OGD9AuZBctl_xmBnqe4Tea5XKhnkv5aUPqxbXUad8oS8b5q97428Oz6EtLJSIymKQLZXusknkBGMsXhYiJ2piZZ6M8ordpGIHmWf9mT-ruzwrSA8TH1bhZ8uOBju2lz6xijnTDGH4lwRxgCn5XKl3h_XL_gcj1hVDtN1_KOXsuolTWF8uKOiYNMHXy9_ZWPqA1FDB9LYfQzBMTqaRpmnORpuvmvVsp1-6ePqgBqe')" }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center px-margin-mobile w-full max-w-[800px]">
          <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-tertiary mb-4 drop-shadow-md">歡迎來到卡加利</h1>
          <p className="font-body-lg text-body-lg text-on-tertiary mb-8 drop-shadow">您最可靠的當地生活、新聞與社區指南。</p>
          <div className="bg-surface-container-lowest rounded-xl shadow-lg p-2 flex items-center max-w-[600px] mx-auto border border-outline-variant focus-within:border-primary transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant ml-3 mr-2">search</span>
            <input className="flex-grow bg-transparent border-none focus:ring-0 font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/60 py-3 outline-none" placeholder="搜尋生活資訊、新聞或美食..." type="text" />
            <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-md text-label-md hover:bg-surface-tint transition-colors">搜尋</button>
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 flex flex-col md:flex-row gap-gutter">
        {/* Main Content Area */}
        <div className="flex-grow flex flex-col gap-12 overflow-hidden">
          {/* Featured Categories */}
          <section>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-primary" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>category</span>
              精選分類
            </h2>
            <div className="flex md:grid md:grid-cols-4 gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 md:pb-0">
              <Link to="/life-info" className="min-w-[140px] md:min-w-0 snap-start bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-primary text-3xl">home</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-bold">房屋資訊</span>
              </Link>
              <Link to="/life-info" className="min-w-[140px] md:min-w-0 snap-start bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-full bg-secondary-container/20 flex items-center justify-center group-hover:bg-secondary-container/40 transition-colors">
                  <span className="material-symbols-outlined text-secondary text-3xl">work</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-bold">招聘求職</span>
              </Link>
              <Link to="/life-info" className="min-w-[140px] md:min-w-0 snap-start bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-full bg-tertiary-container/20 flex items-center justify-center group-hover:bg-tertiary-container/40 transition-colors">
                  <span className="material-symbols-outlined text-tertiary text-3xl">shopping_bag</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-bold">二手交易</span>
              </Link>
              <Link to="/dining" className="min-w-[140px] md:min-w-0 snap-start bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-primary hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-full bg-error-container/40 flex items-center justify-center group-hover:bg-error-container/60 transition-colors">
                  <span className="material-symbols-outlined text-error text-3xl">restaurant</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-bold">美食購物</span>
              </Link>
            </div>
          </section>

          {/* Latest News */}
          <section>
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-2">
              <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>newspaper</span>
                最新新聞
              </h2>
              <Link to="/news" className="font-label-md text-label-md text-primary hover:underline flex items-center">
                查看全部 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
            <div className="flex md:grid md:grid-cols-3 gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 md:pb-0">
              {latestNews.map((article) => {
                const dateObj = new Date(article.pub_date || article.created_at);
                const dateString = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;

                return (
                  <Link to="/news" key={article.id} className="min-w-[280px] md:min-w-0 snap-start bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/50 transition-all flex flex-col group cursor-pointer">
                    <div className="h-40 bg-surface-container-low w-full relative overflow-hidden">
                      {article.image_url ? (
                        <img alt="News" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" src={article.image_url} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                          <span className="material-symbols-outlined text-4xl">newspaper</span>
                        </div>
                      )}
                      <span className="absolute top-2 left-2 bg-primary text-on-primary font-label-sm text-label-sm px-2 py-1 rounded">
                        {article.category || '本地'}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 mb-2 leading-tight group-hover:text-primary transition-colors">{article.title}</h3>
                      <p className="font-body-md text-body-md text-on-surface-variant line-clamp-2 mb-4 flex-grow">{article.content_snippet}</p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="font-label-sm text-label-sm text-outline">{dateString}</span>
                        <span className="font-label-sm text-label-sm text-outline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">language</span>
                          {article.source}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {latestNews.length === 0 && (
                <div className="col-span-3 text-center py-8 text-on-surface-variant font-label-md">正在載入最新新聞...</div>
              )}
            </div>
          </section>

          {/* Popular Dining */}
          <section>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined text-secondary" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant_menu</span>
              熱門美食
            </h2>
            <div className="flex md:grid md:grid-cols-2 gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0 md:pb-0">
              {popularPlaces.map(place => (
                <Link to={`/dining/${place.id}`} key={place.id} className="min-w-[300px] md:min-w-0 snap-start bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                  <img alt={place.name} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" src={place.image_url} />
                  <div className="flex-grow">
                    <h4 className="font-label-md text-label-md text-on-surface font-bold line-clamp-1">{place.name}</h4>
                    {renderStars(place.rating)}
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{place.area} • {place.price_level}</span>
                    <p className="text-label-sm text-on-surface-variant mt-1 line-clamp-1 text-primary">{place.category}</p>
                  </div>
                </Link>
              ))}
              {popularPlaces.length === 0 && (
                <div className="col-span-2 text-center py-4 text-on-surface-variant font-label-md">正在載入美食資訊...</div>
              )}
            </div>
            <div className="mt-4 md:mt-6 flex justify-center">
              <Link to="/dining" className="px-8 py-2 border border-outline text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-container-low transition-colors w-full md:w-auto text-center">查看更多美食</Link>
            </div>
          </section>

          {/* Forum Buzz */}
          <section className="bg-surface-container-low rounded-xl p-6 border border-outline-variant -mx-margin-mobile md:mx-0 rounded-none md:rounded-xl">
            <div className="flex justify-between items-center mb-6 border-b border-outline-variant pb-2">
              <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>forum</span>
                論壇熱點
              </h3>
              <Link to="/forum" className="font-label-md text-label-md text-primary hover:underline flex items-center">
                查看全部 <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </Link>
            </div>
            <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 md:pb-0">
              {forumPosts.map(post => {
                const commentCount = post.forum_comments && post.forum_comments[0] ? post.forum_comments[0].count : 0;

                // Assign a color based on category for visual variety
                const categoryColorClass =
                  post.category === '發問' ? 'bg-primary-container text-on-primary-container' :
                    post.category === '分享' ? 'bg-secondary-container text-on-secondary-container' :
                      post.category === '求助' ? 'bg-error-container text-on-error-container' :
                        'bg-tertiary-container text-on-tertiary-container';

                return (
                  <Link to={`/forum/${post.id}`} key={post.id} className="min-w-[260px] md:min-w-0 snap-start bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/50 hover:border-primary/50 transition-colors cursor-pointer flex flex-col justify-between h-full">
                    <div>
                      <span className={`font-label-sm text-label-sm font-bold px-2 py-0.5 rounded-sm mr-2 inline-block mb-2 ${categoryColorClass}`}>
                        {post.category}
                      </span>
                      <span className="font-label-md text-label-md text-on-surface block line-clamp-2 leading-snug">{post.title}</span>
                    </div>
                    <div className="mt-4 flex items-center text-on-surface-variant font-label-sm text-label-sm gap-2">
                      <span className="material-symbols-outlined text-[14px]">comment</span> {commentCount} 條回覆
                    </div>
                  </Link>
                );
              })}
              {forumPosts.length === 0 && (
                <div className="col-span-3 text-center py-4 text-on-surface-variant font-label-md">目前沒有論壇文章...</div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="w-full md:w-80 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">cloud</span>
              今日天氣
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-display-lg-mobile font-bold text-on-surface">
                  {weather.loading ? '--' : weather.temp !== null ? `${weather.temp}°C` : '--'}
                </p>
                <p className="text-on-surface-variant font-label-md">{weather.description}</p>
              </div>
              <span className={`material-symbols-outlined text-5xl ${weather.icon === 'sunny' ? 'text-[#FDB813]' : 'text-secondary'}`}>
                {weather.icon}
              </span>
            </div>
          </div>


        </aside>
      </div>
    </div>
  );
};

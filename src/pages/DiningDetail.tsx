import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Place {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews_count: number;
  price_level: string;
  area: string;
  image_url: string;
  description: string;
  is_open: boolean;
  address: string;
  yelp_url: string;
}

export const DiningDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlace = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .eq('id', id)
        .single();
        
      if (!error && data) {
        setPlace(data);
      }
      setLoading(false);
    };
    
    if (id) fetchPlace();
  }, [id]);

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex text-[#FDB813] text-lg">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        ))}
        {hasHalfStar && (
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex-grow w-full flex items-center justify-center min-h-[500px]">
      <div className="flex flex-col items-center">
        <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">refresh</span>
        <p className="text-on-surface-variant font-label-md">載入餐廳資訊中...</p>
      </div>
    </div>
  );

  if (!place) return (
    <div className="flex-grow w-full flex items-center justify-center min-h-[500px]">
      <div className="flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
        <h2 className="font-headline-md text-on-surface mb-2">找不到餐廳</h2>
        <p className="text-on-surface-variant mb-6">這間餐廳可能已被移除或網址有誤。</p>
        <Link to="/dining" className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md hover:bg-surface-tint transition-colors shadow-sm">
          返回美食首頁
        </Link>
      </div>
    </div>
  );

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address || ''} ${place.area || 'Calgary'}`)}`;

  return (
    <div className="flex-grow w-full bg-surface-container-lowest pb-20">
      {/* Hero Image Section */}
      <section className="relative w-full h-[400px] md:h-[500px] bg-surface-container-low">
        {place.image_url ? (
          <img src={place.image_url} alt={place.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-variant">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">restaurant</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        
        {/* Back Button */}
        <Link to="/dining" className="absolute top-6 left-6 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors border border-white/20 z-10">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 w-full p-margin-mobile md:p-margin-desktop text-white max-w-container-max mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="bg-primary/90 backdrop-blur-md text-on-primary font-label-sm px-3 py-1 rounded-full border border-primary-container/30 shadow-sm">
              {place.category}
            </span>
            <span className={`font-label-sm px-3 py-1 rounded-full shadow-sm backdrop-blur-md border ${place.is_open ? 'bg-secondary/90 text-on-secondary border-secondary-container/50' : 'bg-surface-variant/90 text-on-surface-variant border-outline'}`}>
              {place.is_open ? '目前營業中' : '休息中'}
            </span>
          </div>
          <h1 className="font-display-md text-display-md md:font-display-lg md:text-display-lg font-bold mb-2 drop-shadow-lg leading-tight">
            {place.name}
          </h1>
          <div className="flex items-center gap-3 mb-2 drop-shadow-md">
            {renderStars(place.rating)}
            <span className="font-label-lg font-medium">{place.rating.toFixed(1)}</span>
            <span className="text-white/80 font-body-sm">({place.reviews_count} 則 Yelp 評價)</span>
          </div>
        </div>
      </section>

      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Details */}
        <div className="flex-grow flex flex-col gap-8">
          {/* Action Buttons (Mobile visible, Desktop top) */}
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-primary text-on-primary px-6 py-4 rounded-xl font-label-lg shadow-md hover:bg-surface-tint hover:-translate-y-1 transition-all">
              <span className="material-symbols-outlined">directions</span>
              在 Google Maps 導航
            </a>
            {place.yelp_url && (
              <a href={place.yelp_url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-[#FF1A1A] text-white px-6 py-4 rounded-xl font-label-lg shadow-md hover:bg-[#D90000] hover:-translate-y-1 transition-all">
                <span className="material-symbols-outlined">reviews</span>
                查看 Yelp 完整評價
              </a>
            )}
          </div>

          <section className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-sm">
            <h2 className="font-headline-sm text-on-surface mb-4 border-b border-outline-variant pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">info</span>
              餐廳資訊
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant font-label-sm">價位</span>
                <span className="font-body-lg text-on-surface font-medium">{place.price_level || '未知'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-on-surface-variant font-label-sm">地區</span>
                <span className="font-body-lg text-on-surface font-medium">{place.area}</span>
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <span className="text-on-surface-variant font-label-sm">完整地址</span>
                <span className="font-body-lg text-on-surface font-medium flex items-start gap-2">
                  <span className="material-symbols-outlined text-outline mt-1 text-[20px]">location_on</span>
                  {place.address ? `${place.address}, ${place.area}` : '未提供詳細地址'}
                </span>
              </div>
            </div>
            
            <h3 className="font-title-md text-on-surface mt-8 mb-3">餐廳介紹</h3>
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              {place.description}
            </p>
          </section>

          {/* Kaka Life Community Comments (Placeholder for Phase 2) */}
          <section className="bg-surface rounded-2xl p-6 border border-outline-variant shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-secondary text-on-secondary font-label-sm px-3 py-1 rounded-bl-lg">
              即將推出
            </div>
            <h2 className="font-headline-sm text-on-surface mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">forum</span>
              卡友評論
            </h2>
            <p className="text-on-surface-variant font-body-sm mb-6">未來卡卡生活的註冊會員可以在此留下專屬評論與照片！</p>
            
            <div className="flex flex-col gap-4 opacity-50 pointer-events-none">
              <div className="border border-outline-variant rounded-xl p-4 flex gap-4">
                <div className="w-10 h-10 bg-surface-variant rounded-full flex-shrink-0"></div>
                <div>
                  <h4 className="font-label-md text-on-surface">卡加利小吃貨</h4>
                  <p className="font-body-sm text-on-surface-variant mt-1">這家的珍奶真的是全卡加利最好喝的！推薦點半糖去冰。</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

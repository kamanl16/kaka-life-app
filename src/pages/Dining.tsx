import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Define the interface for our Place data
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
}

const CATEGORIES = ['全部', '中式餐飲', '西式餐飲', '日韓料理', '奶茶甜點', '超市購物'];

export const Dining: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch places from Supabase
  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('places')
        .select('*')
        .order('rating', { ascending: false });

      if (error) {
        console.error('Error fetching places:', error);
      } else {
        setPlaces(data || []);
      }
      setLoading(false);
    };

    fetchPlaces();
  }, []);

  // Filter places based on category and search query
  let filteredPlaces = places;

  if (activeCategory !== '全部') {
    filteredPlaces = filteredPlaces.filter(place => place.category === activeCategory);
  }

  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filteredPlaces = filteredPlaces.filter(place => 
      place.name.toLowerCase().includes(query) ||
      place.category.toLowerCase().includes(query) ||
      (place.area && place.area.toLowerCase().includes(query))
    );
  }

  // Helper to render stars
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex text-[#FDB813] text-sm">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        ))}
        {hasHalfStar && (
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star_half</span>
        )}
      </div>
    );
  };

  return (
    <div className="flex-grow w-full bg-surface-container-lowest">
      {/* Premium Header Banner */}
      <section className="relative w-full h-[300px] md:h-[400px] flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1374&auto=format&fit=crop')" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="relative z-10 text-center px-margin-mobile w-full max-w-3xl pt-20">
          <h1 className="font-display-md text-display-md text-on-tertiary mb-4 font-bold tracking-wide drop-shadow-lg">卡加利 美食與購物</h1>
          <p className="font-body-lg text-body-lg text-on-tertiary/90 mb-8 drop-shadow-md">探索本地最受歡迎的餐廳、咖啡廳與亞洲超市</p>
          
          {/* Search Bar inside Header */}
          <div className="bg-surface rounded-full shadow-xl p-2 flex items-center max-w-[500px] mx-auto border border-outline-variant/30 focus-within:border-primary transition-all">
            <span className="material-symbols-outlined text-on-surface-variant ml-4 mr-2">search</span>
            <input 
              className="flex-grow bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-on-surface-variant/60 py-2 outline-none" 
              placeholder="搜尋餐廳名稱、種類或地區..." 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="bg-primary text-on-primary px-6 py-2 rounded-full font-label-md hover:bg-surface-tint transition-colors shadow-sm">
              搜尋
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 md:py-12">
        
        {/* Category Filters (Scrollable on mobile) */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-4 mb-8 border-b border-outline-variant/50 -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-5 py-2 rounded-full font-label-md transition-all duration-200 shadow-sm border ${
                activeCategory === category 
                  ? 'bg-primary text-on-primary border-primary scale-105 shadow-md' 
                  : 'bg-surface text-on-surface border-outline-variant hover:border-primary hover:text-primary'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredPlaces.map(place => (
            <Link to={`/dining/${place.id}`} key={place.id} className="group bg-surface rounded-2xl overflow-hidden border border-outline-variant shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer">
              
              {/* Image Section */}
              <div className="relative h-48 md:h-56 w-full overflow-hidden">
                <img 
                  src={place.image_url} 
                  alt={place.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
                />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="bg-black/60 backdrop-blur-md text-white font-label-sm px-3 py-1 rounded-full border border-white/20">
                    {place.category}
                  </span>
                </div>
                
                {/* Open/Close Status */}
                <div className="absolute top-4 right-4">
                  <span className={`font-label-sm px-3 py-1 rounded-full shadow-sm backdrop-blur-md border ${place.is_open ? 'bg-primary/90 text-on-primary border-primary-container/50' : 'bg-surface-variant/90 text-on-surface-variant border-outline'}`}>
                    {place.is_open ? '營業中' : '休息中'}
                  </span>
                </div>
              </div>

              {/* Info Section */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                    {place.name}
                  </h3>
                  <span className="font-label-md font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">
                    {place.price_level}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {renderStars(place.rating)}
                  <span className="text-label-sm text-on-surface-variant font-medium">
                    {place.rating.toFixed(1)} ({place.reviews_count})
                  </span>
                </div>

                <p className="font-body-md text-on-surface-variant line-clamp-2 mb-4 flex-grow">
                  {place.description}
                </p>

                <div className="flex items-center text-on-surface-variant font-label-sm border-t border-outline-variant/50 pt-4 mt-auto">
                  <span className="material-symbols-outlined text-[16px] mr-1 text-primary">location_on</span>
                  <span className="truncate">{place.area}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        
        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">refresh</span>
            <p className="text-on-surface-variant">正在載入美食資訊...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredPlaces.length === 0 && (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
            <h3 className="font-headline-sm text-on-surface mb-2">找不到相關結果</h3>
            <p className="text-on-surface-variant">您的數據庫中還沒有這個分類的資料。請執行抓取腳本！</p>
          </div>
        )}

      </div>
    </div>
  );
};

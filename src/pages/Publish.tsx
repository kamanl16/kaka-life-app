import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const CATEGORIES = ['房屋資訊', '招聘求職', '二手交易', '社區資訊', '生活服務'];

const SUBCATEGORIES: Record<string, string[]> = {
  '房屋資訊': ['獨立屋', '公寓', '房間分租', '短期租約', '其他'],
  '招聘求職': ['全職', '兼職', '合約', '實習', '其他'],
  '二手交易': ['電子產品', '傢俱寢具', '汽車與配件', '衣物飾品', '其他'],
  '社區資訊': ['活動聚會', '尋人尋物', '義工招募', '其他'],
  '生活服務': ['搬家接送', '清潔保潔', '維修裝修', '專業服務', '其他'],
};

export const Publish: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState(SUBCATEGORIES[CATEGORIES[0]][0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && !contactInfo) {
      setContactInfo(user.email || '');
    }
  }, [user, contactInfo]);

  if (loading || !user) {
    return (
      <div className="flex-grow w-full flex items-center justify-center p-8 min-h-[400px]">
        <div className="flex flex-col items-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-spin mb-4">refresh</span>
          <p className="text-on-surface-variant font-label-md">載入中...</p>
        </div>
      </div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('classifieds')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('classifieds')
      .getPublicUrl(filePath);
      
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        try {
          imageUrl = await uploadImage(imageFile);
        } catch (err: any) {
          throw new Error('圖片上傳失敗，請確認是否已經在 Supabase 後台建立「classifieds」Storage Bucket，並且設定為 Public。詳細錯誤: ' + err.message);
        }
      }

      const { error: insertError } = await supabase.from('classifieds').insert([
        {
          author_id: user.id,
          category,
          subcategory,
          title,
          description,
          price,
          location,
          contact_info: contactInfo,
          image_url: imageUrl
        }
      ]);

      if (insertError) {
        throw insertError;
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/life-info');
      }, 2000);

    } catch (err: any) {
      setError(err.message || '發佈失敗，請稍後再試。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex-grow w-full flex items-center justify-center p-8 min-h-[400px]">
        <div className="bg-surface-container-lowest p-10 rounded-2xl border border-primary/20 shadow-lg text-center max-w-md w-full animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl text-primary" data-icon="check_circle">check_circle</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm text-on-surface mb-2 font-bold">發佈成功！</h2>
          <p className="text-on-surface-variant font-body-md mb-6">您的資訊已經成功發佈到卡卡生活平台上。</p>
          <p className="text-primary font-label-md animate-pulse">正在為您跳轉至生活資訊頁面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-3xl mx-auto p-margin-mobile md:p-margin-desktop py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface mb-2 tracking-tight">發佈資訊</h1>
        <p className="text-on-surface-variant font-body-md text-body-lg">
          分享您的二手物品、招租資訊或是工作機會給卡加利的社群。
        </p>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-error-container text-on-error-container rounded-lg font-body-sm flex items-start gap-3 border border-error/20">
          <span className="material-symbols-outlined text-[24px]">error</span>
          <p className="pt-0.5">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
          
          {/* Section 1: Basic Info */}
          <section>
            <h2 className="font-title-md text-title-md font-bold text-on-surface mb-4 flex items-center gap-2 border-b border-outline-variant/50 pb-2">
              <span className="material-symbols-outlined text-primary">label</span>
              基本資訊
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="category">大分類 <span className="text-error">*</span></label>
                  <div className="relative">
                    <select 
                      id="category" 
                      value={category} 
                      onChange={(e) => {
                        setCategory(e.target.value);
                        setSubcategory(SUBCATEGORIES[e.target.value][0]);
                      }}
                      className="w-full pl-4 pr-10 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="subcategory">細項分類 <span className="text-error">*</span></label>
                  <div className="relative">
                    <select 
                      id="subcategory" 
                      value={subcategory} 
                      onChange={(e) => setSubcategory(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all appearance-none cursor-pointer"
                    >
                      {SUBCATEGORIES[category].map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="title">標題 <span className="text-error">*</span></label>
                <input 
                  id="title" 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：市中心一房一廳公寓招租 / 九成新 iPhone 15 出售" 
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="description">詳細描述 <span className="text-error">*</span></label>
                <textarea 
                  id="description" 
                  required 
                  rows={5}
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="請詳細描述您的物品狀況、房屋格局或是工作內容..." 
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-y min-h-[120px]"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Details */}
          <section>
            <h2 className="font-title-md text-title-md font-bold text-on-surface mb-4 flex items-center gap-2 border-b border-outline-variant/50 pb-2">
              <span className="material-symbols-outlined text-secondary">feed</span>
              補充細節
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="price">
                  {category === '招聘求職' ? '薪資待遇' : category === '房屋資訊' ? '租金' : '價格'}
                </label>
                <input 
                  id="price" 
                  type="text" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={category === '招聘求職' ? '例如：$20/hr 或 面議' : '例如：$1,500/mo 或 $500'} 
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="location">地點 / 區域</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">location_on</span>
                  <input 
                    id="location" 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="例如：NW Calgary, Downtown" 
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Media & Contact */}
          <section>
            <h2 className="font-title-md text-title-md font-bold text-on-surface mb-4 flex items-center gap-2 border-b border-outline-variant/50 pb-2">
              <span className="material-symbols-outlined text-tertiary">contacts</span>
              聯絡與媒體
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5" htmlFor="contactInfo">聯絡方式 <span className="text-error">*</span></label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">connect_without_contact</span>
                  <input 
                    id="contactInfo" 
                    type="text" 
                    required 
                    value={contactInfo} 
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="您的 Email、電話或 Line ID" 
                    className="w-full pl-10 pr-4 py-3 bg-surface border border-outline-variant rounded-lg font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <p className="mt-1.5 text-body-sm text-on-surface-variant">此資訊將會公開顯示在您的貼文中，讓感興趣的人可以聯絡您。</p>
              </div>

              <div>
                <label className="block font-label-md text-label-md text-on-surface mb-1.5">上傳照片 (選填)</label>
                <div className="mt-2 flex justify-center rounded-xl border border-dashed border-outline-variant px-6 py-8 hover:bg-surface-container-lowest hover:border-primary/50 transition-colors group cursor-pointer relative">
                  <div className="text-center">
                    {imageFile ? (
                      <div className="flex flex-col items-center">
                        <span className="material-symbols-outlined text-[48px] text-primary mb-3">image</span>
                        <div className="flex items-center text-body-md text-on-surface">
                          <span className="font-medium truncate max-w-[200px]">{imageFile.name}</span>
                          <button 
                            type="button" 
                            className="ml-2 text-error hover:text-error/80" 
                            onClick={(e) => {
                              e.preventDefault();
                              setImageFile(null);
                            }}
                          >
                            <span className="material-symbols-outlined text-[20px]">cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant/50 group-hover:text-primary/70 transition-colors mb-3" data-icon="add_photo_alternate">add_photo_alternate</span>
                        <div className="mt-4 flex text-body-md leading-6 text-on-surface-variant justify-center">
                          <span className="relative cursor-pointer rounded-md bg-transparent font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-fixed">
                            <span>點擊上傳圖片</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                          </span>
                        </div>
                        <p className="text-body-sm text-on-surface-variant/70 mt-1">PNG, JPG, GIF 最大 5MB</p>
                      </>
                    )}
                  </div>
                  {/* Invisible file input covering the whole area when no file */}
                  {!imageFile && (
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageChange} title="上傳圖片" />
                  )}
                </div>
              </div>
            </div>
          </section>

        </div>

        {/* Submit Area */}
        <div className="bg-surface-container px-6 py-5 md:px-8 flex items-center justify-end border-t border-outline-variant">
          <button 
            type="button" 
            onClick={() => navigate('/life-info')}
            className="font-label-md text-label-md text-on-surface-variant hover:text-on-surface px-4 py-2 mr-4 transition-colors"
          >
            取消
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-label-md font-label-md text-on-primary bg-primary hover:bg-primary-fixed-dim hover:text-primary-fixed hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                發佈中...
              </>
            ) : (
              <>
                確認發佈
                <span className="material-symbols-outlined text-[18px]">send</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  message: string;
  items_added: number;
  created_at: string;
}

export const Admin: React.FC = () => {
  const { profile, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!profile || profile.role !== 'admin') {
        navigate('/'); // Redirect non-admins
      } else {
        fetchLogs();
      }
    }
  }, [profile, authLoading, navigate]);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (!error && data) {
      setLogs(data);
    }
    setLoadingLogs(false);
  };

  const handleTriggerSync = async (syncType: 'news' | 'places' | 'all' | 'retry-news') => {
    if (!session) return;
    
    setTriggering(true);
    setTriggerMessage(null);
    
    try {
      const response = await fetch('/api/trigger-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ syncType })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('無法連線到背景 API。請注意：手動同步按鈕只能在 Vercel 線上正式環境中使用，本地開發環境 (localhost) 無法執行 Vercel Serverless 功能！');
      }

      const data = await response.json();

      if (response.ok) {
        setTriggerMessage({ type: 'success', text: '同步任務已成功發送至 GitHub Actions！請稍後刷新日誌查看結果。' });
      } else {
        setTriggerMessage({ type: 'error', text: `觸發失敗：${data.error || '未知錯誤'}` });
      }
    } catch (err: any) {
      setTriggerMessage({ type: 'error', text: `網路錯誤：${err.message}` });
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  if (authLoading || (profile && profile.role !== 'admin')) {
    return <div className="flex justify-center py-20">載入中...</div>;
  }

  return (
    <div className="flex-1 w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-4 lg:py-8 flex flex-col gap-8">
      
      {/* Header */}
      <div className="border-b border-outline-variant pb-4">
        <h1 className="font-display-lg-mobile md:font-headline-md text-display-lg-mobile md:text-headline-md text-on-surface font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl md:text-4xl" data-weight="fill" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
          系統後台管理
        </h1>
        <p className="font-body-md text-on-surface-variant mt-2">
          管理系統排程與檢視資料同步紀錄。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Controls & Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Cron Job Info */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
            <h3 className="font-headline-sm text-on-surface font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">schedule</span>
              自動排程設定
            </h3>
            <div className="space-y-4">
              <div className="bg-surface-variant/50 p-4 rounded-lg border border-outline-variant/50">
                <p className="font-label-sm text-on-surface-variant mb-1">目前排程 (CRON)</p>
                <p className="font-body-md font-mono text-on-surface">每天早上 6:00 (UTC)</p>
              </div>
              <p className="font-body-sm text-on-surface-variant text-sm">
                * 排程由 GitHub Actions 驅動。如需修改執行時間，請聯繫開發人員修改 `.github/workflows/daily-sync.yml` 設定檔。
              </p>
            </div>
          </div>

          {/* Manual Trigger */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
            <h3 className="font-headline-sm text-on-surface font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bolt</span>
              手動觸發同步
            </h3>
            <p className="font-body-sm text-on-surface-variant text-sm mb-6">
              強制系統立刻執行背景抓取與 AI 翻譯任務。執行時間可能長達 2 分鐘，請勿頻繁點擊。
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => handleTriggerSync('all')}
                disabled={triggering}
                className="w-full bg-primary text-on-primary py-3 rounded-lg font-label-md flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {triggering ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">sync</span>}
                {triggering ? '傳送請求中...' : '立即同步所有資料'}
              </button>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button 
                  onClick={() => handleTriggerSync('news')}
                  disabled={triggering}
                  className="w-full bg-surface-container-high text-on-surface py-2 rounded-lg font-label-md hover:bg-surface-container-highest transition-colors disabled:opacity-50 text-sm border border-outline-variant"
                >
                  僅同步新聞
                </button>
                <button 
                  onClick={() => handleTriggerSync('places')}
                  disabled={triggering}
                  className="w-full bg-surface-container-high text-on-surface py-2 rounded-lg font-label-md hover:bg-surface-container-highest transition-colors disabled:opacity-50 text-sm border border-outline-variant"
                >
                  僅同步店家
                </button>
                <button 
                  onClick={() => handleTriggerSync('retry-news')}
                  disabled={triggering}
                  className="w-full sm:col-span-1 col-span-2 bg-secondary/10 text-secondary py-2 rounded-lg font-label-md hover:bg-secondary/20 transition-colors disabled:opacity-50 text-sm border border-secondary/30"
                >
                  重試失敗翻譯
                </button>
              </div>
            </div>

            {triggerMessage && (
              <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${triggerMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                <span className="material-symbols-outlined text-[18px]">
                  {triggerMessage.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <p className="leading-tight">{triggerMessage.text}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Logs Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-0 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-headline-sm text-on-surface font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary">receipt_long</span>
                系統執行日誌 (Sync Logs)
              </h3>
              <button 
                onClick={fetchLogs}
                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors flex items-center justify-center"
                title="重新整理日誌"
              >
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-on-surface-variant font-label-sm border-b border-outline-variant">
                    <th className="p-4 font-semibold whitespace-nowrap">時間</th>
                    <th className="p-4 font-semibold whitespace-nowrap">類型</th>
                    <th className="p-4 font-semibold whitespace-nowrap">狀態</th>
                    <th className="p-4 font-semibold whitespace-nowrap">新增數量</th>
                    <th className="p-4 font-semibold">詳細訊息</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                        載入日誌中...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                        尚無任何同步紀錄。
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="p-4 text-sm text-on-surface whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${log.sync_type === 'NEWS' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                            {log.sync_type}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold flex items-center gap-1 w-max ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {log.status === 'SUCCESS' ? <span className="material-symbols-outlined text-[14px]">check_circle</span> : <span className="material-symbols-outlined text-[14px]">error</span>}
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-on-surface">
                          +{log.items_added}
                        </td>
                        <td className="p-4 text-sm text-on-surface-variant max-w-xs truncate" title={log.message}>
                          {log.message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

'use client';

import { parseAttachmentsJson } from '@/lib/notificationAttachments';

interface NotificationCardProps {
  notification: {
    _id: string;
    title: string;
    message: string;
    image?: string;
    attachments?: string;
    sentAt?: string;
    createdAt?: string;
  };
  onClick: () => void;
  index: number;
}

export default function NotificationCard({ notification, onClick, index }: NotificationCardProps) {
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const accentColors = [
    'from-blue-500 to-blue-600',
    'from-blue-400 to-indigo-500',
    'from-indigo-500 to-blue-600',
    'from-blue-500 to-cyan-500',
    'from-indigo-400 to-blue-500',
  ];

  const accent = accentColors[index % accentColors.length];
  const truncatedMessage = notification.message.length > 120 
    ? notification.message.substring(0, 120) + '...'
    : notification.message;

  const attachItems = parseAttachmentsJson(notification.attachments);
  const firstImg =
    attachItems.find((a) => a.mime.startsWith('image/'))?.dataUrl ||
    (notification.image?.trim() ? notification.image.trim() : '');
  const hasPdf = attachItems.some((a) => a.mime === 'application/pdf');
  const extraCount = attachItems.length > 1 ? attachItems.length - 1 : 0;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center shrink-0`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
              {notification.title}
            </h3>
            <span className="text-[10px] text-slate-500 shrink-0">
              {formatTimeAgo(notification.sentAt || notification.createdAt)}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
            {truncatedMessage}
          </p>

          {(firstImg || hasPdf) && (
            <div className="mt-2 flex items-center gap-2 max-w-[220px]">
              {firstImg ? (
                <div className="rounded-lg overflow-hidden bg-slate-700/50 flex-1 min-w-0">
                  <img src={firstImg} alt="" className="w-full h-16 object-cover" />
                </div>
              ) : hasPdf ? (
                <div className="h-16 w-full max-w-[120px] rounded-lg border border-slate-600 bg-slate-700/50 flex items-center justify-center text-xl" title="PDF attached">
                  📄
                </div>
              ) : null}
              {extraCount > 0 && (
                <span className="text-[10px] text-slate-500 shrink-0">+{extraCount}</span>
              )}
            </div>
          )}
        </div>

        <svg className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

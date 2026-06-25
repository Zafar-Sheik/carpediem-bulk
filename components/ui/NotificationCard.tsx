'use client';

import { motion } from 'framer-motion';
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
    'from-[#22438c] to-[#1a3575]',
    'from-[#d0a953] to-[#b8922e]',
    'from-[#22438c] to-[#d0a953]',
    'from-[#1a3575] to-[#22438c]',
    'from-[#b8922e] to-[#22438c]',
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
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      className="group w-full text-left bg-card border border-border rounded-2xl hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden"
    >
      <div className="flex items-start gap-4 p-5">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shrink-0 shadow-sm`}>
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h3 className="text-sm font-bold text-foreground truncate group-hover:text-[#22438c] transition-colors">
              {notification.title}
            </h3>
            <span className="text-[10px] text-muted shrink-0 font-medium">
              {formatTimeAgo(notification.sentAt || notification.createdAt)}
            </span>
          </div>

          <p className="text-xs text-muted-text leading-relaxed line-clamp-2">
            {truncatedMessage}
          </p>

          {(firstImg || hasPdf) && (
            <div className="mt-3 flex items-center gap-2 max-w-[220px]">
              {firstImg ? (
                <div className="rounded-lg overflow-hidden bg-slate-100 flex-1 min-w-0">
                  <img src={firstImg} alt="" className="w-full h-16 object-cover" />
                </div>
              ) : hasPdf ? (
                <div className="h-16 w-full max-w-[120px] rounded-lg border border-border bg-slate-50 flex items-center justify-center text-xl" title="PDF attached">
                  📄
                </div>
              ) : null}
              {extraCount > 0 && (
                <span className="text-[10px] text-muted shrink-0 font-bold">+{extraCount}</span>
              )}
            </div>
          )}
        </div>

        <svg className="w-4 h-4 text-muted group-hover:text-[#22438c] transition-colors shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.button>
  );
}

'use client';

import { useEffect, useCallback, useState } from 'react';
import { parseAttachmentsJson, type AttachmentItem } from '@/lib/notificationAttachments';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: {
    _id: string;
    title: string;
    message: string;
    image?: string;
    attachments?: string;
    sentAt?: string;
    createdAt?: string;
  } | null;
}

export default function NotificationModal({ isOpen, onClose, notification }: NotificationModalProps) {
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  const handleCloseModal = () => {
    setIsImageExpanded(false);
    onClose();
  };

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCloseModal();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  useEffect(() => {
    if (!isOpen || !notification?._id) return;
    void fetch(`/api/notifications/${notification._id}/open`, { method: 'POST' }).catch(() => {});
  }, [isOpen, notification?._id]);

  if (!isOpen || !notification) return null;

  const items = parseAttachmentsJson(notification.attachments);
  const legacyImage = notification.image?.trim();
  const primaryImage =
    items.find((a) => a.mime.startsWith('image/'))?.dataUrl ||
    (legacyImage && (legacyImage.startsWith('http') || legacyImage.startsWith('data:')) ? legacyImage : undefined);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderAttachment = (a: AttachmentItem, idx: number) => {
    if (a.mime.startsWith('image/')) {
      return (
        <div key={`${a.name}-${idx}`} className="mb-3">
          <img src={a.dataUrl} alt={a.name} className="w-full max-h-48 object-contain rounded-xl border border-slate-600 bg-slate-700/50" />
        </div>
      );
    }
    if (a.mime === 'application/pdf') {
      return (
        <a
          key={`${a.name}-${idx}`}
          href={a.dataUrl}
          download={a.name || 'document.pdf'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-4 rounded-xl border border-slate-600 bg-slate-700/40 text-slate-200 hover:bg-slate-700/60 transition-colors mb-3"
        >
          <span className="text-2xl" aria-hidden>
            📄
          </span>
          <span className="text-sm font-medium truncate">{a.name || 'PDF attachment'}</span>
          <span className="ml-auto text-xs text-blue-400">Open / save</span>
        </a>
      );
    }
    return null;
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm modal-backdrop"
          onClick={onClose}
        />

        <div className="relative w-full max-w-lg max-h-[90vh] bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden modal-content flex flex-col">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-full transition-all duration-200 z-10"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6 overflow-y-auto flex-1">
            <h2 
              id="modal-title" 
              className="text-xl font-bold text-white mb-4 pr-8"
            >
              {notification.title}
            </h2>

            {items.length > 0 ? (
              <div className="mb-5">{items.map((a, i) => renderAttachment(a, i))}</div>
            ) : primaryImage ? (
              <div className="mb-5">
                <div 
                  className={`relative rounded-xl overflow-hidden bg-slate-700 cursor-zoom-in transition-all duration-300 ${
                    isImageExpanded ? 'fixed inset-4 z-[60] m-0 bg-black' : ''
                  }`}
                  onClick={() => setIsImageExpanded(!isImageExpanded)}
                >
                  <img 
                    src={primaryImage} 
                    alt="Notification attachment"
                    className={`w-full h-auto max-h-[60vh] object-contain transition-all duration-300 ${
                      isImageExpanded ? 'h-full max-h-[90vh] w-auto mx-auto' : ''
                    }`}
                  />
                  {!isImageExpanded && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-slate-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      Tap to expand
                    </div>
                  )}
                  {isImageExpanded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsImageExpanded(false);
                      }}
                      className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mb-5">
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                {notification.message}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 border-t border-slate-700 pt-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatDate(notification.sentAt || notification.createdAt)}</span>
            </div>
          </div>

          <div className="bg-slate-900/50 border-t border-slate-700 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          animation: scaleIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
}

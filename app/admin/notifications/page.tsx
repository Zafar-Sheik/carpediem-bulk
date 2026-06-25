'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseAttachmentsJson, rowAttachmentPreview, attachmentListCount } from '@/lib/notificationAttachments';

interface Notification {
  _id: string;
  title: string;
  message: string;
  image?: string;
  attachments?: string;
  link?: string;
  sentAt?: string;
  scheduledAt?: string;
  status: string;
  recipientCount: number;
  deliveredCount?: number;
  openedCount?: number;
  createdAt: string;
}

interface Stats {
  total: number;
  sent: number;
  failed: number;
  scheduled: number;
  pending: number;
}

interface CampaignDashboard {
  messagesSent: number;
  totalRecipients: number;
  totalDelivered: number;
  totalOpened: number;
  deliveryRate: number;
  openRate: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashboard, setDashboard] = useState<CampaignDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [listRes, dashRes] = await Promise.all([
        fetch(`/api/admin/notifications?page=${page}&limit=20`, { credentials: 'include' }),
        fetch('/api/admin/dashboard', { credentials: 'include' }),
      ]);

      if (listRes.ok) {
        const data = await listRes.json();
        setNotifications(data.notifications || []);
        setStats(data.stats || null);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        const errData = await listRes.json().catch(() => ({}));
        throw new Error(errData.error || `Server error (${listRes.status})`);
      }

      if (dashRes.ok) {
        const d = await dashRes.json();
        if (d.success) setDashboard(d);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load notifications';
      setError(msg);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    setIsClearing(true);
    setError('');
    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clearAll: true }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Cleared ${data.deletedCount} notifications`);
        setNotifications([]);
        setSelectedNotifications([]);
        setStats({ total: 0, sent: 0, failed: 0, scheduled: 0, pending: 0 });
        setDashboard({ messagesSent: 0, totalRecipients: 0, totalDelivered: 0, totalOpened: 0, deliveryRate: 0, openRate: 0 });
        setShowClearConfirm(false);
      } else {
        throw new Error('Failed to clear notifications');
      }
    } catch (err) {
      setError('Failed to clear notifications. Please try again.');
      console.error('Error clearing notifications:', err);
    } finally {
      setIsClearing(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; dot: string }> = {
      sent: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
      failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
      scheduled: { bg: 'bg-[#22438c]/10', text: 'text-[#22438c]', dot: 'bg-[#22438c]' },
      pending: { bg: 'bg-[#d0a953]/10', text: 'text-[#b8922e]', dot: 'bg-[#d0a953]' },
    };
    const style = styles[status] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${style.dot}`}></span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length)
      setSelectedNotifications([]);
    else
      setSelectedNotifications(notifications.map(n => n._id));
  };

  const handleSelectNotification = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    setBulkDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/notifications/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedNotifications }),
      });
      if (response.ok) {
        setSelectedNotifications([]);
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error bulk deleting notifications:', error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const d = dashboard || { messagesSent: 0, totalRecipients: 0, totalDelivered: 0, totalOpened: 0, deliveryRate: 0, openRate: 0 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Notifications</h1>
          <p className="text-muted-text mt-1 text-sm">Manage and track all your broadcast messages</p>
        </div>
        {notifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-2"
          >
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteLoading}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {bulkDeleteLoading ? 'Deleting...' : `Delete (${selectedNotifications.length})`}
              </button>
            )}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-white text-red-600 border border-border rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </motion.div>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={fetchNotifications} className="ml-auto text-sm text-red-600 hover:text-red-800 font-semibold">Retry</button>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 text-sm font-medium">{success}</p>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-foreground mb-2">Clear Notification History?</h3>
              <p className="text-muted-text mb-6 text-sm">This will permanently delete all notification history. This action cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowClearConfirm(false)} disabled={isClearing} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-sm font-semibold">Cancel</button>
                <button onClick={clearHistory} disabled={isClearing} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm font-semibold disabled:opacity-50">
                  {isClearing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Clearing...
                    </>
                  ) : 'Clear All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-border">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-[#22438c] bg-white border-border rounded focus:ring-[#22438c] focus:ring-offset-0"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Media</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Title</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Message</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Sent To</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Delivered</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Opened</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="relative w-10 h-10 mb-3">
                        <div className="absolute inset-0 border-3 border-slate-200 rounded-full"></div>
                        <div className="absolute inset-0 border-3 border-[#22438c] rounded-full border-t-transparent animate-spin"></div>
                      </div>
                      <p className="text-muted-text text-sm">Loading notifications...</p>
                    </div>
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 border border-border rounded-2xl flex items-center justify-center mb-4">
                        <svg className="w-7 h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1">No notifications yet</h3>
                      <p className="text-muted-text text-sm">Start by sending your first broadcast</p>
                    </div>
                  </td>
                </tr>
              ) : (
                notifications.map((notification) => (
                  <motion.tr
                    key={notification._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedNotifications.includes(notification._id) ? 'bg-[#22438c]/5' : ''}`}
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification._id)}
                        onChange={() => handleSelectNotification(notification._id)}
                        className="w-4 h-4 text-[#22438c] bg-white border-border rounded focus:ring-[#22438c] focus:ring-offset-0"
                      />
                    </td>
                    <td className="px-4 py-4">
                      {(() => {
                        const preview = rowAttachmentPreview(notification.attachments, notification.image);
                        const ac = attachmentListCount(notification.attachments, notification.image);
                        return (
                          <div className="relative w-12 h-12">
                            {preview.kind === 'image' ? (
                              <img src={preview.src} alt="" className="w-12 h-12 object-cover rounded-lg border border-border" />
                            ) : preview.kind === 'pdf' ? (
                              <div className="w-12 h-12 rounded-lg border border-border bg-slate-50 flex items-center justify-center text-base">📄</div>
                            ) : (
                              <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              </div>
                            )}
                            {ac > 1 && (
                              <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-foreground text-white px-1 rounded border border-border">+{ac - 1}</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-foreground max-w-[180px] truncate">{notification.title}</div>
                      {notification.link && (
                        <div className="text-xs text-[#22438c] mt-0.5 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                          Link
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-muted-text max-w-[200px] truncate">{notification.message}</div>
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(notification.status)}</td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-foreground">{notification.recipientCount}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-green-600">{notification.deliveredCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-cyan-600">{notification.openedCount ?? 0}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-muted whitespace-nowrap">{formatDate(notification.sentAt || notification.scheduledAt)}</div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-text">
              Page <span className="font-bold text-foreground">{page}</span> of <span className="font-bold text-foreground">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-border rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedNotification && (
        <NotificationDetailModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      )}
    </motion.div>
  );
}

function NotificationDetailModal({ notification, onClose }: { notification: Notification; onClose: () => void }) {
  const parseAttachmentsJson = (str: string | undefined) => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const items = parseAttachmentsJson(notification.attachments);
  const legacyImage = notification.image?.trim();
  const primaryImage =
    items.find((a: { mime: string }) => a.mime.startsWith('image/'))?.dataUrl ||
    (legacyImage && (legacyImage.startsWith('http') || legacyImage.startsWith('data:')) ? legacyImage : undefined);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Notification Details</h2>
          <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {items.length > 0 ? (
            <div className="mb-6 space-y-3">
              {items.map((a: { name: string; dataUrl: string; mime: string }, i: number) =>
                a.mime.startsWith('image/') ? (
                  <img key={`${a.name}-${i}`} src={a.dataUrl} alt={a.name} className="w-full max-h-48 object-contain rounded-xl border border-border bg-slate-50" />
                ) : a.mime === 'application/pdf' ? (
                  <a
                    key={`${a.name}-${i}`}
                    href={a.dataUrl}
                    download={a.name || 'document.pdf'}
                    className="flex items-center gap-3 p-4 rounded-xl border border-border bg-slate-50 text-sm font-semibold text-foreground hover:bg-slate-100 transition-colors"
                  >
                    📄 {a.name || 'PDF attachment'}
                  </a>
                ) : null
              )}
            </div>
          ) : primaryImage ? (
            <div className="mb-6">
              <img src={primaryImage} alt="Notification" className="w-full h-48 object-cover rounded-xl border border-border" />
            </div>
          ) : null}

          <div className="mb-5">
            <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2">Title</label>
            <div className="text-lg font-bold text-foreground">{notification.title}</div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2">Message</label>
            <div className="text-sm text-muted-text bg-slate-50 p-4 rounded-xl border border-border whitespace-pre-wrap">{notification.message}</div>
          </div>

          {notification.link && (
            <div className="mb-5">
              <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2">Link</label>
              <a href={notification.link} target="_blank" rel="noopener noreferrer" className="text-sm text-[#22438c] hover:text-[#1a3575] font-semibold break-all flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                {notification.link}
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="p-4 bg-slate-50 border border-border rounded-xl">
              <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2">Status</label>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                notification.status === 'sent' ? 'bg-green-100 text-green-700' :
                notification.status === 'failed' ? 'bg-red-100 text-red-700' :
                notification.status === 'scheduled' ? 'bg-[#22438c]/10 text-[#22438c]' :
                'bg-[#d0a953]/10 text-[#b8922e]'
              }`}>
                {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
              </span>
            </div>
            <div className="p-4 bg-slate-50 border border-border rounded-xl">
              <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2">Recipients</label>
              <div className="text-lg font-bold text-foreground">{notification.recipientCount}</div>
            </div>
            <div className="p-4 bg-slate-50 border border-border rounded-xl">
              <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2">Delivered</label>
              <div className="text-lg font-bold text-green-600">{notification.deliveredCount ?? 0}</div>
            </div>
            <div className="p-4 bg-slate-50 border border-border rounded-xl">
              <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2">Opened</label>
              <div className="text-lg font-bold text-cyan-600">{notification.openedCount ?? 0}</div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-border rounded-xl">
            <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-2">
              {notification.scheduledAt ? 'Scheduled' : 'Sent'} Date
            </label>
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {formatDate(notification.sentAt || notification.scheduledAt)}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

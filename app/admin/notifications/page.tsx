'use client';

import { useState, useEffect } from 'react';
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
      sent: { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
      failed: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
      scheduled: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
      pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
    };
    const style = styles[status] || { bg: 'bg-slate-700', text: 'text-slate-400', dot: 'bg-slate-400' };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Campaign Dashboard</h1>
        </div>
        {notifications.length > 0 && (
          <div className="flex gap-2">
            {selectedNotifications.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleteLoading}
                className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {bulkDeleteLoading ? 'Deleting...' : `Delete (${selectedNotifications.length})`}
              </button>
            )}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear History
            </button>
          </div>
        )}
      </div>

      {/* Dashboard - 3 prominent metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-300/80">Messages Sent</p>
              <p className="text-4xl font-bold text-white mt-2">{d.messagesSent}</p>
            </div>
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-300/80">Campaign Success</p>
              <p className="text-4xl font-bold text-white mt-2">{d.totalDelivered}<span className="text-lg text-emerald-400/80 ml-1">/ {d.totalOpened} opened</span></p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-xs text-emerald-400/60">Delivery rate: <span className="text-emerald-400 font-semibold">{d.deliveryRate}%</span></p>
                <p className="text-xs text-emerald-400/60">Open rate: <span className="text-emerald-400 font-semibold">{d.openRate}%</span></p>
              </div>
            </div>
            <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-600/20 to-violet-900/20 border border-violet-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-violet-300/80">Total Recipients</p>
              <p className="text-4xl font-bold text-white mt-2">{d.totalRecipients}</p>
            </div>
            <div className="w-14 h-14 bg-violet-500/20 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Status pills row */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Total', value: stats?.total || 0, bg: 'bg-slate-700/40', border: 'border-slate-600/50', text: 'text-white' },
          { label: 'Sent', value: stats?.sent || 0, bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400' },
          { label: 'Failed', value: stats?.failed || 0, bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400' },
          { label: 'Scheduled', value: stats?.scheduled || 0, bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
          { label: 'Pending', value: stats?.pending || 0, bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
        ].map((pill) => (
          <div key={pill.label} className={`${pill.bg} ${pill.border} border rounded-full px-4 py-2 flex items-center gap-2`}>
            <span className="text-xs font-medium text-slate-400">{pill.label}</span>
            <span className={`text-sm font-bold ${pill.text}`}>{pill.value}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400">{error}</p>
            <button onClick={fetchNotifications} className="ml-auto text-sm text-red-400 hover:text-red-300 font-medium">Try again</button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-400">{success}</p>
          </div>
        </div>
      )}

      {/* Clear confirm modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-2">Clear Notification History?</h3>
            <p className="text-slate-400 mb-6">This will permanently delete all notification history. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowClearConfirm(false)} disabled={isClearing} className="px-4 py-2 text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={clearHistory} disabled={isClearing} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors flex items-center gap-2">
                {isClearing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Clearing...
                  </>
                ) : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification History Table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Notification History</h2>
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-slate-500">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No notifications yet</h3>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900/50 border-b border-slate-700/50">
                    <tr>
                      <th className="px-4 py-4 text-left">
                        <input type="checkbox" checked={selectedNotifications.length === notifications.length && notifications.length > 0} onChange={handleSelectAll} className="w-4 h-4 text-blue-600 bg-slate-700 rounded border-slate-600 focus:ring-blue-500 focus:ring-offset-0" />
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Media</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Message</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Sent To</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Delivered</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Opened</th>
                      <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {notifications.map((notification) => (
                      <tr
                        key={notification._id}
                        className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${selectedNotifications.includes(notification._id) ? 'bg-blue-500/5' : ''}`}
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={selectedNotifications.includes(notification._id)} onChange={() => handleSelectNotification(notification._id)} className="w-4 h-4 text-blue-600 bg-slate-700 rounded border-slate-600 focus:ring-blue-500 focus:ring-offset-0" />
                        </td>
                        <td className="px-4 py-4">
                          {(() => {
                            const preview = rowAttachmentPreview(notification.attachments, notification.image);
                            const ac = attachmentListCount(notification.attachments, notification.image);
                            return (
                              <div className="relative w-12 h-12">
                                {preview.kind === 'image' ? (
                                  <img src={preview.src} alt="" className="w-12 h-12 object-cover rounded-lg border border-slate-600" />
                                ) : preview.kind === 'pdf' ? (
                                  <div className="w-12 h-12 rounded-lg border border-slate-600 bg-slate-700/50 flex items-center justify-center text-base">📄</div>
                                ) : (
                                  <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  </div>
                                )}
                                {ac > 1 && (
                                  <span className="absolute -bottom-1 -right-1 text-[10px] font-medium bg-slate-900 text-slate-300 px-1 rounded border border-slate-600">+{ac - 1}</span>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-white max-w-[180px] truncate">{notification.title}</div>
                          {notification.link && (
                            <div className="text-xs text-blue-400 mt-0.5 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                              Link
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-slate-400 max-w-[200px] truncate">{notification.message}</div>
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(notification.status)}</td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-white">{notification.recipientCount}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-emerald-400">{notification.deliveredCount ?? 0}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-sm font-medium text-cyan-400">{notification.openedCount ?? 0}</span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-slate-500 whitespace-nowrap">{formatDate(notification.sentAt || notification.scheduledAt)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                  <p className="text-sm text-slate-500">Page <span className="font-medium text-white">{page}</span> of <span className="font-medium text-white">{totalPages}</span></p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Previous</button>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notification detail modal */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Notification Details</h2>
              <button onClick={() => setSelectedNotification(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {(() => {
                const items = parseAttachmentsJson(selectedNotification.attachments);
                if (items.length > 0) {
                  return (
                    <div className="mb-6 space-y-3">
                      {items.map((a, i) =>
                        a.mime.startsWith('image/') ? (
                          <img key={`${a.name}-${i}`} src={a.dataUrl} alt={a.name} className="w-full max-h-48 object-contain rounded-xl border border-slate-600 bg-slate-700/30" />
                        ) : a.mime === 'application/pdf' ? (
                          <a key={`${a.name}-${i}`} href={a.dataUrl} download={a.name} className="flex items-center gap-2 p-3 rounded-xl border border-slate-600 bg-slate-700/40 text-sm text-blue-400 hover:bg-slate-700/60">📄 {a.name}</a>
                        ) : null
                      )}
                    </div>
                  );
                }
                if (selectedNotification.image) {
                  return (
                    <div className="mb-6">
                      <img src={selectedNotification.image} alt="Notification" className="w-full h-48 object-cover rounded-xl border border-slate-600" />
                    </div>
                  );
                }
                return null;
              })()}

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Title</label>
                <div className="text-lg font-semibold text-white">{selectedNotification.title}</div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Message</label>
                <div className="text-sm text-slate-300 bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">{selectedNotification.message}</div>
              </div>

              {selectedNotification.link && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Link</label>
                  <a href={selectedNotification.link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 break-all flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    {selectedNotification.link}
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                  {getStatusBadge(selectedNotification.status)}
                </div>
                <div className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recipients</label>
                  <div className="text-lg font-bold text-white">{selectedNotification.recipientCount}</div>
                </div>
                <div className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Delivered</label>
                  <div className="text-lg font-bold text-emerald-400">{selectedNotification.deliveredCount ?? 0}</div>
                </div>
                <div className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Opened</label>
                  <div className="text-lg font-bold text-cyan-400">{selectedNotification.openedCount ?? 0}</div>
                </div>
              </div>

              <div className="p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {selectedNotification.scheduledAt ? 'Scheduled' : 'Sent'} Date
                </label>
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {formatDate(selectedNotification.sentAt || selectedNotification.scheduledAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

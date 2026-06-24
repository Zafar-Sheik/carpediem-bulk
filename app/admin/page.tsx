'use client';

import { useState, useEffect, useRef } from 'react';
import type { AttachmentItem } from '@/lib/notificationAttachments';

interface DeviceStats {
  total: number;
  active: number;
  inactive: number;
}

export default function AdminDashboard() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [externalImageUrl, setExternalImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [targetProvince, setTargetProvince] = useState('All');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        const response = await fetch('/api/admin/devices', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setDeviceStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    setError('');

    try {
      const formData = new FormData();
      for (const f of Array.from(files)) {
        formData.append('file', f);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      const uploaded: AttachmentItem[] = Array.isArray(data.files) ? data.files : [];
      if (uploaded.length === 0) {
        throw new Error('No files returned from upload');
      }

      setAttachments((prev) => {
        const next = [...prev];
        for (const item of uploaded) {
          if (next.length >= 10) break;
          next.push(item);
        }
        return next;
      });
      setSuccess(uploaded.length > 1 ? `${uploaded.length} files uploaded` : 'File uploaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSending(true);

    try {
      const payload = {
        title: title.trim(),
        message: message.trim(),
        image: externalImageUrl.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        link: link.trim() || undefined,
        targetProvince,
      };

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      let data: { error?: string; message?: string } = {};
      try {
        data = await response.json();
      } catch {
        throw new Error(`Send failed (${response.status}). The server did not return JSON.`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to send notification (${response.status})`);
      }

      setSuccess(data.message || 'Notification sent successfully!');

      setTitle('');
      setMessage('');
      setAttachments([]);
      setExternalImageUrl('');
      setLink('');
      setScheduledAt('');
      setIsScheduled(false);
      setTargetProvince('All');

      const statsResponse = await fetch('/api/admin/devices', { credentials: 'include' });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setDeviceStats(statsData.stats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1);
    return now.toISOString().slice(0, 16);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Send Notification</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Devices</p>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-slate-700 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-white mt-1">{deviceStats?.total || 0}</p>
              )}
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Active Devices</p>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-slate-700 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-green-400 mt-1">{deviceStats?.active || 0}</p>
              )}
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Inactive Devices</p>
              {isLoadingStats ? (
                <div className="h-8 w-16 bg-slate-700 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-3xl font-bold text-slate-500 mt-1">{deviceStats?.inactive || 0}</p>
              )}
            </div>
            <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {deviceStats && deviceStats.active === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="font-medium text-amber-400">No devices registered yet</p>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-lg font-semibold text-white">New Notification</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Notification title"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Message</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
              placeholder="Write your message..."
            />
          </div>

          <div>
            <label htmlFor="targetProvince" className="block text-sm font-medium text-slate-300 mb-2">Target Province</label>
            <select
              id="targetProvince"
              value={targetProvince}
              onChange={(e) => setTargetProvince(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="All">All Provinces</option>
              <option value="Gauteng">Gauteng</option>
              <option value="KwaZulu-Natal">KwaZulu-Natal</option>
              <option value="Western Cape">Western Cape</option>
              <option value="Eastern Cape">Eastern Cape</option>
              <option value="Free State">Free State</option>
              <option value="Limpopo">Limpopo</option>
              <option value="Mpumalanga">Mpumalanga</option>
              <option value="North West">North West</option>
              <option value="Northern Cape">Northern Cape</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Attachments</label>

            {attachments.length > 0 && (
              <ul className="mb-4 flex flex-wrap gap-3">
                {attachments.map((a, i) => (
                  <li key={`${a.name}-${i}`} className="relative">
                    {a.mime.startsWith('image/') ? (
                      <img
                        src={a.dataUrl}
                        alt={a.name}
                        className="w-24 h-24 object-cover rounded-xl border border-slate-600"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-xl border border-slate-600 bg-slate-700/60 flex flex-col items-center justify-center text-center px-1">
                        <span className="text-lg" aria-hidden>
                          📄
                        </span>
                        <span className="text-[10px] text-slate-400 truncate w-full">{a.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(i)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-400 transition-colors shadow-md"
                      aria-label={`Remove ${a.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 hover:border-slate-500 transition-colors">
                {isUploading ? (
                  <svg className="w-5 h-5 text-blue-400 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="text-sm font-medium text-slate-300">{isUploading ? 'Uploading...' : 'Upload files'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading || attachments.length >= 10}
                  className="hidden"
                />
              </label>
            </div>

            <div className="mt-4">
              <label htmlFor="imageUrl" className="block text-xs font-medium text-slate-500 mb-1.5">
                Image URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  id="imageUrl"
                  type="url"
                  value={externalImageUrl}
                  onChange={(e) => setExternalImageUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="link" className="block text-sm font-medium text-slate-300 mb-2">Link</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <input
                id="link"
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-slate-700/30 border border-slate-700/50 rounded-xl">
            <input
              id="schedule"
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-offset-0"
            />
            <label htmlFor="schedule" className="text-sm font-medium text-slate-300">
              Schedule for later
            </label>
          </div>

          {isScheduled && (
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <label htmlFor="scheduledAt" className="block text-sm font-medium text-blue-400 mb-2">
                Schedule Date & Time
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={getMinDateTime()}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400">{error}</p>
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

          <button
            type="submit"
            disabled={isSending || (isScheduled && !scheduledAt)}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20"
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {isScheduled ? 'Scheduling...' : 'Sending...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {isScheduled ? 'Schedule Notification' : 'Send Notification'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

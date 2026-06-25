'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Device {
  id: number;
  province: string;
  platform: string;
  browser: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
}

interface Stats {
  total: number;
  active: number;
  inactive: number;
  byPlatform: Array<{ _id: string; count: number }>;
  byBrowser: Array<{ _id: string; count: number }>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [platformFilter, setPlatformFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [selectedDevices, setSelectedDevices] = useState<number[]>([]);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, [page, platformFilter, activeFilter]);

  const fetchDevices = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (platformFilter) params.append('platform', platformFilter);
      if (activeFilter) params.append('active', activeFilter);

      const response = await fetch(`/api/admin/devices?${params}`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices);
        setStats(data.stats);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error('Failed to fetch devices');
      }
    } catch (err) {
      setError('Failed to load devices. Please try again.');
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (deviceId: number) => {
    try {
      const response = await fetch(`/api/admin/devices?id=${deviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSelectedDevices(prev => prev.filter(id => id !== deviceId));
        fetchDevices();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting device:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      android: '🤖',
      ios: '🍎',
      windows: '🪟',
      mac: '🍎',
      linux: '🐧',
      unknown: '❓',
    };
    return icons[platform] || '❓';
  };

  const getBrowserIcon = (browser: string) => {
    const icons: Record<string, string> = {
      chrome: '🔵',
      Chrome: '🔵',
      firefox: '🦊',
      Firefox: '🦊',
      safari: '🧭',
      Safari: '🧭',
      edge: '🔷',
      Edge: '🔷',
      opera: '🟣',
      Opera: '🟣',
      unknown: '❓',
    };
    return icons[browser] || '❓';
  };

  const handleSelectAll = () => {
    if (selectedDevices.length === devices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(devices.map(d => d.id));
    }
  };

  const handleSelectDevice = (deviceId: number) => {
    setSelectedDevices(prev =>
      prev.includes(deviceId)
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedDevices.length === 0) return;

    setBulkDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/devices/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedDevices.map(String) }),
      });

      if (response.ok) {
        setSelectedDevices([]);
        fetchDevices();
      }
    } catch (error) {
      console.error('Error bulk deleting devices:', error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Devices</h1>
          <p className="text-muted-text mt-1 text-sm">Manage registered devices and their access</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-5"
      >
        {[
          {
            label: 'Total Devices',
            value: stats?.total || 0,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ),
            color: '#22438c',
            bg: 'bg-[#22438c]/5',
          },
          {
            label: 'Active',
            value: stats?.active || 0,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: '#10b981',
            bg: 'bg-green-50',
          },
          {
            label: 'Inactive',
            value: stats?.inactive || 0,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            ),
            color: '#94a3b8',
            bg: 'bg-slate-100',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`${stat.bg} border border-border rounded-2xl p-6`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-text mb-1">{stat.label}</p>
                <p className="text-4xl font-bold text-foreground tracking-tight">{stat.value}</p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: stat.color }}
              >
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="p-5 border-b border-border">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-muted-text">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="text-sm font-semibold">Filters:</span>
            </div>

            <select
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-[#22438c] focus:border-transparent outline-none transition-all"
            >
              <option value="">All Platforms</option>
              <option value="android">Android</option>
              <option value="ios">iOS</option>
              <option value="windows">Windows</option>
              <option value="mac">Mac</option>
              <option value="linux">Linux</option>
            </select>

            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:ring-2 focus:ring-[#22438c] focus:border-transparent outline-none transition-all"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
              <button onClick={fetchDevices} className="ml-auto text-sm text-red-600 hover:text-red-800 font-semibold">Retry</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="relative w-10 h-10 mx-auto mb-3">
                <div className="absolute inset-0 border-3 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-3 border-[#22438c] rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-muted-text text-sm">Loading devices...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">No devices found</h3>
              <p className="text-muted-text text-sm max-w-sm mx-auto">
                {platformFilter || activeFilter ? 'No devices match your filters.' : 'No registered devices yet.'}
              </p>
              {(platformFilter || activeFilter) && (
                <button
                  onClick={() => { setPlatformFilter(''); setActiveFilter(''); setPage(1); }}
                  className="mt-4 px-4 py-2 text-sm font-bold text-[#22438c] hover:text-[#1a3575] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {selectedDevices.length > 0 && (
                <div className="p-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-red-700">
                    {selectedDevices.length} device{selectedDevices.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteLoading}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {bulkDeleteLoading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Selected
                      </>
                    )}
                  </button>
                </div>
              )}

              <table className="w-full">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDevices.length === devices.length && devices.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-[#22438c] bg-white border-border rounded focus:ring-[#22438c] focus:ring-offset-0"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Device</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Browser</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Province</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-muted-text uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-muted-text uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {devices.map((device) => (
                    <motion.tr
                      key={device.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`hover:bg-slate-50 transition-colors ${selectedDevices.includes(device.id) ? 'bg-[#22438c]/5' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device.id)}
                          onChange={() => handleSelectDevice(device.id)}
                          className="w-4 h-4 text-[#22438c] bg-white border-border rounded focus:ring-[#22438c] focus:ring-offset-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl" title={device.platform}>
                            {getPlatformIcon(device.platform)}
                          </span>
                          <span className="text-sm font-bold text-foreground capitalize">
                            {device.platform || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl" title={device.browser}>
                            {getBrowserIcon(device.browser)}
                          </span>
                          <span className="text-sm text-muted-text capitalize">
                            {device.browser || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-text">
                          {device.province || 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-500"></span>
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-text">
                          {formatDate(device.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-text">
                          {formatDate(device.updated_at || device.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {deleteConfirm === device.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-foreground hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(device.id)}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(device.id)}
                            className="text-red-600 hover:text-red-700 text-sm font-bold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

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
      </motion.div>
    </motion.div>
  );
}

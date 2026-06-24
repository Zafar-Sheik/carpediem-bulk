'use client';

import { useState, useEffect } from 'react';

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Devices</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Devices</p>
              <p className="text-3xl font-bold text-white mt-1">{stats?.total || 0}</p>
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
              <p className="text-sm font-medium text-slate-400">Active</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats?.active || 0}</p>
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
              <p className="text-sm font-medium text-slate-400">Inactive</p>
              <p className="text-3xl font-bold text-slate-500 mt-1">{stats?.inactive || 0}</p>
            </div>
            <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium text-slate-300">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={platformFilter}
              onChange={(e) => { setPlatformFilter(e.target.value); setPage(1); }}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
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
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchDevices}
              className="ml-auto text-sm text-red-400 hover:text-red-300 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-500">Loading devices...</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No devices found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              {platformFilter || activeFilter ? 'No devices match your filters.' : 'No registered devices yet.'}
            </p>
            {(platformFilter || activeFilter) && (
              <button
                onClick={() => { setPlatformFilter(''); setActiveFilter(''); setPage(1); }}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {selectedDevices.length > 0 && (
              <div className="p-4 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                <span className="text-sm font-medium text-red-400">
                  {selectedDevices.length} device{selectedDevices.length > 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {bulkDeleteLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedDevices.length === devices.length && devices.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-slate-700 rounded border-slate-600 focus:ring-blue-500 focus:ring-offset-0"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Device</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Browser</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Province</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Active</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {devices.map((device) => (
                    <tr key={device.id} className={`hover:bg-slate-700/30 transition-colors ${selectedDevices.includes(device.id) ? 'bg-blue-500/5' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(device.id)}
                          onChange={() => handleSelectDevice(device.id)}
                          className="w-4 h-4 text-blue-600 bg-slate-700 rounded border-slate-600 focus:ring-blue-500 focus:ring-offset-0"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl" title={device.platform}>
                            {getPlatformIcon(device.platform)}
                          </span>
                          <span className="text-sm font-medium text-white capitalize">
                            {device.platform || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xl" title={device.browser}>
                            {getBrowserIcon(device.browser)}
                          </span>
                          <span className="text-sm text-slate-400 capitalize">
                            {device.browser || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {device.province || 'Not set'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400">
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-green-400"></span>
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {formatDate(device.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {formatDate(device.updated_at || device.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {deleteConfirm === device.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleDelete(device.id)}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(device.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing page <span className="font-medium text-white">{page}</span> of <span className="font-medium text-white">{totalPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

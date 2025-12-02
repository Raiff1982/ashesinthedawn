/**
 * Codette Control Center
 * Centralized control panel for AI activity, permissions, logs, and settings
 */

import { useState, useEffect } from 'react';
import { RotateCcw, Download, Trash2 } from 'lucide-react';

interface ActivityLog {
  time: string;
  source: 'Codette2.0' | 'User';
  action: string;
}

interface PermissionSetting {
  [key: string]: 'allow' | 'ask' | 'deny';
}

interface LiveStatus {
  message: string;
  active: boolean;
  actions: number;
}

export default function CodetteControlCenter() {
  const [tab, setTab] = useState<'log' | 'permissions' | 'stats' | 'settings'>('log');
  const [permissions, setPermissions] = useState<PermissionSetting>({
    LoadPlugin: 'ask',
    CreateTrack: 'allow',
    RenderMixdown: 'ask',
    AdjustParameters: 'ask',
    SaveProject: 'allow',
  });

  const [activity, setActivity] = useState<ActivityLog[]>([
    { time: '18:42:01', source: 'Codette2.0', action: 'Adjusted EQ on Bass (+1.5 dB)' },
    { time: '18:42:07', source: 'Codette2.0', action: 'Created track: Lead Synth' },
    { time: '18:42:10', source: 'User', action: 'Denied render request' },
  ]);

  const [liveStatus, setLiveStatus] = useState<LiveStatus>({
    message: 'Initializing...',
    active: true,
    actions: 0,
  });

  const [settings, setSettings] = useState({
    enableCodette: true,
    logActivity: true,
    autoRender: false,
    includeLogsInBackup: true,
    clearHistoryOnClose: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const events = [
        'Analyzing spectral balance...',
        'Boosting clarity in vocals...',
        'Monitoring loudness levels...',
        'Synchronizing tempo map...',
        'Optimizing plugin chain...',
        'Analyzing harmonic content...',
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      setLiveStatus((prev) => ({
        ...prev,
        message: event,
        actions: prev.actions + 1,
      }));
      setActivity((prev) => [
        {
          time: new Date().toLocaleTimeString(),
          source: 'Codette2.0',
          action: event,
        },
        ...prev.slice(0, 50),
      ]);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handlePermissionChange = (key: string, value: 'allow' | 'ask' | 'deny') => {
    setPermissions({ ...permissions, [key]: value });
  };

  const handleSettingToggle = (key: keyof typeof settings) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleUndoLastAction = () => {
    if (activity.length > 0) {
      setActivity((prev) => prev.slice(1));
    }
  };

  const handleExportLog = () => {
    const csv = activity
      .map((a) => `"${a.time}","${a.source}","${a.action}"`)
      .join('\n');
    const header = '"Time","Source","Action"\n';
    const blob = new Blob([header + csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codette-activity-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all AI history? This cannot be undone.')) {
      setActivity([]);
      setLiveStatus({ ...liveStatus, actions: 0 });
    }
  };

  const handleResetPermissions = () => {
    setPermissions({
      LoadPlugin: 'ask',
      CreateTrack: 'allow',
      RenderMixdown: 'ask',
      AdjustParameters: 'ask',
      SaveProject: 'allow',
    });
  };

  return (
    <div className="bg-gray-950 text-gray-100 shadow-2xl rounded-lg p-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></div>
          <h2 className="text-2xl font-bold text-white">Codette Control Center</h2>
        </div>
        <span className="text-sm text-gray-400">
          AI {liveStatus.active ? 'Active' : 'Inactive'} • CPU 2.3%
        </span>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-gray-800">
        {(['log', 'permissions', 'stats', 'settings'] as const).map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`px-4 py-2 text-sm font-medium transition-all ${
              tab === tabName
                ? 'text-cyan-400 border-b-2 border-cyan-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {/* Activity Log Tab */}
        {tab === 'log' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 px-4 text-gray-400 font-medium">Time</th>
                    <th className="text-left py-2 px-4 text-gray-400 font-medium">Source</th>
                    <th className="text-left py-2 px-4 text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a, i) => (
                    <tr key={i} className="border-b border-gray-900 hover:bg-gray-900/50 transition">
                      <td className="py-2 px-4 text-gray-300 font-mono text-xs">{a.time}</td>
                      <td className="py-2 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            a.source === 'Codette2.0'
                              ? 'bg-blue-900/40 text-blue-300'
                              : 'bg-green-900/40 text-green-300'
                          }`}
                        >
                          {a.source}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-gray-300">{a.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activity.length === 0 && (
              <div className="text-center py-8 text-gray-500">No activity recorded yet</div>
            )}

            <div className="flex gap-2 justify-end mt-4">
              <button
                onClick={handleUndoLastAction}
                disabled={activity.length === 0}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm font-medium flex items-center gap-2 transition"
              >
                <RotateCcw size={16} /> Undo
              </button>
              <button
                onClick={handleExportLog}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium flex items-center gap-2 transition"
              >
                <Download size={16} /> Export Log
              </button>
            </div>
          </div>
        )}

        {/* Permissions Tab */}
        {tab === 'permissions' && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-2 px-4 text-gray-400 font-medium">Action</th>
                    <th className="text-center py-2 px-4 text-gray-400 font-medium">Always</th>
                    <th className="text-center py-2 px-4 text-gray-400 font-medium">Ask</th>
                    <th className="text-center py-2 px-4 text-gray-400 font-medium">Never</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(permissions).map(([key, value]) => (
                    <tr key={key} className="border-b border-gray-900 hover:bg-gray-900/50 transition">
                      <td className="py-2 px-4 text-gray-300 font-medium">{key}</td>
                      {(['allow', 'ask', 'deny'] as const).map((option) => (
                        <td key={option} className="py-2 px-4 text-center">
                          <input
                            type="radio"
                            name={key}
                            value={option}
                            checked={value === option}
                            onChange={() => handlePermissionChange(key, option)}
                            className="w-4 h-4 cursor-pointer accent-cyan-400"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={handleResetPermissions}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium transition"
              >
                Reset
              </button>
              <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-sm font-medium transition text-white">
                Save
              </button>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {tab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded p-4">
                <p className="text-gray-400 text-sm mb-1">Actions Performed</p>
                <p className="text-3xl font-bold text-cyan-400">{liveStatus.actions}</p>
              </div>
              <div className="bg-gray-900 rounded p-4">
                <p className="text-gray-400 text-sm mb-1">Parameters Changed</p>
                <p className="text-3xl font-bold text-cyan-400">142</p>
              </div>
              <div className="bg-gray-900 rounded p-4">
                <p className="text-gray-400 text-sm mb-1">User Approvals</p>
                <p className="text-3xl font-bold text-green-400">18</p>
              </div>
              <div className="bg-gray-900 rounded p-4">
                <p className="text-gray-400 text-sm mb-1">Denied Actions</p>
                <p className="text-3xl font-bold text-red-400">4</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-400 mb-2">AI Activity This Session</p>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all"
                  style={{ width: `${Math.min(100, liveStatus.actions * 2)}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'settings' && (
          <div className="space-y-4">
            {[
              { key: 'enableCodette', label: 'Enable Codette 2.0 in this project' },
              { key: 'logActivity', label: 'Log AI activity' },
              { key: 'autoRender', label: 'Allow Codette to render automatically' },
              { key: 'includeLogsInBackup', label: 'Include AI logs in backups' },
              { key: 'clearHistoryOnClose', label: 'Clear AI history on project close' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-900 rounded">
                <label className="text-sm text-gray-300 cursor-pointer">{label}</label>
                <button
                  onClick={() => handleSettingToggle(key as keyof typeof settings)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    settings[key as keyof typeof settings]
                      ? 'bg-cyan-600'
                      : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      settings[key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  ></div>
                </button>
              </div>
            ))}

            <div className="flex justify-end mt-6">
              <button
                onClick={handleClearHistory}
                className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-sm font-medium flex items-center gap-2 transition"
              >
                <Trash2 size={16} /> Clear History
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Status Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 text-cyan-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span>{liveStatus.message}</span>
        </div>
        <span className="text-xs text-gray-500">Actions: {liveStatus.actions}</span>
      </div>
    </div>
  );
}

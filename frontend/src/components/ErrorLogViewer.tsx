import React, { useState, useEffect } from 'react';
import { errorReporter, type ErrorLog } from '../services/errorReporter';

interface ErrorLogViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ErrorLogViewer: React.FC<ErrorLogViewerProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      
      if (autoRefresh) {
        const interval = setInterval(loadLogs, 2000);
        return () => clearInterval(interval);
      }
    }
  }, [isOpen, autoRefresh]);

  const loadLogs = () => {
    setLogs(errorReporter.getRecentLogs());
  };

  const handleExport = () => {
    const logText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}\n` +
      (log.stack ? `Stack: ${log.stack}\n` : '') +
      (log.context ? `Context: ${JSON.stringify(log.context, null, 2)}\n` : '') +
      '---\n'
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bloomswift-frontend-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    errorReporter.clearLogs();
    setLogs([]);
  };

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return '🔴';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📝';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 max-w-6xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Frontend Error Logs</h2>
            <p className="text-sm text-gray-600 mt-1">Real-time application error tracking</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-3xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All ({logs.length})</option>
                <option value="error">Errors ({logs.filter(l => l.level === 'error').length})</option>
                <option value="warn">Warnings ({logs.filter(l => l.level === 'warn').length})</option>
                <option value="info">Info ({logs.filter(l => l.level === 'info').length})</option>
              </select>
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Auto-refresh</span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadLogs}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 text-sm"
              disabled={logs.length === 0}
            >
              💾 Export
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
              disabled={logs.length === 0}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No logs found</p>
              <p className="text-sm mt-2">
                {filter !== 'all' ? 'Try changing the filter' : 'Logs will appear here as they occur'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getLevelColor(log.level)} border-opacity-20`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-2xl">{getLevelIcon(log.level)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${getLevelColor(log.level)}`}>
                            {log.level}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {log.message}
                        </p>
                        
                        {log.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                              View Stack Trace
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                              {log.stack}
                            </pre>
                          </details>
                        )}
                        
                        {log.context && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-800">
                              View Context
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                              {JSON.stringify(log.context, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredLogs.length} log{filteredLogs.length !== 1 ? 's' : ''} displayed
          </span>
          <span>
            Max capacity: 100 logs (auto-rotating)
          </span>
        </div>
      </div>
    </div>
  );
};

export default ErrorLogViewer;

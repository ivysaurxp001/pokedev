import React, { useState } from 'react';
import { isAdmin, login, logout, setAdminPassword } from '../utils/adminAuth';
import { exportDatabaseAsFile, importDatabaseFromFile } from '../services/databaseService';
import { Lock, Unlock, Download, Upload, Key, AlertCircle, CheckCircle, X } from 'lucide-react';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(isAdmin());
  const [password, setPassword] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (login(password)) {
      setIsAuthenticated(true);
      setPassword('');
      setMessage({ type: 'success', text: 'Đăng nhập thành công!' });
    } else {
      setMessage({ type: 'error', text: 'Mật khẩu không đúng!' });
    }
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    setMessage({ type: 'success', text: 'Đã đăng xuất' });
  };

  const handleExport = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await exportDatabaseAsFile();
      setMessage({ type: 'success', text: 'Export thành công! File đã được tải về.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: `Export thất bại: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Vui lòng chọn file để import' });
      return;
    }

    if (!importPassword) {
      setMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu import' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const result = await importDatabaseFromFile(importFile, importPassword, {
        overwriteExisting: true,
      });

      setMessage({
        type: 'success',
        text: `Import thành công! ${result.projectsImported} projects, ${result.filesImported} files. ${result.errors.length > 0 ? `Có ${result.errors.length} lỗi.` : ''}`,
      });

      if (result.errors.length > 0) {
        console.warn('Import errors:', result.errors);
      }

      setImportFile(null);
      setImportPassword('');
      
      // Reload page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: `Import thất bại: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu mới không khớp!' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự!' });
      return;
    }

    if (setAdminPassword(newPassword, currentPassword)) {
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ type: 'error', text: 'Mật khẩu hiện tại không đúng!' });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-800 p-8 max-w-md w-full">
          <div className="flex items-center gap-3 mb-6">
            <Lock className="text-cyan-400" size={24} />
            <h2 className="text-xl font-tech font-bold text-white">Admin Login</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-2">
                Mật khẩu Admin
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-white focus:border-cyan-500 outline-none font-mono-tech"
                placeholder="Nhập mật khẩu..."
                autoFocus
              />
            </div>

            {message && (
              <div className={`p-3 border ${
                message.type === 'success' 
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                  : 'border-red-500/30 bg-red-500/10 text-red-400'
              } text-sm font-mono-tech`}>
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleLogin}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 font-mono-tech text-sm uppercase tracking-wider transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono-tech text-sm uppercase tracking-wider transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Unlock className="text-emerald-400" size={24} />
            <h2 className="text-xl font-tech font-bold text-white">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 border flex items-center gap-2 ${
            message.type === 'success' 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
              : 'border-red-500/30 bg-red-500/10 text-red-400'
          } text-sm font-mono-tech`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {/* Export Section */}
          <div className="border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Download className="text-cyan-400" size={20} />
              <h3 className="text-lg font-tech font-bold text-white">Export Database</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4 font-mono-tech">
              Tải xuống toàn bộ dữ liệu (projects + files) dưới dạng JSON
            </p>
            <button
              onClick={handleExport}
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white px-6 py-3 font-mono-tech text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Download size={16} />
              {loading ? 'Đang export...' : 'Export Database'}
            </button>
          </div>

          {/* Import Section */}
          <div className="border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="text-purple-400" size={20} />
              <h3 className="text-lg font-tech font-bold text-white">Import Database</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4 font-mono-tech">
              Import dữ liệu từ file JSON (yêu cầu mật khẩu)
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-2">
                  Chọn file JSON
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-sm file:font-mono-tech file:bg-cyan-600 file:text-white hover:file:bg-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-2">
                  Mật khẩu Import
                </label>
                <input
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-white focus:border-purple-500 outline-none font-mono-tech"
                  placeholder="Nhập mật khẩu import..."
                />
              </div>

              <button
                onClick={handleImport}
                disabled={loading || !importFile || !importPassword}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-6 py-3 font-mono-tech text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                {loading ? 'Đang import...' : 'Import Database'}
              </button>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="border border-slate-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="text-amber-400" size={20} />
              <h3 className="text-lg font-tech font-bold text-white">Đổi Mật Khẩu Admin</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-2">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-white focus:border-amber-500 outline-none font-mono-tech"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-2">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-white focus:border-amber-500 outline-none font-mono-tech"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-tech text-slate-500 uppercase mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-4 py-3 text-white focus:border-amber-500 outline-none font-mono-tech"
                />
              </div>

              <button
                onClick={handleChangePassword}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 font-mono-tech text-sm uppercase tracking-wider transition-colors"
              >
                Đổi Mật Khẩu
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 px-6 py-3 font-mono-tech text-sm uppercase tracking-wider transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;


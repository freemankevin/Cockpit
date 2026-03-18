import { useState, useEffect } from 'react';
import type { SSHHost, CreateHostRequest, UpdateHostRequest } from '@/types';
import { keyApi, type SSHKeyResponse } from '@/services/api';

interface AddHostModalProps {
  host: SSHHost | null;
  copyingHost?: SSHHost | null;
  onClose: () => void;
  onSubmit: (data: CreateHostRequest | UpdateHostRequest) => Promise<boolean>;
}

const AddHostModal = ({ host, copyingHost, onClose, onSubmit }: AddHostModalProps) => {
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<SSHKeyResponse[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    port: 22,
    username: '',
    auth_type: 'password' as 'password' | 'key',
    password: '',
    private_key: '',
    key_passphrase: '',
    tags: [] as string[],
  });

  // Load key list
  useEffect(() => {
    const loadKeys = async () => {
      try {
        const response = await keyApi.getAll();
        if (response.success && response.data) {
          setKeys(response.data);
        }
      } catch (error) {
        console.error('Failed to load keys:', error);
      }
    };
    loadKeys();
  }, []);

  // Populate form in edit or copy mode
  useEffect(() => {
    if (host) {
      setFormData({
        name: host.name,
        address: host.address,
        port: host.port,
        username: host.username,
        auth_type: host.auth_type,
        password: host.password || '',
        private_key: host.private_key || '',
        key_passphrase: host.key_passphrase || '',
        tags: host.tags || [],
      });
    } else if (copyingHost) {
      setFormData({
        name: `${copyingHost.name} (Copy)`,
        address: '',
        port: copyingHost.port,
        username: copyingHost.username,
        auth_type: copyingHost.auth_type,
        password: copyingHost.password || '',
        private_key: copyingHost.private_key || '',
        key_passphrase: copyingHost.key_passphrase || '',
        tags: copyingHost.tags || [],
      });
    } else {
      setFormData({
        name: '',
        address: '',
        port: 22,
        username: '',
        auth_type: 'password',
        password: '',
        private_key: '',
        key_passphrase: '',
        tags: [],
      });
    }
  }, [host, copyingHost]);

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      alert('Please enter display name');
      return false;
    }
    if (!formData.address.trim()) {
      alert('Please enter host address');
      return false;
    }
    if (!formData.username.trim()) {
      alert('Please enter username');
      return false;
    }
    // In edit mode, if password/private key already exists, allow not re-entering
    if (formData.auth_type === 'password' && !formData.password && !host) {
      alert('Please enter password');
      return false;
    }
    if (formData.auth_type === 'key' && !formData.private_key && !host) {
      alert('Please select or enter private key');
      return false;
    }
    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Build submission data
      const submitData: Record<string, unknown> = {
        name: formData.name,
        address: formData.address,
        port: formData.port,
        username: formData.username,
        auth_type: formData.auth_type,
        tags: formData.tags,
      };

      // Handle sensitive fields
      if (formData.auth_type === 'password') {
        // In edit mode, if password is empty, don't send password field (keep original value)
        // But we must send auth_type to ensure backend switches to password mode if it was key mode
        if (formData.password) {
          submitData.password = formData.password;
        }
        // Clear key-related fields when switching to password mode
        submitData.private_key = '';
        submitData.key_passphrase = '';
      } else if (formData.auth_type === 'key') {
        // In edit mode, if private key is empty, don't send (keep original value)
        // But we must send auth_type to ensure backend switches to key mode if it was password mode
        if (formData.private_key && formData.private_key !== '__custom__') {
          submitData.private_key = formData.private_key;
        }
        if (formData.key_passphrase) {
          submitData.key_passphrase = formData.key_passphrase;
        }
        // Clear password when switching to key mode
        submitData.password = '';
      }

      console.log('Submission data:', submitData);
      console.log('Edit mode:', !!host, 'Host ID:', host?.id);

      const success = await onSubmit(submitData as CreateHostRequest | UpdateHostRequest);
      console.log('Submission result:', success);

      if (!success) {
        alert('Save failed, please try again');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Save failed, please check console logs');
    } finally {
      setLoading(false);
    }
  };

  // Get title
  const getTitle = () => {
    if (host) return 'Edit SSH Host';
    if (copyingHost) return 'Copy SSH Host';
    return 'Add SSH Host';
  };

  // Get submit button text
  const getSubmitText = () => {
    if (loading) return 'Saving...';
    if (host) return 'Save Changes';
    if (copyingHost) return 'Create Copy';
    return 'Test and Save';
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in 
                    border border-gray-200/60 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 
                          flex items-center justify-center shadow-lg shadow-blue-500/20">
              <i className="fa-solid fa-server w-5 h-5 text-white"></i>
            </div>
            <div>
              <h3 className="text-[17px] font-semibold text-gray-900">
                {getTitle()}
              </h3>
              {copyingHost && (
                <p className="text-[12px] text-gray-500">
                  Cloned from: {copyingHost.name}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                     rounded-lg transition-all duration-200"
          >
            <i className="fa-solid fa-xmark w-5 h-5"></i>
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Host Name & Main IPv4 Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-server w-3.5 h-3.5 text-gray-400"></i>
                Host Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl
                         text-[13px] text-gray-900 placeholder-gray-400
                         transition-all duration-200
                         focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                         hover:border-gray-300"
                placeholder="e.g.: Production-API"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-globe w-3.5 h-3.5 text-gray-400"></i>
                IPv4 Address
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl
                         text-[13px] text-gray-900 placeholder-gray-400
                         transition-all duration-200
                         focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                         hover:border-gray-300"
                placeholder="Public IP or Private IP"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          {/* Port & Username */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-hashtag w-3.5 h-3.5 text-gray-400"></i>
                Port
              </label>
              <input
                type="number"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl
                         text-[13px] text-gray-900
                         transition-all duration-200
                         focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                         hover:border-gray-300"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 22 })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-user w-3.5 h-3.5 text-gray-400"></i>
                Username
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl
                         text-[13px] text-gray-900 placeholder-gray-400
                         font-sans transition-all duration-200
                         focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                         hover:border-gray-300"
                placeholder="root"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
          </div>

          {/* Auth Type */}
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">
              Authentication Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, auth_type: 'key' })}
                className={`px-4 py-3 rounded-xl border-2 text-[13px] font-medium 
                          transition-all duration-200 flex items-center justify-center gap-2
                          ${formData.auth_type === 'key'
                            ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
              >
                <i className="fa-solid fa-key w-4 h-4"></i>
                SSH Key
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, auth_type: 'password' })}
                className={`px-4 py-3 rounded-xl border-2 text-[13px] font-medium 
                          transition-all duration-200 flex items-center justify-center gap-2
                          ${formData.auth_type === 'password'
                            ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm shadow-blue-500/10'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
              >
                <i className="fa-solid fa-lock w-4 h-4"></i>
                Password
              </button>
            </div>
          </div>

          {/* Auth Input */}
          {formData.auth_type === 'key' ? (
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fa-solid fa-key w-3.5 h-3.5 text-gray-400"></i>
                  Select Key
                </label>
                <select
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl
                           text-[13px] text-gray-900
                           transition-all duration-200
                           focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                           hover:border-gray-300 appearance-none cursor-pointer"
                  value={formData.private_key}
                  onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
                >
                  <option value="">Select saved key</option>
                  {keys.map((key) => (
                    <option key={key.id} value={key.id.toString()}>
                      {key.name} ({key.type.toUpperCase()})
                    </option>
                  ))}
                  <option value="__custom__">+ Manually enter private key</option>
                </select>
              </div>

              {/* Manual private key input */}
              {formData.private_key === '__custom__' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <i className="fa-solid fa-pen-to-square w-3.5 h-3.5 text-gray-400"></i>
                    Private Key Content
                  </label>
                  <textarea
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl
                             text-[12px] text-gray-900 placeholder-gray-400 font-mono
                             transition-all duration-200
                             focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                             hover:border-gray-300 resize-none"
                    rows={6}
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                    value={formData.private_key === '__custom__' ? '' : formData.private_key}
                    onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
                  />
                </div>
              )}

              {/* Key Passphrase (optional) */}
              <div className="space-y-2">
                <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <i className="fa-solid fa-lock w-3.5 h-3.5 text-gray-400"></i>
                  Key Passphrase <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl
                           text-[13px] text-gray-900 placeholder-gray-400
                           transition-all duration-200
                           focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                           hover:border-gray-300"
                  placeholder="Enter passphrase if your key is encrypted"
                  value={formData.key_passphrase}
                  onChange={(e) => setFormData({ ...formData, key_passphrase: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <i className="fa-solid fa-lock w-3.5 h-3.5 text-gray-400"></i>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl
                           text-[13px] text-gray-900 placeholder-gray-400
                           transition-all duration-200
                           focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                           hover:border-gray-300"
                  placeholder={host ? "Leave blank to keep current password" : "Enter password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1
                           text-gray-400 hover:text-gray-600
                           transition-colors rounded-md hover:bg-gray-100"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} w-4 h-4`}></i>
                </button>
              </div>
            </div>
          )}

          {/* Copy Mode Hint */}
          {copyingHost && (
            <div className="p-4 bg-indigo-50 border border-indigo-200/60 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-copy w-4 h-4 text-indigo-600"></i>
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-indigo-900">Cloning Host Configuration</p>
                  <p className="text-[12px] text-indigo-700 mt-1">
                    Copied authentication config from {copyingHost.name}. Please fill in new host address and name.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[13px] font-medium text-gray-600 
                     hover:text-gray-800 hover:bg-gray-200/50 
                     transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl 
                     text-[13px] font-medium transition-all duration-200 
                     flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                     shadow-[0_0.5px_1px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.1),inset_0_0.5px_0_rgba(255,255,255,0.25)]
                     hover:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_4px_rgba(0,0,0,0.1),inset_0_0.5px_0_rgba(255,255,255,0.25)]
                     hover:brightness-105 active:scale-[0.98]"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-circle-notch animate-spin w-4 h-4"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fa-solid fa-plug w-4 h-4"></i>
                {getSubmitText()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddHostModal;

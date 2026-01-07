import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Button from './ui/Button';
import api from '@/lib/api';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordRequirement {
  label: string;
  met: boolean;
}

export default function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRequirements, setShowRequirements] = useState(false);

  const getPasswordRequirements = (password: string): PasswordRequirement[] => {
    return [
      { label: t('auth.reqMinLength'), met: password.length >= 6 },
      { label: t('auth.reqUppercase'), met: /[A-Z]/.test(password) },
      { label: t('auth.reqSpecialChar'), met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
  };

  const passwordRequirements = getPasswordRequirements(newPassword);
  const isPasswordValid = passwordRequirements.every(req => req.met);

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setShowRequirements(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError(t('auth.currentPasswordRequired'));
      return;
    }

    if (!isPasswordValid) {
      setError(t('auth.passwordRequirementsNotMet'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      toast.success(t('auth.passwordUpdated'));
      handleClose();
    } catch (err: any) {
      const message = err.response?.data?.message || 
                     err.response?.data?.errors?.[0]?.msg ||
                     t('auth.passwordChangeFailed');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('auth.changePassword')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Current Password */}
        <div className="relative">
          <Input
            type={showCurrentPassword ? 'text' : 'password'}
            label={t('auth.currentPassword')}
            placeholder={t('auth.currentPasswordPlaceholder')}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
          >
            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* New Password */}
        <div className="relative">
          <Input
            type={showNewPassword ? 'text' : 'password'}
            label={t('auth.newPassword')}
            placeholder={t('auth.newPasswordPlaceholder')}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onFocus={() => setShowRequirements(true)}
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
          >
            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Password requirements */}
        {showRequirements && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-semibold text-blue-900 mb-2">{t('auth.passwordRequirements')}</p>
            <ul className="space-y-1">
              {passwordRequirements.map((req, index) => (
                <li key={index} className="flex items-center gap-2 text-xs">
                  {req.met ? (
                    <Check size={14} className="text-green-600" />
                  ) : (
                    <X size={14} className="text-gray-400" />
                  )}
                  <span className={req.met ? 'text-green-700' : 'text-gray-600'}>
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Confirm Password */}
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            label={t('auth.confirmPassword')}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px] text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? t('auth.changingPassword') : t('auth.changePasswordButton')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

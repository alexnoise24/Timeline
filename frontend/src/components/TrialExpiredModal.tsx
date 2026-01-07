import { useTranslation } from 'react-i18next';
import { Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

interface TrialExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPlans?: () => void;
}

export default function TrialExpiredModal({ isOpen, onClose, onViewPlans }: TrialExpiredModalProps) {
  const { t } = useTranslation();

  const handleViewPlans = () => {
    onClose();
    if (onViewPlans) {
      onViewPlans();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 sm:p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Clock size={32} className="text-amber-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-heading text-text mb-3">
          {t('trial.expiredTitle')}
        </h2>

        {/* Description */}
        <p className="text-text/70 mb-6 max-w-sm mx-auto">
          {t('trial.expiredDescription')}
        </p>

        {/* Features locked notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3 text-left">
            <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">
                {t('trial.featuresLocked')}
              </p>
              <ul className="text-xs text-amber-700 mt-2 space-y-1">
                <li>• {t('trial.lockedFeature1')}</li>
                <li>• {t('trial.lockedFeature2')}</li>
                <li>• {t('trial.lockedFeature3')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {t('trial.maybeLater')}
          </Button>
          <Button
            onClick={handleViewPlans}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent/80 text-text"
          >
            {t('trial.viewPlans')}
            <ArrowRight size={16} />
          </Button>
        </div>

        {/* Support link */}
        <p className="text-xs text-text/50 mt-4">
          {t('trial.needHelp')}{' '}
          <a href="mailto:support@lenzu.app" className="text-accent hover:underline">
            {t('trial.contactSupport')}
          </a>
        </p>
      </div>
    </Modal>
  );
}

import { useOffline } from '@/context/OfflineContext';
import { WifiOff, RefreshCw, CloudOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OfflineIndicator() {
  const { isOnline, isSyncing, lastSyncTime, pendingChangesCount, syncNow } = useOffline();
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  if (isOnline && pendingChangesCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] safe-area-top">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
          <WifiOff size={20} />
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">
              {isSpanish ? 'Sin conexión' : 'Offline Mode'}
            </p>
            <span className="text-xs opacity-80">
              — {isSpanish 
                ? `Última sync: ${lastSyncTime}` 
                : `Last sync: ${lastSyncTime}`}
            </span>
          </div>
        </div>
      )}

      {/* Pending Changes Badge */}
      {pendingChangesCount > 0 && !isSyncing && (
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
          <CloudOff size={20} />
          <p className="font-semibold text-sm">
            {pendingChangesCount} {isSpanish ? 'cambios pendientes' : 'pending changes'}
          </p>
          {isOnline && (
            <button
              onClick={syncNow}
              className="ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition-colors"
            >
              {isSpanish ? 'Sincronizar' : 'Sync now'}
            </button>
          )}
        </div>
      )}

      {/* Syncing Indicator */}
      {isSyncing && (
        <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
          <RefreshCw size={20} className="animate-spin" />
          <p className="font-semibold text-sm">
            {isSpanish ? 'Sincronizando...' : 'Syncing...'}
          </p>
        </div>
      )}
    </div>
  );
}

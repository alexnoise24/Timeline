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
    <div className="fixed bottom-4 left-4 z-50">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 mb-2">
          <WifiOff size={18} />
          <div>
            <p className="font-medium text-sm">
              {isSpanish ? 'Sin conexión' : 'Offline'}
            </p>
            <p className="text-xs opacity-80">
              {isSpanish 
                ? `Última sync: ${lastSyncTime}` 
                : `Last sync: ${lastSyncTime}`}
            </p>
          </div>
        </div>
      )}

      {/* Pending Changes Badge */}
      {pendingChangesCount > 0 && (
        <div className="bg-blue-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-3 mb-2">
          <CloudOff size={18} />
          <div>
            <p className="font-medium text-sm">
              {pendingChangesCount} {isSpanish ? 'cambios pendientes' : 'pending changes'}
            </p>
            {isOnline && (
              <button
                onClick={syncNow}
                disabled={isSyncing}
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                {isSpanish ? 'Sincronizar ahora' : 'Sync now'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Syncing Indicator */}
      {isSyncing && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
          <RefreshCw size={18} className="animate-spin" />
          <p className="font-medium text-sm">
            {isSpanish ? 'Sincronizando...' : 'Syncing...'}
          </p>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { dialogService, DialogRequest } from '../../services/dialogService';

const DialogHost: React.FC = () => {
  const [dialog, setDialog] = useState<DialogRequest | null>(null);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const payload = dialogService.asDialogEvent(event).detail;
      setDialog(payload);
    };
    window.addEventListener(dialogService.eventName, handleOpen);
    return () => window.removeEventListener(dialogService.eventName, handleOpen);
  }, []);

  if (!dialog) return null;

  const close = (result: boolean) => {
    dialogService.resolve(dialog.id, result);
    setDialog(null);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[560px] rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 md:p-7">
        <h3 className="text-2xl font-semibold tracking-tight text-slate-900">{dialog.title || 'Notice'}</h3>
        <p className="text-lg text-slate-700 mt-3">{dialog.message}</p>

        <div className="mt-8 flex items-center justify-end gap-3">
          {dialog.kind === 'confirm' && (
            <button
              onClick={() => close(false)}
              className="h-12 px-8 rounded-full bg-slate-100 text-slate-800 text-sm font-semibold hover:bg-slate-200 transition-colors"
            >
              {dialog.cancelText || 'Cancel'}
            </button>
          )}
          <button
            onClick={() => close(true)}
            className={`h-12 px-8 rounded-full text-sm font-semibold transition-colors ${
              dialog.danger
                ? 'bg-rose-700 text-white hover:bg-rose-800'
                : 'bg-slate-700 text-white hover:bg-slate-800'
            }`}
          >
            {dialog.confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogHost;


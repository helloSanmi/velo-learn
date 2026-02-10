type DialogKind = 'confirm' | 'notice';

export interface DialogRequest {
  id: string;
  kind: DialogKind;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type DialogOpenEvent = CustomEvent<DialogRequest>;

const DIALOG_EVENT = 'velo:dialog:open';
const resolverMap = new Map<string, (result: boolean) => void>();

const emitDialog = (request: Omit<DialogRequest, 'id'>): Promise<boolean> => {
  const id = crypto.randomUUID();
  const payload: DialogRequest = { id, ...request };

  return new Promise<boolean>((resolve) => {
    resolverMap.set(id, resolve);
    window.dispatchEvent(new CustomEvent(DIALOG_EVENT, { detail: payload }));
  });
};

export const dialogService = {
  eventName: DIALOG_EVENT,
  confirm: (
    message: string,
    options?: { title?: string; confirmText?: string; cancelText?: string; danger?: boolean }
  ) =>
    emitDialog({
      kind: 'confirm',
      message,
      title: options?.title || 'Confirm action',
      confirmText: options?.confirmText || 'OK',
      cancelText: options?.cancelText || 'Cancel',
      danger: options?.danger
    }),
  notice: (message: string, options?: { title?: string; confirmText?: string }) =>
    emitDialog({
      kind: 'notice',
      message,
      title: options?.title || 'Notice',
      confirmText: options?.confirmText || 'OK'
    }),
  resolve: (id: string, result: boolean) => {
    const resolver = resolverMap.get(id);
    if (!resolver) return;
    resolver(result);
    resolverMap.delete(id);
  },
  asDialogEvent: (event: Event) => event as DialogOpenEvent
};


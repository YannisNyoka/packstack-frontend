import { render } from '@testing-library/react';
import { ToastProvider } from '../components/toast/ToastContext.jsx';
import { ConfirmProvider } from '../components/confirm/ConfirmContext.jsx';

/**
 * Wraps a component with ToastProvider/ConfirmProvider - anything using
 * useToast()/useConfirm() (window.confirm/alert's in-app replacements)
 * throws without these ancestors. Prefer this over a bare render() for any
 * page that has a destructive action or a success/error notification.
 */
export function renderWithProviders(ui, options) {
  return render(
    <ToastProvider>
      <ConfirmProvider>{ui}</ConfirmProvider>
    </ToastProvider>,
    options
  );
}

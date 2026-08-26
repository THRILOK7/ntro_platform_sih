/**
 * Toast notification system using CSS animations.
 * Provides lightweight success, error, and info notifications.
 */

type ToastType = 'success' | 'error' | 'info';

interface ToastOptions {
  duration?: number; // milliseconds, 0 = no auto-dismiss
  position?: 'top' | 'bottom';
}

const DEFAULT_DURATION = 3000;
const TOAST_CONTAINER_ID = 'toast-container';

/**
 * Initialize toast container if it doesn't exist.
 */
function ensureToastContainer(): HTMLElement {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }
  
  return container;
}

/**
 * Show a toast notification.
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  options: ToastOptions = {}
): void {
  const { duration = DEFAULT_DURATION, position = 'top' } = options;
  
  const container = ensureToastContainer();
  
  // Create toast element
  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 12px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease-in-out;
    pointer-events: all;
    cursor: pointer;
  `;
  
  // Set colors based on type
  switch (type) {
    case 'success':
      toast.style.backgroundColor = '#4caf50';
      toast.style.color = '#fff';
      break;
    case 'error':
      toast.style.backgroundColor = '#f44336';
      toast.style.color = '#fff';
      break;
    case 'info':
      toast.style.backgroundColor = '#2196f3';
      toast.style.color = '#fff';
      break;
  }
  
  toast.textContent = message;
  
  // Add animation keyframes if not already added
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add to container
  if (position === 'top') {
    container.insertBefore(toast, container.firstChild);
  } else {
    container.appendChild(toast);
  }
  
  // Handle click to dismiss
  toast.addEventListener('click', () => removeToast(toast));
  
  // Auto-dismiss if duration > 0
  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
}

/**
 * Remove a toast notification with animation.
 */
function removeToast(toast: HTMLElement): void {
  toast.style.animation = 'slideOut 0.3s ease-in-out';
  setTimeout(() => toast.remove(), 300);
}

/**
 * Convenience functions.
 */
export const toast = {
  success: (message: string, duration?: number) =>
    showToast(message, 'success', { duration }),
  error: (message: string, duration?: number) =>
    showToast(message, 'error', { duration }),
  info: (message: string, duration?: number) =>
    showToast(message, 'info', { duration }),
};

/**
 * Toast Notifications System
 */

export const ToastType = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning'
};

class Toast {
  constructor() {
    this.container = this._getOrCreateContainer();
    this.toasts = [];
  }

  _getOrCreateContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  _createToastElement(message, type, duration) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const icon = this._getIconForType(type);
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${this._escapeHtml(message)}</span>
      <button class="toast-close" aria-label="Închide notificare">×</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.remove(toast));

    if (duration > 0) {
      setTimeout(() => this.remove(toast), duration);
    }

    return toast;
  }

  _getIconForType(type) {
    const icons = {
      [ToastType.SUCCESS]: '<i class="fa-solid fa-check" aria-hidden="true"></i>',
      [ToastType.ERROR]: '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>',
      [ToastType.INFO]: '<i class="fa-solid fa-circle-info" aria-hidden="true"></i>',
      [ToastType.WARNING]: '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>'
    };
    return icons[type] || '<i class="fa-solid fa-circle" aria-hidden="true"></i>';
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  show(message, type = ToastType.INFO, duration = 5000) {
    const toastElement = this._createToastElement(message, type, duration);
    this.container.appendChild(toastElement);
    this.toasts.push(toastElement);

    // Trigger animation
    setTimeout(() => toastElement.classList.add('show'), 10);

    return toastElement;
  }

  success(message, duration = 5000) {
    return this.show(message, ToastType.SUCCESS, duration);
  }

  error(message, duration = 5000) {
    return this.show(message, ToastType.ERROR, duration);
  }

  info(message, duration = 5000) {
    return this.show(message, ToastType.INFO, duration);
  }

  warning(message, duration = 5000) {
    return this.show(message, ToastType.WARNING, duration);
  }

  remove(toastElement) {
    toastElement.classList.remove('show');
    setTimeout(() => {
      toastElement.remove();
      this.toasts = this.toasts.filter((t) => t !== toastElement);
    }, 300);
  }

  clear() {
    this.toasts.forEach((toast) => this.remove(toast));
  }
}

export default new Toast();

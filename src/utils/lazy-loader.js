/**
 * Lazy Loading Utility for Images and Components
 */

export class LazyLoader {
  constructor(options = {}) {
    this.options = {
      rootMargin: options.rootMargin || '50px',
      threshold: options.threshold || 0.01,
      ...options
    };
    this.observer = null;
    this.init();
  }

  init() {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this._loadElement(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      }, this.options);
    }
  }

  _loadElement(element) {
    if (element.tagName === 'IMG') {
      this._loadImage(element);
    } else if (element.dataset.src) {
      this._loadContent(element);
    }
  }

  _loadImage(img) {
    const src = img.dataset.src;
    const srcset = img.dataset.srcset;

    if (src) {
      img.src = src;
    }
    if (srcset) {
      img.srcset = srcset;
    }

    img.classList.remove('lazy');
    img.addEventListener('load', () => {
      img.classList.add('loaded');
    });
  }

  _loadContent(element) {
    const src = element.dataset.src;
    fetch(src)
      .then((response) => response.text())
      .then((html) => {
        element.innerHTML = html;
        element.classList.add('loaded');
      })
      .catch((error) => {
        console.error('Failed to lazy load content:', error);
        element.classList.add('error');
      });
  }

  observe(selector) {
    if (!this.observer) return;

    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      this.observer.observe(element);
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Initialize global lazy loading
 */
export function initLazyLoading() {
  const loader = new LazyLoader({
    rootMargin: '50px',
    threshold: 0.01
  });

  loader.observe('[data-src]');
  loader.observe('img.lazy');

  return loader;
}

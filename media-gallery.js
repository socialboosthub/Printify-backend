(() => {
  if (!customElements.get('media-gallery')) {
    customElements.define('media-gallery', class MediaGallery extends HTMLElement {
      constructor() {
        super();
        this.elements = {
          liveRegion:   this.querySelector('[id^="GalleryStatus"]'),
          viewer:       this.querySelector('[id^="GalleryViewer"]'),
          thumbnails:   this.querySelector('[id^="GalleryThumbnails"]'),
          dotsProgress: this.querySelector('[id^="DotsProgress"]'),
          prevButton:   this.querySelector('.gallery-nav-btn--prev'),
          nextButton:   this.querySelector('.gallery-nav-btn--next'),
          thumbnailPrevButton: this.querySelector('.thumbnail-nav-btn--prev'),
          thumbnailNextButton: this.querySelector('.thumbnail-nav-btn--next')
        };
        
        // Gradients are children of thumbnails element
        if (this.elements.thumbnails) {
          this.elements.leftGradient = this.elements.thumbnails.querySelector('.thumbnail-gradient--left');
          this.elements.rightGradient = this.elements.thumbnails.querySelector('.thumbnail-gradient--right');
          
        }

        // Slick-style dots config/state (uses left: xpx)
        this.dotStrip = {
          maxVisible: parseInt(this.querySelector('[id^="DotsProgress"]').dataset.maxDotsVisible) || 7,     // Read from data attribute, default to 7
          maskEl: null,      // .dots-mask
          stripEl: null,     // .dots-strip (position: relative; left: …)
          dots: [],          // NodeList -> Array of .dot
          step: 0,           // px per dot shift (computed)
          onResize: null
        };

        this.mql = window.matchMedia('(min-width: 750px)');
        this.currentMediaId = null;
        this.thumbnailHighlightFrame = null;
        this.skipNextSlideSync = false;
        
        // Handle resize for gradient visibility
        this.resizeHandler = this.onResize.bind(this);
        window.addEventListener('resize', this.resizeHandler);

        // Build dots strip & wire
        this.initializeDotsSlider();

        // Sync with viewer
        this.elements.viewer?.addEventListener('slideChanged', debounce(this.onSlideChanged.bind(this), 30));

        // Initialize dots state on load (with retry for slow/hydrating DOM/fonts)
        this.initializeDotsWithRetry();

        // Nav buttons
        this.initializeNavigationButtons();
        this.initializeThumbnailNavigationButtons();

        // Thumbnails
        if (this.elements.thumbnails) {
          this.elements.thumbnails.querySelectorAll('[data-target]').forEach((mediaToSwitch) => {
            mediaToSwitch.querySelector('button')
              ?.addEventListener('click', this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
          });
          
          // Update gradients on scroll (wait for slider to be initialized)
          const initGradientTracking = () => {
            if (this.elements.thumbnails?.slider) {
              this.elements.thumbnails.slider.addEventListener('scroll', debounce(this.updateGradientVisibility.bind(this), 50));
              // Small delay to ensure slider dimensions are calculated
              setTimeout(() => {
                this.updateGradientVisibility();
              }, 100);
            } else {
              // Retry if slider not yet initialized
              setTimeout(initGradientTracking, 50);
            }
          };
          initGradientTracking();
        }

        if (this.dataset.desktopLayout?.includes('thumbnail') && this.mql.matches) this.removeListSemantic();
      }

      disconnectedCallback() {
        if (this.dotStrip.onResize) window.removeEventListener('resize', this.dotStrip.onResize);
        if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
      }

      /* ---------------- Slide syncing ---------------- */

      onSlideChanged(event) {
        if (this.skipNextSlideSync) return;
        const el = event.detail?.currentElement;
        const mediaId = el?.dataset?.mediaId;
        if (!mediaId) return;

        if (this.elements.thumbnails) {
          const th = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
          this.debouncedSetActiveThumbnail(th);
        }
        this.debouncedUpdateDotsProgress(mediaId);
      }

      setActiveMedia(mediaId, prepend) {
        if (!this.elements.viewer) return;
        if (!prepend && this.currentMediaId === mediaId) return;
        const active = this.elements.viewer.querySelector(`[data-media-id="${mediaId}"]`);
        if (!active) return;
        this.currentMediaId = mediaId;

        this.elements.viewer.querySelectorAll('[data-media-id]').forEach(el => el.classList.remove('is-active'));
        active.classList.add('is-active');

        if (prepend) {
          active.parentElement.prepend(active);
          if (this.elements.thumbnails) {
            const th = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
            th?.parentElement.prepend(th);
            this.elements.thumbnails.resetPages?.();
          }
          this.elements.viewer.resetPages?.();
          this.reorderDotForMedia(mediaId);
          this.skipNextSlideSync = true;
          requestAnimationFrame(() => { this.skipNextSlideSync = false; });
        }

        this.preventStickyHeader();
        if (this.elements.thumbnails) active.parentElement.scrollTo({ left: active.offsetLeft });
        if (!this.elements.thumbnails) {
          active.scrollIntoView({ behavior: 'smooth' });
        }
        this.playActiveMedia(active);

        if (this.elements.thumbnails) {
          const th = this.elements.thumbnails.querySelector(`[data-target="${mediaId}"]`);
          this.setActiveThumbnail(th);
          this.queueThumbnailHighlight(th);
          if (th) this.announceLiveRegion(active, th.dataset.mediaPosition);
        }

        this.updateDotsProgressFromActiveMedia();
        this.updateGradientVisibility();
      }

      setActiveThumbnail(thumbnail) {
        if (!this.elements.thumbnails || !thumbnail) return;
        this.elements.thumbnails.querySelectorAll('button').forEach(el => el.removeAttribute('aria-current'));
        thumbnail.querySelector('button')?.setAttribute('aria-current', 'true');
        if (this.elements.thumbnails.isSlideVisible?.(thumbnail, 10)) return;
        this.elements.thumbnails.slider?.scrollTo?.({ left: thumbnail.offsetLeft });
      }

      queueThumbnailHighlight(thumbnail) {
        if (!thumbnail) return;
        const button = thumbnail.querySelector('button');
        if (!button) return;
        if (this.thumbnailHighlightFrame) cancelAnimationFrame(this.thumbnailHighlightFrame);
        this.thumbnailHighlightFrame = requestAnimationFrame(() => {
          button.setAttribute('aria-current', 'true');
        });
      }

      debouncedSetActiveThumbnail(thumbnail) {
        clearTimeout(this.thumbnailUpdateTimeout);
        this.thumbnailUpdateTimeout = setTimeout(() => this.setActiveThumbnail(thumbnail), 300);
      }

      announceLiveRegion(activeItem, position) {
        const img = activeItem.querySelector('.product__modal-opener--image img');
        if (!img || !this.elements.liveRegion) return;
        img.onload = () => {
          this.elements.liveRegion.setAttribute('aria-hidden', 'false');
          this.elements.liveRegion.innerHTML = window.accessibilityStrings?.imageAvailable
            ? window.accessibilityStrings.imageAvailable.replace('[index]', position)
            : `Image ${position} available`;
          this.elements.liveRegion.setAttribute('aria-hidden', 'true');
        };
        img.src = img.src;
      }

      playActiveMedia(activeItem) {
        window.pauseAllMedia?.();
        const deferred = activeItem.querySelector('.deferred-media');
        if (deferred) deferred.loadContent(false);
      }

      preventStickyHeader() {
        this.stickyHeader = this.stickyHeader || document.querySelector('sticky-header');
        this.stickyHeader?.dispatchEvent(new Event('preventHeaderReveal'));
      }

      removeListSemantic() {
        if (!this.elements.viewer?.slider) return;
        this.elements.viewer.slider.setAttribute('role', 'presentation');
        this.elements.viewer.sliderItems?.forEach(slide => slide.setAttribute('role', 'presentation'));
      }

      /* ---------------- Dots (Slick-like with left) ---------------- */

      initializeDotsSlider() {
        if (!this.elements.dotsProgress) return;

        const container = this.elements.dotsProgress.querySelector('.dots-container');
        if (!container) return;

        // Use existing elements from Liquid template
        if (!this.dotStrip.maskEl) {
          this.dotStrip.maskEl = container.querySelector('.dots-mask');
          this.dotStrip.stripEl = container.querySelector('.dots-strip');
          this.dotStrip.dots = Array.from(container.querySelectorAll('.dot'));

          if (!this.dotStrip.maskEl || !this.dotStrip.stripEl) return;

          // Set data-index for dots
          this.dotStrip.dots.forEach((d, i) => { d.dataset.index = i; });

          // Click -> jump
          this.dotStrip.dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
              e.preventDefault();
              const id = dot.dataset.mediaId;
              if (id) this.setActiveMedia(id, false);
            });
          });

          // After layout, compute metrics & size mask
          const ready = () => {
            this.computeDotStep();      // sets this.dotStrip.step
            this.centerActiveByIndex(this.getActiveDotIndex()); // set strip left
          };
          // fonts & images can affect inline-block widths; do a few passes
          requestAnimationFrame(ready);
          setTimeout(ready, 0);
          setTimeout(ready, 150);

          // Resize
          this.dotStrip.onResize = this.onResizeDots.bind(this);
          window.addEventListener('resize', this.dotStrip.onResize);
        }
      }

      // Compute px "step" between consecutive dots (robust, layout-accurate)
      computeDotStep() {
        const dots = this.dotStrip.dots;
        const strip = this.dotStrip.stripEl;
        if (!dots.length || !strip) return;

        // Ensure the strip is at left:0 to measure offsets
        const prevLeft = strip.style.getPropertyValue('--strip-left') || '0px';
        strip.style.setProperty('--strip-left', '0px');

        // Prefer offset delta between centers (handles margins/gaps reliably)
        let step = 0;
        if (dots.length > 1) {
          const a = dots[0];
          const b = dots[1];
          const ax = a.offsetLeft + a.offsetWidth / 2;
          const bx = b.offsetLeft + b.offsetWidth / 2;
          step = Math.round(bx - ax);
        } else {
          // Fallback to width
          const d0 = dots[0];
          step = Math.round(d0.offsetWidth);
        }

        // Guard against zeros (e.g., hidden display during hydration)
        if (!step || step < 1) {
          // final fallback: computed width + margin
          const d0 = dots[0];
          const cs = window.getComputedStyle(d0);
          const w  = d0.getBoundingClientRect().width;
          const ml = parseFloat(cs.marginLeft)||0;
          const mr = parseFloat(cs.marginRight)||0;
          step = Math.max(1, Math.round(w + ml + mr));
        }

        this.dotStrip.step = step;
        // restore previous left (in case we measured mid-animation)
        strip.style.setProperty('--strip-left', prevLeft);
      }


      getActiveDotIndex() {
        const dots = this.dotStrip.dots;
        if (!dots.length) return 0;
        const idx = dots.findIndex(d => d.classList.contains('dot--active'));
        return idx >= 0 ? idx : 0;
      }

      // Core: compute the left offset so that active dot is centered in the 7-slot window
      centerActiveByIndex(index) {
        const { stripEl, dots, step, maxVisible } = this.dotStrip;
        if (!stripEl || !dots.length || !step) return;

        const total = dots.length;
        const visible = Math.min(maxVisible, total);
        const half = Math.floor(visible / 2);

        // First visible dot index (clamp to edges)
        let first = index - half;
        first = Math.max(0, Math.min(first, total - visible));

        // The strip moves left by first * step
        const left = -(first * step);
        stripEl.style.setProperty('--strip-left', `${left}px`);
      }

      // Retry init for cases where dots are not yet present/sized
      initializeDotsWithRetry() {
        let tries = 0, max = 12;
        const tick = () => {
          if (this.elements.dotsProgress && this.dotStrip.dots.length) {
            this.updateDotsProgressFromActiveMedia();
            this.centerActiveByIndex(this.getActiveDotIndex());
          } else if (tries < max) {
            tries++; setTimeout(tick, 100);
          }
        };
        tick();
      }

      updateDotsProgressFromActiveMedia() {
        if (!this.elements.dotsProgress || !this.elements.viewer) return;
        const active = this.elements.viewer.querySelector('[data-media-id].is-active');
        if (!active) return;
        this.updateDotsProgressByMediaId(active.dataset.mediaId);
      }

      updateDotsProgressByMediaId(activeMediaId) {
        const dots = this.dotStrip.dots;
        if (!dots.length) return;

        let activeIndex = 0;
        dots.forEach((dot, i) => {
          const isActive = dot.dataset.mediaId === activeMediaId;
          if (isActive) activeIndex = i;
          dot.classList.toggle('dot--active', isActive);
          dot.setAttribute('aria-current', isActive ? 'true' : 'false');
          dot.setAttribute('aria-label', `Slide ${i+1} of ${dots.length}${isActive ? ', current' : ''}`);
        });

        // Move using left: xpx to keep active centered (or clamped)
        this.centerActiveByIndex(activeIndex);
      }

      debouncedUpdateDotsProgress(activeMediaId) {
        clearTimeout(this.dotsUpdateTimeout);
        this.dotsUpdateTimeout = setTimeout(() => this.updateDotsProgressByMediaId(activeMediaId), 300);
      }

      reorderDotForMedia(mediaId) {
        const { stripEl } = this.dotStrip;
        if (!stripEl) return;
        const dot = stripEl.querySelector(`[data-media-id="${mediaId}"]`);
        if (!dot) return;
        stripEl.prepend(dot);
        this.dotStrip.dots = Array.from(stripEl.querySelectorAll('.dot'));
        this.computeDotStep();
      }

      onResizeDots() {
        // Recompute step (dot spacing may change on resize/font swap), then re-center.
        this.computeDotStep();
        this.centerActiveByIndex(this.getActiveDotIndex());
      }

      onResize() {
        this.updateGradientVisibility();
      }

      /* ---------------- Prev/Next & thumbnails ---------------- */

      initializeNavigationButtons() {
        this.elements.prevButton?.addEventListener('click', this.navigateToPrevious.bind(this));
        this.elements.nextButton?.addEventListener('click', this.navigateToNext.bind(this));
      }
      navigateToPrevious() { this.elements.prevButton?.click(); }
      navigateToNext()     { this.elements.nextButton?.click(); }

      initializeThumbnailNavigationButtons() {
        this.elements.thumbnailPrevButton?.addEventListener('click', this.navigateToPrevious.bind(this));
        this.elements.thumbnailNextButton?.addEventListener('click', this.navigateToNext.bind(this));
      }

      /* ---------------- Gradient visibility ---------------- */

      updateGradientVisibility() {
        if (!this.elements.thumbnails?.slider) return;
        
        const slider = this.elements.thumbnails.slider;
        const scrollLeft = slider.scrollLeft;
        const scrollWidth = slider.scrollWidth;
        const clientWidth = slider.clientWidth;
        
        // If slider is not scrollable (all content fits), hide both gradients
        if (scrollWidth <= clientWidth) {
          this.hideGradient(this.elements.leftGradient);
          this.hideGradient(this.elements.rightGradient);
          return;
        }
        
        // Check if there's content to scroll to on the left
        const hasLeftContent = scrollLeft > 1; // Use 1px threshold for rounding issues
        
        // Check if there's content to scroll to on the right
        const hasRightContent = scrollLeft + clientWidth < scrollWidth - 1; // Use 1px threshold for rounding issues
        
        // Update left gradient visibility
        if (this.elements.leftGradient) {
          if (hasLeftContent) {
            this.showGradient(this.elements.leftGradient);
          } else {
            this.hideGradient(this.elements.leftGradient);
          }
        }
        
        // Update right gradient visibility
        if (this.elements.rightGradient) {
          if (hasRightContent) {
            this.showGradient(this.elements.rightGradient);
          } else {
            this.hideGradient(this.elements.rightGradient);
          }
        }
      }

      showGradient(gradient) {
        if (!gradient) return;
        
        // Clear any pending hide timeout
        if (gradient._hideTimeout) {
          clearTimeout(gradient._hideTimeout);
          gradient._hideTimeout = null;
        }
        
        // Check computed style to see if element is hidden
        const computedStyle = window.getComputedStyle(gradient);
        const isHidden = computedStyle.display === 'none' || gradient.style.display === 'none';
        
        // Set display first, then trigger opacity transition
        if (isHidden) {
          gradient.style.display = 'block';
          // Small delay to ensure display is applied before adding class for smooth transition
          setTimeout(() => {
            gradient.classList.add('is-visible');
          }, 10);
        } else {
          // Already visible, just add the class
          gradient.classList.add('is-visible');
        }
      }

      hideGradient(gradient) {
        if (!gradient) return;
        
        // Clear any pending hide timeout
        if (gradient._hideTimeout) {
          clearTimeout(gradient._hideTimeout);
        }
        
        // Remove visible class first to trigger fade-out
        gradient.classList.remove('is-visible');
        
        // Wait for transition to complete before hiding
        gradient._hideTimeout = setTimeout(() => {
          if (!gradient.classList.contains('is-visible')) {
            gradient.style.display = 'none';
          }
          gradient._hideTimeout = null;
        }, 300); // Match CSS transition duration
      }
    });
  }
})();

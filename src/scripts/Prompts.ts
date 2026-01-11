import vh from 'vh-plugin';
import { $GET } from '@/utils/index';
import vhLzImgInit from "@/scripts/vhLazyImg";

// 轮播控制器类
class PromptCarousel {
  private track: HTMLElement;
  private prevBtn: HTMLElement | null;
  private nextBtn: HTMLElement | null;
  private indicators: HTMLElement[];
  private currentIndex: number;
  private totalImages: number;
  private touchStartX: number = 0;
  private touchEndX: number = 0;

  // 保存事件处理函数引用，用于正确的清理
  private boundPrev: () => void;
  private boundNext: () => void;
  private boundTouchStart: (e: TouchEvent) => void;
  private boundTouchEnd: (e: TouchEvent) => void;
  private boundIndicators: Array<() => void> = [];

  constructor(carouselElement: HTMLElement) {
    this.track = carouselElement.querySelector('.carousel-track') as HTMLElement;
    this.prevBtn = carouselElement.querySelector('.carousel-btn-prev');
    this.nextBtn = carouselElement.querySelector('.carousel-btn-next');
    this.indicators = Array.from(carouselElement.querySelectorAll('.carousel-indicator'));
    this.currentIndex = 0;
    this.totalImages = parseInt(this.track.dataset.totalImages || '0', 10);

    // 绑定方法引用
    this.boundPrev = () => this.prev();
    this.boundNext = () => this.next();
    this.boundTouchStart = (e) => this.handleTouchStart(e);
    this.boundTouchEnd = (e) => this.handleTouchEnd(e);

    this.init();
  }

  private init(): void {
    // 绑定按钮点击事件
    this.prevBtn?.addEventListener('click', this.boundPrev);
    this.nextBtn?.addEventListener('click', this.boundNext);

    // 绑定指示器点击事件
    this.indicators.forEach((indicator, index) => {
      const handler = () => this.goTo(index);
      this.boundIndicators.push(handler);
      indicator.addEventListener('click', handler);
    });

    // 绑定触摸事件（移动端滑动）
    this.track.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    this.track.addEventListener('touchend', this.boundTouchEnd, { passive: true });
  }

  private updateCarousel(): void {
    // 更新轨道位置
    this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`;

    // 更新指示器状态
    this.indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentIndex);
    });
  }

  private prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.updateCarousel();
    }
  }

  private next(): void {
    if (this.currentIndex < this.totalImages - 1) {
      this.currentIndex++;
      this.updateCarousel();
    }
  }

  private goTo(index: number): void {
    if (index >= 0 && index < this.totalImages) {
      this.currentIndex = index;
      this.updateCarousel();
    }
  }

  private handleTouchStart(e: TouchEvent): void {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  private handleTouchEnd(e: TouchEvent): void {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }

  public destroy(): void {
    this.prevBtn?.removeEventListener('click', this.boundPrev);
    this.nextBtn?.removeEventListener('click', this.boundNext);

    this.indicators.forEach((indicator, index) => {
      const handler = this.boundIndicators[index];
      if (handler) {
        indicator.removeEventListener('click', handler);
      }
    });

    this.track.removeEventListener('touchstart', this.boundTouchStart);
    this.track.removeEventListener('touchend', this.boundTouchEnd);
  }
}

const PromptsInit = async (data: any) => {
  const promptsDOM = document.querySelector('.main-inner-content>.vh-tools-main>main.prompts-main');
  if (!promptsDOM) return;

  try {
    let res = data;
    if (typeof data === 'string') {
      res = await $GET(data);
    }

    promptsDOM.innerHTML = res.map((item: any, cardIndex: number) => {
      const images = item.images || [];
      const hasMultiple = images.length > 1;

      return `
        <div class="prompt-card" data-card-index="${cardIndex}">
          <div class="prompt-carousel" data-has-multiple="${hasMultiple}">
            <div class="carousel-track" data-current-index="0" data-total-images="${images.length}">
              ${images.map((imgSrc: string, imgIndex: number) => `
                <div class="carousel-slide" data-slide-index="${imgIndex}">
                  <img
                    class="prompt-cover"
                    data-vh-lz-src="${imgSrc}"
                    alt="${item.title}"
                    data-carousel-index="${imgIndex}"
                  />
                </div>
              `).join('')}
            </div>

            ${hasMultiple ? `
              <button class="carousel-btn carousel-btn-prev" data-direction="prev" aria-label="上一张">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <button class="carousel-btn carousel-btn-next" data-direction="next" aria-label="下一张">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <div class="carousel-indicators">
                ${images.map((_: any, index: number) => `
                  <button
                    class="carousel-indicator ${index === 0 ? 'active' : ''}"
                    data-indicator-index="${index}"
                    aria-label="第 ${index + 1} 张"
                  ></button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <section class="prompt-info">
            <span class="prompt-category">${item.category}</span>
            <h3 class="prompt-title">${item.title}</h3>
            <p class="prompt-content vh-ellipsis line-3">${item.content}</p>
          </section>
        </div>
      `;
    }).join('');

    // 图片懒加载
    vhLzImgInit();

    // 初始化轮播
    const carousels = promptsDOM.querySelectorAll('.prompt-carousel[data-has-multiple="true"]');
    const carouselInstances: PromptCarousel[] = [];

    carousels.forEach((carousel) => {
      carouselInstances.push(new PromptCarousel(carousel as HTMLElement));
    });

    // 返回清理函数
    return () => {
      carouselInstances.forEach(instance => instance.destroy());
    };
  } catch {
    vh.Toast('获取 Prompt 数据失败');
  }
};

// Prompts 初始化
import PROMPTS_DATA from "@/page_data/Prompts";
const { api, data } = PROMPTS_DATA;
export default () => PromptsInit(api || data);

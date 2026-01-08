import vh from 'vh-plugin';
import { $GET } from '@/utils/index';
import vhLzImgInit from "@/scripts/vhLazyImg";

const PromptsInit = async (data: any) => {
  const promptsDOM = document.querySelector('.main-inner-content>.vh-tools-main>main.prompts-main');
  if (!promptsDOM) return;

  try {
    let res = data;
    if (typeof data === 'string') {
      res = await $GET(data);
    }

    promptsDOM.innerHTML = res.map((item: any) => `
      <div class="prompt-card">
        ${item.image ? `<img class="prompt-cover" data-vh-lz-src="${item.image}" alt="${item.title}" />` : ''}
        <section class="prompt-info">
          <span class="prompt-category">${item.category}</span>
          <h3 class="prompt-title">${item.title}</h3>
          <p class="prompt-content vh-ellipsis line-3">${item.content}</p>
          <a href="${item.sourceLink}" target="_blank" rel="noopener nofollow" class="prompt-link">查看来源</a>
        </section>
      </div>
    `).join('');

    // 图片懒加载
    vhLzImgInit();
  } catch {
    vh.Toast('获取 Prompt 数据失败');
  }
};

// Prompts 初始化
import PROMPTS_DATA from "@/page_data/Prompts";
const { api, data } = PROMPTS_DATA;
export default () => PromptsInit(api || data);

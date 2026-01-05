---
title: "Clash Verge 配置链式代理"
categories: 网络
tags: ["网络", "创业", "跨境"]
id: "clash-verge-chain-proxy"
date: 2026-01-05 18:18:18
cover: "/assets/images/2026-plan/walk-to-2026.webp"
recommend: true
top: false
---

:::note{type="success"}
回顾 2025，白天上班晚上副业，尝试过跨境电商与独立开发，虽有遗憾但技能树点满。2026 年，拒绝浅尝辄止，信奉“先完成再完美”。在 AI 风口下，坚定网站出海与个人 IP 打造，计划上线 4 个产品并持续输出。从跌跌撞撞到坚定前行，年终复盘与新年规划。
:::

## 购买静态 IP

::btn[Cliproxy 购买地址]{link="https://share.cliproxy.com/share/4qnp7bc5e" type="success"}

本文使用的是 Cliproxy 购买的长效静态 ISP IP，你也可以使用其他家的，后面的操作步骤都一样。购买完成后需要把 IP、用户名、密码记录下来：

![alt text](/assets/images/article-clash-verge-chain-proxy/image.png)

## 配置 Clash Verge

双击“全局扩展脚本”，

![alt text](/assets/images/article-clash-verge-chain-proxy/image1.png)

把下面的内容粘贴进去，把相关信息替换成你购买的 IP 信息：

```javascript
// Define main function (script entry)
// https://mihomo.party/docs/guide/override/javascript
function main(config) {
  // 创建一个名为 "all" 的代理组，它包含了配置文件里的每一个代理节点
  const name = "all";
  const allProxies = config.proxies.map((x) => x.name);
  config["proxy-groups"].push({
    name: name,
    type: "select",
    proxies: allProxies,
  });

  // 定义一个名为 "cliproxy" 的新代理节点，它会通过 "all" 代理组来中转连接
  // server、port、username、password 替换成你购买的 IP 信息
  config.proxies.push({
    name: "cliproxy",
    server: "xxxx.xxxx.xxxx.xxxx",
    port: xxx,
    username: "xxxx",
    password: "xxxx",
    type: "socks5",
    "dialer-proxy": name,
    udp: true,
  });

  // 为 "cliproxy" 这个节点创建一个专属的代理组，这个组叫 “静态IP”
  config["proxy-groups"].push({
    name: "静态IP",
    type: "select",
    proxies: ["cliproxy"],
  });

  // 自动将 "静态 IP" 这个选项添加到现有的其他代理组中，方便在 Clash 界面中切换使用它
  config["proxy-groups"].forEach((g) => {
    if (g.name.endsWith("节点选择")) {
      g.proxies.push("静态IP");
    }
  });
  return config;
}
```

如下图所示，然后点击保存就配置完成了：

![alt text](/assets/images/article-clash-verge-chain-proxy/image2.png)

## 使用方式

此时切到“代理”界面，可以看到多了 “all” 和 “静态 IP” 这两个组：

![alt text](/assets/images/article-clash-verge-chain-proxy/image3.png)

使用我们刚刚配置的静态 IP 进行中转：
![alt text](/assets/images/article-clash-verge-chain-proxy/image6.png)

采用 https://ippure.com/ 检测下是否配置成功（也可采用 https://ping0.cc/）：

![alt text](/assets/images/article-clash-verge-chain-proxy/image7.png)

如果不想此时不想使用我们刚刚配置的静态 IP 进行中转，采用直接使用使用机场的方式：

![alt text](/assets/images/article-clash-verge-chain-proxy/image4.png)

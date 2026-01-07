---
title: "Clash Verge 配置链式代理（超级简单）"
categories: 网络
tags: ["网络", "创业", "跨境"]
id: "clash-verge-chain-proxy"
date: 2026-01-05 18:18:18
cover: "/assets/images/article-clash-verge-chain-proxy/clash-verge-chain-proxy.webp"
recommend: true
top: false
---

:::note{type="success"}
简单几个步骤即可实现 Clash Verge 的链式代理配置。通过 JavaScript 脚本创建多层代理转发，实现更灵活的网络代理方案。适用于需要固定 IP 地址进行跨境电商、独立开发等场景。
:::

## 一、购买静态 IP

::btn[Cliproxy 购买地址]{link="https://share.cliproxy.com/share/4qnp7bc5e" type="import"}

本文使用 Cliproxy 购买的长效静态 ISP IP 进行演示。你也可以选择其他服务商，后续配置步骤基本一致。

完成购买后，请妥善记录以下连接信息：

- 服务器 IP 地址
- 端口号
- 用户名
- 密码

![Cliproxy 购买信息](/assets/images/article-clash-verge-chain-proxy/cliproxy-purchase-info.png)

## 二、理解链式代理原理

在开始配置前，先理解链式代理的工作原理，这将帮助你更好地掌握后续配置步骤。

链式代理通过 Clash 的 `dialer-proxy` 字段实现多层代理转发，流量路径如下：

```
本地计算机 → 机场节点 → 静态 IP → 目标网站
```

**核心逻辑**：

1. **保留所有机场节点**：将订阅中的所有机场节点统一放入「机场中转池」
2. **新增静态 IP 节点**：将购买的静态 IP 配置为独立节点，并设置其上游代理为「机场中转池」
3. **创建最终出口选择器**：提供两个选项供灵活切换
   - 选择「机场中转池」：流量直接通过机场节点出境（速度更快）
   - 选择「静态 IP」：流量通过机场节点中转到静态 IP 再访问目标网站（IP 固定）

通过这种设计，你可以根据实际需求在「速度优先」和「IP 固定」之间灵活切换，非常适合跨境电商账号管理、自媒体运营等特殊使用场景。

## 三、配置 Clash Verge

### 1. 编辑全局扩展脚本

在 Clash Verge 「订阅」界面中，双击「全局扩展脚本」选项：

![双击全局扩展脚本](/assets/images/article-clash-verge-chain-proxy/clash-verge-script-extension.png)

### 2. 添加链式代理脚本

将以下脚本代码粘贴到编辑器中，并根据你购买的静态 IP 信息修改**核心配置区域**的四个字段。

**需要修改的字段**：

| 字段       | 说明               | 示例           |
| ---------- | ------------------ | -------------- |
| `server`   | 静态 IP 服务器地址 | `123.45.67.89` |
| `port`     | 端口号             | `443`          |
| `username` | 用户名             | `user123`      |
| `password` | 密码               | `pass123`      |

```javascript
function main(config) {
  // ================= 1. 核心配置区域 =================
  const staticProxyConfig = {
    name: "🔒 静态IP (出口)",
    server: "xxx.xxx.xxx.xxx",
    port: xxx,
    username: "xxxxx",
    password: "xxxxx",
    type: "socks5",
    udp: true,
    "skip-cert-verify": true, // 优化：跳过证书验证，提高链式代理连通性
  };

  const groupAirportName = "✈️ 机场中转池";
  const groupFinalName = "🚀 最终出口选择";

  // ================= 2. 规则优化 (使用 GEOSITE 替代冗长列表) =================
  // 优化点 1: 移除硬编码的几百个域名，使用 Meta 内核的 GEOSITE 数据库
  const optimizedDirectRules = [
    // --- 强制直连与局域网 ---
    "GEOSITE,private,DIRECT",
    "GEOSITE,category-ads-all,REJECT", // 顺便拦截一下广告

    // --- IP 段 (核心网络) ---
    "IP-CIDR,127.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,172.16.0.0/12,DIRECT,no-resolve",
    "IP-CIDR,192.168.0.0/16,DIRECT,no-resolve",
    "IP-CIDR,10.0.0.0/8,DIRECT,no-resolve",
    "IP-CIDR,100.64.0.0/10,DIRECT,no-resolve",
    "IP-CIDR,224.0.0.0/4,DIRECT,no-resolve",

    // --- 进程匹配 ---
    "PROCESS-NAME,Thunder,DIRECT",
    "PROCESS-NAME,Transmission,DIRECT",
    "PROCESS-NAME,uTorrent,DIRECT",
    "PROCESS-NAME,qBittorrent,DIRECT",
    "PROCESS-NAME,aria2c,DIRECT",

    // --- 核心优化：国内域名统配 ---
    // 包含 baidu, qq, alibaba, apple.cn, microsoft.cn 等所有国内常见域名
    "GEOSITE,cn,DIRECT",

    // --- 游戏平台国内CDN ---
    "GEOSITE,steam@cn,DIRECT",
    "GEOSITE,category-games@cn,DIRECT",

    // --- 兜底国内 IP ---
    "GEOIP,CN,DIRECT",
  ];

  // ================= 3. 提取与构建节点 (优化节点清洗) =================

  // 优化点 3: 过滤节点，排除特殊节点和静态IP自身，防止循环引用
  // 只提取出网协议节点 (SS/VMess/Trojan/HTTP/Socks5等)，排除 DIRECT/REJECT 等
  const validNodeTypes = [
    "ss",
    "vmess",
    "vless",
    "trojan",
    "hysteria",
    "hysteria2",
    "tuic",
    "ssr",
    "snell",
    "socks5",
    "http",
  ];

  // 确保 config.proxies 存在
  if (!config.proxies) config.proxies = [];

  const airportProxies = config.proxies
    .filter(
      (p) =>
        validNodeTypes.includes(p.type) && p.name !== staticProxyConfig.name
    )
    .map((p) => p.name);

  // 防错：如果没找到任何节点，给一个 DIRECT 防止报错
  if (airportProxies.length === 0) airportProxies.push("DIRECT");

  // 添加静态 IP (设置 dialer-proxy 指向机场池)
  staticProxyConfig["dialer-proxy"] = groupAirportName;
  // 使用 unshift 将静态节点加到列表最前，方便调试
  config.proxies.unshift(staticProxyConfig);

  // ================= 4. 分组策略优化 (自动容灾) =================

  config["proxy-groups"] = [
    {
      name: groupFinalName,
      type: "select",
      proxies: [
        staticProxyConfig.name, // 默认：走静态IP链式代理
        groupAirportName, // 备用：不走静态IP，直接走机场
      ],
    },
    {
      // 优化点 2: 将 Select 改为 url-test，实现自动容灾
      // 静态 IP 依赖这个池子出网，必须保证这个池子里的节点永远是通的
      name: groupAirportName,
      type: "url-test",
      url: "http://www.gstatic.com/generate_204",
      interval: 300,
      tolerance: 50,
      lazy: true,
      proxies: airportProxies,
    },
  ];

  // ================= 5. 规则逻辑优化 (高效清洗) =================

  // 优化点 4: 更高效的规则合并与清洗逻辑
  const finalRules = [...optimizedDirectRules];

  if (config.rules && config.rules.length > 0) {
    config.rules.forEach((rule) => {
      // 快速分割
      const parts = rule.split(",");
      if (parts.length < 2) return;

      const ruleType = parts[0].trim().toUpperCase();
      // 获取策略部分（处理 no-resolve 的情况）
      const isNoResolve =
        parts[parts.length - 1].trim().toLowerCase() === "no-resolve";
      const policyIndex = isNoResolve ? parts.length - 2 : parts.length - 1;
      const originalPolicy = parts[policyIndex].trim();

      // 逻辑：保留 DIRECT 和 REJECT，其他的全部重定向到 groupFinalName
      if (
        originalPolicy === "DIRECT" ||
        originalPolicy === "REJECT" ||
        originalPolicy.startsWith("REJECT")
      ) {
        finalRules.push(rule);
      } else if (ruleType !== "MATCH") {
        // 修改目标策略
        parts[policyIndex] = groupFinalName;
        finalRules.push(parts.join(","));
      }
    });
  }

  // 确保最后一条是 MATCH 且指向最终分组
  finalRules.push(`MATCH,${groupFinalName}`);

  // 应用新规则
  config.rules = finalRules;

  return config;
}
```

### 3. 保存配置

点击保存按钮完成配置：

![脚本配置保存完成](/assets/images/article-clash-verge-chain-proxy/script-config-saved.png)

## 四、验证配置效果

### 1. 查看新的代理分组

切换到「代理」标签页，你应该能看到两个新的代理组：

- **✈️ 机场中转池**：包含你订阅中的所有机场节点
- **🚀 最终出口选择**：包含「✈️ 机场中转池」和「🔒 静态 IP (出口)」两个选项

![代理组创建完成](/assets/images/article-clash-verge-chain-proxy/proxy-groups-created.png)

### 2. 使用静态 IP 出口

在「🚀 最终出口选择」中选择「🔒 静态 IP (出口)」，流量将按照以下路径转发：

```
本地计算机 → 机场节点 → 静态 IP 节点 → 目标网站
```

![使用静态 IP 进行中转](/assets/images/article-clash-verge-chain-proxy/use-static-ip-proxy.png)

### 3. 验证 IP 地址

访问 [IPPure](https://ippure.com/) 或 [Ping0](https://ping0.cc/) 检测当前 IP 地址。

如果显示的是你购买的静态 IP 地址，说明配置成功！

![IP 检测结果显示静态 IP](/assets/images/article-clash-verge-chain-proxy/ip-detection-result.png)

你也可以在 Clash Verge 的运行日志中查看详细信息，确认配置正常工作：

![Clash Verge 运行日志](/assets/images/article-clash-verge-chain-proxy/clash-verge-run-log.png)

### 4. 切换回机场直连模式

如需直接使用机场节点（不经过静态 IP），在「🚀 最终出口选择」中选择「✈️ 机场中转池」，然后在「✈️ 机场中转池」中选择具体的节点即可：

![直接使用机场节点](/assets/images/article-clash-verge-chain-proxy/use-airport-direct.png)

## 五、使用场景建议

通过这种配置，你可以根据不同场景灵活切换：

- **跨境电商账号管理**：使用「🔒 静态 IP (出口)」，保持固定 IP 地址，避免触发平台风控
- **一般浏览访问**：使用「✈️ 机场中转池」，获得更快的访问速度（例如刷 Youtube 视频）

通过「🚀 最终出口选择」分组，你可以随时在两种模式间快速切换，无需修改配置。

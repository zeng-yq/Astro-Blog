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

完成购买后，请妥善记录以下信息：

- 服务器 IP
- 端口号
- 用户名
- 密码

![Cliproxy 购买信息](/assets/images/article-clash-verge-chain-proxy/cliproxy-purchase-info.png)

## 二、配置 Clash Verge

### 1. 打开脚本编辑器

在 Clash Verge 「订阅」界面中，双击「全局扩展脚本」选项：

![双击全局扩展脚本](/assets/images/article-clash-verge-chain-proxy/clash-verge-script-extension.png)

### 2. 添加链式代理脚本

将以下脚本代码粘贴到编辑器中，并根据你购买的静态 IP 信息替换相应字段。

**需要替换的字段说明：**

- `server`：静态 IP 服务器地址
- `port`：端口号
- `username`：用户名
- `password`：密码

```javascript
function main(config) {
  // ================= 核心配置区域（需要修改） =================
  const staticProxyConfig = {
    name: "🔒 静态IP (出口)",
    server: "xxxx.xxxx.xxxx.xxxx",
    port: xxx,
    username: "xxxxxx",
    password: "xxxxxx",
    type: "socks5",
    udp: true,
  };

  // =========================================================

  const groupAirportName = "✈️ 机场中转池";
  const groupFinalName = "🚀 最终出口选择";

  // 1. 提取机场节点
  const allProxies = config.proxies.map((p) => p.name);

  // 2. 添加静态IP (链式指向机场池)
  staticProxyConfig["dialer-proxy"] = groupAirportName;
  config.proxies.push(staticProxyConfig);

  // 3. 重置分组 (只保留两个核心分组)
  config["proxy-groups"] = [
    {
      name: groupAirportName,
      type: "select",
      proxies: allProxies,
    },
    {
      name: groupFinalName,
      type: "select",
      proxies: [
        groupAirportName, // 选项1: 直连
        staticProxyConfig.name, // 选项2: 走静态IP
      ],
    },
  ];

  // 4. 清洗已有规则
  // 必须处理带有 no-resolve 的情况，同时修改分组指向
  if (config.rules && config.rules.length > 0) {
    const newRules = config.rules.map((rule) => {
      const parts = rule.split(",");

      // 确定哪一部分是策略组名称
      // 如果最后一部分是 'no-resolve'，则策略组名称在倒数第二个
      let policyIndex = parts.length - 1;
      if (parts[parts.length - 1].trim() === "no-resolve") {
        policyIndex = parts.length - 2;
      }

      // 获取当前的指向 (例如 "Copilot", "DIRECT", "Proxy")
      const currentPolicy = parts[policyIndex];

      // 如果指向不是 DIRECT 或 REJECT，就强制改成我们的最终分组
      // 这样 Copilot 就会被改成 groupFinalName，但 no-resolve 会被保留
      if (
        !currentPolicy.startsWith("DIRECT") &&
        !currentPolicy.startsWith("REJECT")
      ) {
        parts[policyIndex] = groupFinalName;
      }

      return parts.join(",");
    });

    // 确保有兜底规则
    if (
      newRules.length === 0 ||
      !newRules[newRules.length - 1].startsWith("MATCH")
    ) {
      newRules.push(`MATCH,${groupFinalName}`);
    }

    config.rules = newRules;
  } else {
    // 如果没有规则，加一条兜底
    config.rules = [`MATCH,${groupFinalName}`];
  }

  return config;
}
```

### 3. 保存配置

点击保存按钮完成配置：

![脚本配置保存完成](/assets/images/article-clash-verge-chain-proxy/script-config-saved.png)

### 4、原理说明

这个配置的核心在于使用了 Clash 的 `dialer-proxy` 字段，实现了**链式代理**：

1. **新增静态 IP 节点**：把购买的静态 IP 节点添加到配置中
2. **清除原有分组规则**：把原有的各个分组清除，把其中的所有节点都统一到 "✈️ 机场中转池" 分组中
3. **添加最终出口分组**：新增 "🚀 最终出口选择" 分组，通过该分组轻松切换直连和中转模式

## 三、效果演示

### 1. 查看新的分组情况

切换到「代理」标签页，可以看到现在只有 `✈️ 机场中转池` 和 `🚀 最终出口选择` 两个代理组：

![代理组创建完成](/assets/images/article-clash-verge-chain-proxy/proxy-groups-created.png)

### 2. 使用静态 IP 出口

在 「🚀 最终出口选择」中选择「🔒 静态 IP (出口)」时，流量将按照以下路径转发：

```
本地 → 机场节点 → 静态 IP → 目标网站
```

![使用静态 IP 进行中转](/assets/images/article-clash-verge-chain-proxy/use-static-ip-proxy.png)

### 3. 验证配置结果

在 Clash Verge 运行日志中查看运行日志，确认配置成功：

![Clash Verge 运行日志](/assets/images/article-clash-verge-chain-proxy/clash-verge-run-log.png)

访问 [IPPure](https://ippure.com/) 或 [Ping0](https://ping0.cc/) 检测当前 IP 地址：

![IP 检测结果显示静态 IP](/assets/images/article-clash-verge-chain-proxy/ip-detection-result.png)

如果显示的是你购买的静态 IP 地址，说明配置成功！

### 4. 使用机场节点直连模式

如需直接使用机场节点（不经过静态 IP），直接“✈️ 机场中转池”即可：

![直接使用机场节点](/assets/images/article-clash-verge-chain-proxy/use-airport-direct.png)

通过这种方式，你可以灵活地在「机场直连模式」和「机场 + 静态 IP 模式」之间切换，适用于跨境电商账号管理、独立开发测试等需要固定 IP 的场景。

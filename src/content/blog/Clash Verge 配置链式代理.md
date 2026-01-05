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

将以下脚本代码粘贴到编辑器中，并根据你购买的静态 IP 信息替换相应字段：

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

  // 为 "cliproxy" 这个节点创建一个专属的代理组，这个组叫 "静态IP"
  config["proxy-groups"].push({
    name: "静态IP",
    type: "select",
    proxies: ["cliproxy"],
  });

  // 自动将 "静态IP" 这个选项添加到现有的其他代理组中，方便在 Clash 界面中切换使用它
  config["proxy-groups"].forEach((g) => {
    if (g.name.endsWith("节点选择")) {
      g.proxies.push("静态IP");
    }
  });
  return config;
}
```

**需要替换的字段说明：**

- `server`：静态 IP 服务器地址
- `port`：端口号
- `username`：用户名
- `password`：密码

### 3. 保存配置

点击保存按钮完成配置：

![脚本配置保存完成](/assets/images/article-clash-verge-chain-proxy/script-config-saved.png)

## 三、效果演示

### 1. 查看新增的代理组

切换到「代理」标签页，可以看到新增了 `all` 和 `静态IP` 两个代理组：

![代理组创建完成](/assets/images/article-clash-verge-chain-proxy/proxy-groups-created.png)

### 2. 使用链式代理

选择「静态 IP」作为代理方式，流量将按照以下路径转发：

```
本地 → 机场节点 → 静态 IP → 目标网站
```

![使用静态 IP 进行中转](/assets/images/article-clash-verge-chain-proxy/use-static-ip-proxy.png)

### 3. 验证配置结果

访问 [IPPure](https://ippure.com/) 或 [Ping0](https://ping0.cc/) 检测当前 IP 地址：

![IP 检测结果显示静态 IP](/assets/images/article-clash-verge-chain-proxy/ip-detection-result.png)

如果显示的是你购买的静态 IP 地址，说明配置成功！

### 4. 切换回普通机场节点

如需直接使用机场节点（不经过静态 IP），直接选择其他节点即可：

![直接使用机场节点](/assets/images/article-clash-verge-chain-proxy/use-airport-direct.png)

## 四、原理说明

这个配置的核心在于使用了 Clash 的 `dialer-proxy` 字段，实现了**链式代理**：

1. **all 代理组**：包含所有机场节点
2. **cliproxy 节点**：静态 IP 代理，通过 `dialer-proxy: all` 指定使用机场节点作为出口
3. **静态 IP 代理组**：单独管理 cliproxy 节点，方便切换使用

通过这种方式，你可以灵活地在「普通机场模式」和「机场 + 静态 IP 链式模式」之间切换，适用于跨境电商账号管理、独立开发测试等需要固定 IP 的场景。

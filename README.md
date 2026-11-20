# dsh-approval-notify

> 让 DeepSeek Harness 在需要你审批时，主动弹一条系统通知——带 App 图标，点一下回到 Harness。

DSH 的审批请求会挂在那里等你点「允许」，窗口在后台时很容易晾着。这个插件在 `approval/request` 事件上挂一个监听，用 Electron 原生通知提醒你，然后**原样把决策交还给 DSH 的审批 UI**——它自己不批准、不拒绝、不改变任何策略。

## 特性

- **原生通知**：走 Electron 的 `Notification`，横幅上就是 DeepSeek Harness 的图标，不是「脚本编辑器」
- **零侵入**：只监听、只提醒，调用 `next()` 把决定权交回原有审批流程；插件出错也不会影响审批（全部 `try/catch` 包住）
- **不打扰**：窗口在前台时默认不弹（可配置）
- **通知去重**：同一个审批批次用固定 `tag`，不会在通知中心堆一列
- **点按回到应用**：点击通知会把 Harness 窗口提到前面

## 安装

在 DSH 里用插件管理器装这个目录：

```text
插件 → 添加插件 → 选择本地目录 → 本仓库根目录
```

或先把仓库拉到本地：

```bash
git clone https://github.com/Cjinglu123/dsh-approval-notify.git
```

或让 agent 执行（需要 `plugin_manager` 工具）：

```text
install_bundle  target: file:/绝对路径/dsh-approval-notify
```

安装后重启 DeepSeek Harness。

## 配置

在 `cordis.patch.yml` 里改，或在插件页编辑：

```yaml
- insert:
    - id: approval-notify
      name: 'dsh-approval-notify'
      config:
        title: DeepSeek Harness   # 通知标题
        whenFocused: skip         # skip = 前台不弹；notify = 永远弹
        silent: false             # true = 静音
```

| 字段 | 默认 | 说明 |
|---|---|---|
| `title` | `DeepSeek Harness` | 通知标题 |
| `whenFocused` | `skip` | 窗口在前台时是否跳过通知 |
| `silent` | `false` | 是否静音 |

## 它怎么工作

```
approval/request (waterfall)
        │
        ├─ 我的监听：读 toolName / displayReason → new Notification(...)
        │             return next()   ← 不回答，只提醒
        │
        └─ DSH 原有审批 UI：照常弹卡片、等你点允许
```

客户端半边（`client.js`）通过 `ctx.remote.$on('approval/request')` 订阅，`ctx.effect` 负责卸载时注销监听。Host 半边是空实现，只为让 Loader 那一行能解析。

## 已知限制

- 只在 **DeepSeek Harness 桌面端**有意义：浏览器标签页里的 Harness 拿不到 App 图标
- 需要系统通知权限：`系统设置 → 通知 → DeepSeek Harness` 打开
- macOS 的横幅样式由系统「通知」设置决定（横幅/提醒/无），插件不控制
- 点击通知只做 `window.focus()`；能否跳到具体会话取决于宿主是否暴露会话路由，目前未使用

## 许可

MIT

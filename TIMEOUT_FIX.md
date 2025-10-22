# 轮询超时问题修复

## 🔴 问题描述

你看到的错误消息：
```
⚠️ 轮询超时
```

### 为什么会超时？

当前代码设置了 **30秒超时**：

```javascript
pollTimeoutId = setTimeout(() => {
  clearInterval(pollInterval);
  console.warn('⚠️ 轮询超时');
}, API_CONFIG.polling.timeout || 30000);  // 30秒 = 30,000毫秒
```

### 时间线分析：

```
0秒   - 开始录音，开始轮询
       - 设置30秒超时计时器
2秒   - 轮询 #1（没有数据）
4秒   - 轮询 #2（没有数据）
6秒   - 轮询 #3（没有数据）
...
28秒  - 轮询 #14（没有数据）
30秒  - ⚠️ 超时！停止轮询
```

**但是**：录音需要 5 分钟（300秒）才会生成第一个 segment！

所以 30 秒超时太短了，录音还在正常进行，但轮询被意外停止了。

---

## ✅ 解决方案

### 方案 1: 延长超时时间（推荐 ⭐）

**思路**：将超时时间设置为 `intervalMin + 2 分钟`

**文件**：`ui.html.FIX_timeout.js`

**修改**：

```javascript
// ✅ 计算超时时间
const intervalMin = formData.intervalMin || 5;
const timeoutDuration = (intervalMin + 2) * 60 * 1000;

console.log(`⏰ 超时设置: ${intervalMin + 2} 分钟`);

// 设置超时
pollTimeoutId = setTimeout(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
    console.warn('⚠️ 轮询超时');
  }
}, timeoutDuration);  // ← 使用计算的超时时间
```

**效果**：

| intervalMin | 超时时间 | 说明 |
|-------------|----------|------|
| 3 分钟 | 5 分钟 | 有 2 分钟缓冲 |
| 5 分钟 | 7 分钟 | 有 2 分钟缓冲 |
| 10 分钟 | 12 分钟 | 有 2 分钟缓冲 |

**优点**：
- ✅ 自动适配用户的 intervalMin 设置
- ✅ 有足够的缓冲时间
- ✅ 仍然保留超时保护（防止网络问题导致无限轮询）

**缺点**：
- ⚠️ 需要正确获取 `formData.intervalMin`

---

### 方案 2: 完全移除超时（最简单）

**思路**：不设置超时，让轮询持续进行

**文件**：`ui.html.FIX_no_timeout.js`

**修改**：

```javascript
// ❌ 删除这些代码：
// let pollTimeoutId = null;
// pollTimeoutId = setTimeout(() => { ... }, 30000);
// clearTimeout(pollTimeoutId);

// ✅ 轮询将持续进行，直到：
// 1. 收到 is_final: true
// 2. 用户手动停止录音
// 3. 网络错误达到最大重试次数
```

**优点**：
- ✅ 最简单，不会意外超时
- ✅ 适合任何长度的录音
- ✅ 用户完全控制停止时机

**缺点**：
- ⚠️ 如果忘记停止，会一直轮询（但这需要用户主动停止录音，所以不是大问题）

---

## 📊 对比

| 方案 | 复杂度 | 安全性 | 灵活性 | 推荐度 |
|------|--------|--------|--------|--------|
| **方案 1: 延长超时** | 中 | 高 | 高 | ⭐⭐⭐⭐⭐ |
| **方案 2: 移除超时** | 低 | 中 | 高 | ⭐⭐⭐⭐ |

---

## 🔧 如何应用修复

### 使用方案 1（推荐）

1. 打开 `ui.html`
2. 找到 `function startPolling(sessionId)` (第 3237 行)
3. 参考 `ui.html.FIX_timeout.js` 修改：

**修改点 1**: 计算超时时间

```javascript
// 在函数开始处添加
const intervalMin = formData.intervalMin || 5;
const timeoutDuration = (intervalMin + 2) * 60 * 1000;
console.log(`⏰ 超时设置: ${intervalMin + 2} 分钟`);
```

**修改点 2**: 使用计算的超时时间

```javascript
// 原代码：
pollTimeoutId = setTimeout(() => { ... }, API_CONFIG.polling.timeout || 30000);

// 改为：
pollTimeoutId = setTimeout(() => { ... }, timeoutDuration);
```

**修改点 3**: 重置超时时也使用计算的时间

```javascript
// 在收到 segment 数据后：
if (pollTimeoutId) {
  clearTimeout(pollTimeoutId);
  pollTimeoutId = setTimeout(() => { ... }, timeoutDuration);  // ← 改这里
}
```

4. 保存文件
5. 刷新 Figma 插件

---

### 使用方案 2（最简单）

1. 打开 `ui.html`
2. 找到 `function startPolling(sessionId)`
3. 参考 `ui.html.FIX_no_timeout.js`，删除所有超时相关代码：

**删除**：
```javascript
let pollTimeoutId = null;
pollTimeoutId = setTimeout(() => { ... }, 30000);
clearTimeout(pollTimeoutId);
// ... 所有相关的超时代码
```

4. 保存文件
5. 刷新 Figma 插件

---

## 🧪 验证修复

### 使用方案 1 后，应该看到：

```
🔄 开始轮询，Session ID: 1234567890
⏰ 超时设置: 7 分钟 (420000ms)
📡 轮询 #1 - Session: 1234567890
📡 轮询 #2 - Session: 1234567890
...
📡 轮询 #150 - Session: 1234567890
📊 新的 segment: 1  ← 5分钟后出现
```

**不会再看到** `⚠️ 轮询超时`，除非真的超过 7 分钟没有任何数据。

---

### 使用方案 2 后，应该看到：

```
🔄 开始轮询，Session ID: 1234567890
📡 轮询 #1 - Session: 1234567890
📡 轮询 #2 - Session: 1234567890
...
📡 轮询 #150 - Session: 1234567890
📊 新的 segment: 1  ← 5分钟后出现
```

**永远不会看到** `⚠️ 轮询超时`，轮询会持续到收到 `is_final` 或用户停止。

---

## 🎯 推荐使用方案 1

**理由**：
1. ✅ 保留超时保护机制（防止真正的网络问题）
2. ✅ 自动适配用户设置的 intervalMin
3. ✅ 有 2 分钟的安全缓冲
4. ✅ 更健壮的错误处理

**方案 2 的使用场景**：
- 如果你确定网络稳定
- 如果你的录音时间不确定（可能很长）
- 如果你想要最简单的实现

---

## 📝 完整修改示例（方案 1）

### 修改前：

```javascript
function startPolling(sessionId) {
  let pollTimeoutId = null;

  pollTimeoutId = setTimeout(() => {
    clearInterval(pollInterval);
    console.warn('⚠️ 轮询超时');
  }, API_CONFIG.polling.timeout || 30000);  // 30秒

  // ... 轮询逻辑
}
```

### 修改后：

```javascript
function startPolling(sessionId) {
  let pollTimeoutId = null;

  // ✅ 新增：计算超时时间
  const intervalMin = formData.intervalMin || 5;
  const timeoutDuration = (intervalMin + 2) * 60 * 1000;
  console.log(`⏰ 超时设置: ${intervalMin + 2} 分钟 (${timeoutDuration}ms)`);

  // ✅ 修改：使用计算的超时时间
  pollTimeoutId = setTimeout(() => {
    clearInterval(pollInterval);
    console.warn('⚠️ 轮询超时');
  }, timeoutDuration);  // intervalMin + 2 分钟

  // ... 轮询逻辑
}
```

---

## ⚠️ 注意事项

1. **确保 formData.intervalMin 可用**：
   - 方案 1 需要访问 `formData.intervalMin`
   - 如果 `formData` 不在 `startPolling` 的作用域内，需要传递进来

2. **Console 消息**：
   - 方案 1 会显示：`⏰ 超时设置: 7 分钟`
   - 这有助于调试

3. **测试**：
   - 修改后，启动录音
   - 等待至少 5 分钟（或你的 intervalMin）
   - 确保不再看到 `⚠️ 轮询超时`
   - 确保看到 `📊 新的 segment: 1`

---

## 🚀 总结

**问题**：30秒超时太短，录音需要 5 分钟才有数据

**解决**：
- **方案 1 (推荐)**：延长超时到 `intervalMin + 2 分钟`
- **方案 2 (简单)**：完全移除超时

**修改文件**：只需修改 `ui.html` 的 `startPolling()` 函数

**验证**：不再看到 `⚠️ 轮询超时`，正常收到 segment 数据

选择你喜欢的方案并应用即可！🎉

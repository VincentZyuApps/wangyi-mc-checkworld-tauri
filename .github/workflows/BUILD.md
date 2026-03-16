# 🔧 构建说明 (Build Guide)

本项目使用 GitHub Actions 自动构建，通过 commit message 中的关键词触发不同的构建流程。

## 📌 触发关键词

| 关键词 | 作用 | 说明 |
|--------|------|------|
| `build action` | 触发构建 | 编译项目并上传 Artifact（可在 Actions 页面下载） |
| `build release` | 触发发布 | 编译项目并自动创建 GitHub Release |
| `--clear` | 清除缓存 | 跳过所有缓存，从头开始完整编译 |

## 🎯 使用示例

### 1️⃣ 仅构建（不发布）

适用于：测试编译是否成功、获取测试版本

```bash
git commit -m "fix: 修复某个bug - build action"
git commit -m "feat: 新增功能 - build action"
git commit -m "test: 测试构建 - build action"
```

构建完成后，可在 GitHub Actions → 对应 workflow → Artifacts 下载 zip 包。

---

### 2️⃣ 构建并发布 Release

适用于：发布正式版本

```bash
git commit -m "release: v0.1.0 - build release"
git commit -m "chore: 准备发布 - build release"
```

会自动：
1. 编译项目
2. 创建 GitHub Release
3. 上传 zip 包到 Release Assets

---

### 3️⃣ 清除缓存重新构建

适用于：缓存可能损坏、依赖更新后需要完整重编译

```bash
# 清除缓存 + 构建
git commit -m "fix: 重新构建 - build action --clear"

# 清除缓存 + 发布
git commit -m "release: 干净构建发布 - build release --clear"
```

---

### 4️⃣ 普通提交（不触发构建）

不包含关键词的提交不会触发任何构建：

```bash
git commit -m "docs: 更新文档"
git commit -m "style: 调整代码格式"
git commit -m "refactor: 重构代码"
```

---

## 🔀 关键词组合规则

| Commit Message | 触发构建? | 触发发布? | 使用缓存? |
|----------------|----------|----------|----------|
| `fix: bug` | ❌ | ❌ | - |
| `fix: bug - build action` | ✅ | ❌ | ✅ |
| `fix: bug - build release` | ✅ | ✅ | ✅ |
| `fix: bug - build action --clear` | ✅ | ❌ | ❌ |
| `fix: bug - build release --clear` | ✅ | ✅ | ❌ |

---

## ⏱️ 构建时间参考

| 场景 | 预计时间 |
|------|---------|
| 首次构建（无缓存） | ~7-10 分钟 |
| 有缓存的增量构建 | ~2-4 分钟 |
| 清除缓存重新构建 | ~7-10 分钟 |

---

## 📦 构建产物

构建成功后会生成：

```
mc-netease-world-manager-windows-x64.zip
├── mc-netease-world-manager.exe    # 主程序
└── README.md                        # 说明文档
```

---

## 🔗 相关链接

- [GitHub Actions 页面](../../actions) - 查看构建状态和下载 Artifact
- [Releases 页面](../../releases) - 查看和下载正式发布版本

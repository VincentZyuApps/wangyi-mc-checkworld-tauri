# MC NetEase World Manager

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/VincentZyu233/mc-netease-world-manager)

一个用 Rust + Tauri 构建的网易我的世界电脑版存档管理工具。

## ✨ 功能

- 📂 **列出存档** - 显示所有存档的名称、文件夹、保存时间和大小
- 🔍 **搜索过滤** - 按名称或文件夹名搜索
- 📊 **多种排序** - 按时间、名称、大小排序
- 💾 **备份存档** - 一键打包为 ZIP 文件
- ✏️ **重命名存档** - 修改存档显示名称
- 🗑️ **删除存档** - 安全删除不需要的存档
- 🎨 **深色主题** - 现代化暗色 UI 界面

## 📦 下载安装

### 方式 1：下载预编译版本

前往 [Releases](https://github.com/VincentZyu233/mc-netease-world-manager/releases) 页面下载最新版本的 ZIP 包，解压后直接运行 `mc-netease-world-manager.exe`。

### 方式 2：从源码构建

需要安装 [Rust](https://rustup.rs/) 和 [Tauri CLI](https://tauri.app/)：

```bash
# 克隆仓库
git clone https://github.com/VincentZyu233/mc-netease-world-manager.git
cd mc-netease-world-manager

# 安装 Tauri CLI
cargo install tauri-cli

# 构建发布版本
cargo tauri build
```

构建完成后，可执行文件位于 `src-tauri/target/release/` 目录。

## 🔧 开发

```bash
# 开发模式运行
cargo tauri dev
```

## 🚀 GitHub Actions 自动构建

本项目使用 GitHub Actions 自动构建。在 commit message 中包含以下关键词可触发相应操作：

| 关键词 | 作用 |
|--------|------|
| `build action` | 触发构建并上传 Artifact |
| `build release` | 触发构建并创建 Release |
| `--clear` | 清除缓存，从头编译 |

示例：
```bash
git commit -m "feat: add new feature - build action"
git commit -m "chore: prepare v1.0 - build release"
git commit -m "fix: rebuild - build action --clear"
```

👉 **详细说明请查看 [BUILD.md](.github/workflows/BUILD.md)**

## 📁 项目结构

```
+++_tauri_manage_+++/
├── src/                    # 前端文件
│   ├── index.html
│   ├── main.js
│   └── styles.css
├── src-tauri/              # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       └── main.rs
├── .github/
│   └── workflows/
│       └── build.yml       # GitHub Actions
└── README.md
```

## 🖥️ 系统要求

- Windows 10/11 (x64)
- 已安装网易我的世界电脑版

## 📝 许可证

MIT License

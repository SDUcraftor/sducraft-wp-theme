# SDUCraft WordPress 子主题

SDUcraft 官网使用的 WordPress 子主题，基于
[Sakurairo](https://github.com/mirai-mamori/Sakurairo)。

## 环境要求

- WordPress 6.x 或更高版本
- 已安装并启用 Sakurairo 父主题
- PHP 7.4 或更高版本
- 具备本地开发或主题文件部署权限

## 安装

1. 将 `SDUCraft` 目录放入 WordPress 的 `wp-content/themes/` 目录。
2. 确保同级目录中存在 Sakurairo 父主题。
3. 在 WordPress 后台的“外观 → 主题”中启用 SDUCraft。
4. 根据站点需要配置菜单、页面模板和相关插件。

## 功能模块

主题入口为 `functions.php`。各功能按职责拆分到独立模块，主要入口如下：

| 功能 | 入口文件 |
| --- | --- |
| 整合包内容类型、字段、排序和后台管理 | `inc/modpack-post-type.php` |
| 整合包列表与详情 | `user/page-game-download.php`、`single-sducraft_modpack.php` |
| 整合包卡片和前端交互 | `template-parts/modpack-card.php`、`css/modpack.css`、`js/modpack-page.js` |
| 公告页面 | `inc/announcement-page.php`、`user/page-announcement.php` |
| 首页分类文章短代码 | `inc/category-posts.php`、`js/category-posts.js` |
| MC 历史时间线 | `inc/timeline.php`、`category-our_story.php`、`template-parts/timeline.php` |
| Minecraft 交互页脚 | `footer/`（详见 [`footer/README.md`](footer/README.md)） |
| 全站样式和基础扩展 | `style.css`、`functions.php` |

## 目录结构

```text
SDUCraft/
├─ functions.php                 子主题入口和全站扩展
├─ style.css                     子主题声明和全站样式
├─ single-sducraft_modpack.php   整合包详情模板
├─ inc/                          PHP 功能模块
├─ user/                         可由后台选择的页面模板
├─ template-parts/               可复用模板片段
├─ css/                          功能样式
├─ js/                           前端和后台脚本
├─ layouts/                      父主题局部模板覆盖
├─ assets/                       通用静态资源
└─ footer/                       Minecraft 页脚组件
```

## 开发约定

- 优先通过子主题覆盖或扩展父主题，避免直接修改 `Sakurairo` 源码。
- 可复用或持续增长的功能应放入 `inc/`、`template-parts/` 或独立组件目录，并由 `functions.php` 引入。
- 新增 PHP 函数、选项和脚本句柄使用 `sducraft_` 前缀。
- 页面专用脚本和样式仅在对应页面加载，并在修改后更新资源版本或文件时间戳以避免缓存问题。

## 修改后检查

在 `SDUCraft` 目录执行以下检查：

```powershell
php -l functions.php
php -l inc/announcement-page.php
php -l inc/category-posts.php
php -l inc/modpack-post-type.php
node --check js/announcement-page.js
node --check js/category-posts.js
node --check js/modpack-admin.js
node --check js/modpack-page.js
git diff --check
```

涉及界面或异步资源时，还应检查桌面端与移动端、浅色与暗色模式、直接刷新以及 Sakurairo PJAX 导航后的表现。


## 时间线与部署清理

时间线入口为 `category-our_story.php`，资源目录说明见 [assets/README.md](assets/README.md)，皮肤设置见 [assets/skin/README.md](assets/skin/README.md)。

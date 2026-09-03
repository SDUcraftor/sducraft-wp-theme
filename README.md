# SDUCraft 子主题

SDUCraft 新官网所使用的 WordPress 子主题，基于 Sakurairo。站点专用功能放在本目录；同级 `../Sakurairo/` 是父主题源码，可用于查询模板结构、样式和前端初始化逻辑。

## 从哪里开始

`functions.php` 是入口，负责加载各个功能模块，并保留少量全站扩展。较完整的功能应放进 `inc/` 或独立组件目录，再由入口文件引入，不要继续把实现集中到 `functions.php`（应该没人想看到一个php文件里有几千行的各种内容吧）。

| 修改目标 | 主要入口 |
| --- | --- |
| 整合包内容类型、字段、排序和后台管理 | `inc/modpack-post-type.php` |
| 整合包列表与详情 | `user/page-game-download.php`、`single-sducraft_modpack.php` |
| 整合包卡片和前端交互 | `template-parts/modpack-card.php`、`css/modpack.css`、`js/modpack-page.js` |
| 公告页面 | `inc/announcement-page.php`、`user/page-announcement.php` |
| 首页分类文章短代码 | `inc/category-posts.php`、`js/category-posts.js` |
| Minecraft 交互页脚 | `footer/`，详见 [`footer/README.md`](footer/README.md) |
| 全站小功能和基础样式 | `functions.php`、`style.css` |

## 目录结构

```text
SDUCraft/
├─ functions.php                 子主题入口与全站小功能
├─ style.css                     子主题声明和全站样式
├─ single-sducraft_modpack.php   整合包详情模板
├─ inc/                          PHP 功能模块
├─ user/                         后台可选择的页面模板
├─ template-parts/               可复用局部模板
├─ css/                          功能样式
├─ js/                           前台和后台交互
├─ layouts/                      对父主题局部模板的覆盖
├─ assets/                       通用静态资源
└─ footer/                       独立的 Minecraft 页脚组件
```

## Knowings

- 非必要情况不直接修改父主题目录即 `../Sakurairo/`，其仅作为依赖和参考，如果确有需要魔改内容，将文件原本复制过来并改写（Sakurairo的更新会将魔改的内容重置的）
- 一般情况下，请 不 要 更 新 Sakurairo ！更新父主题一般需要将整个站点检查一遍，十分繁杂
- 整合包使用自定义内容类型 `sducraft_modpack`，但列表使用“游戏下载页面模板”，没有启用自定义内容类型 archive（因为一些神秘原因似乎无法直接修改路由，如果找到了方法记得dd）
- 公告仍是普通文章，由“公告页面模板”按照后台选择的分类读取。
- `[cat_posts name="分类" number="6"]` 复用了 Sakurairo 的 `tpl/content-thumbcard.php`。父主题更新该模板、懒加载或卡片动画时，需要回归检查首页。
- 新代码使用 `sducraft_` 前缀。公告模块中的 `iro_` 是历史命名，不要只重命名其中一部分。
- 修改旧短代码、旧字段或旧路由，应当增加兼容层，除非维护者明确要求不要增加（兼容是很重要的）。
- 页面专用资源只在对应页面加载。修改资源后若线上仍是旧版本，先检查 enqueue 的版本号和缓存（浏览器使用Ctrl + F5强制刷新喵）。

`functions.php` 中目前还有诸如 Query Loop 排序、媒体类型扩展、FileBird 列表、菜单文字项、定时 Smart Slider 和首页轮播滚动状态等小功能。某项继续增长时，再拆到独立模块即可。

## 修改后检查

修改完后至少应当确认一些核心模块没有问题（现有的核心模块主要包括整合包模块和公告页，其它的问题大多只会影响体验而不会对站点造成核心影响）

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

涉及界面时，还需检查桌面与手机、浅色与暗色、直接刷新与 Sakurairo PJAX 跳转。涉及异步加载时，不只检查接口返回，还要确认追加内容的图片、动画、布局和间距。

开始修改前先查看工作区已有变更，不要覆盖无关内容。

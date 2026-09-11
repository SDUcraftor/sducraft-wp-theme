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

## SDUCraft 设置

后台左侧的 **SDUCraft 设置** 为独立入口，紧邻 **iro 主题设置** 下方。
复用父主题 Sakurairo_CSF 控件，数据单独存储在 `sducraft_options`，加载入口为 `opt/bootstrap.php`；后台页面位于 `opt/settings.php`，各栏目字段位于 `opt/sections/`。

- **时间线**：选择分类、画质，以及指定双轨文章／普通单轨。更改分类后先保存刷新，再选节点。指定模式需要四篇不同的文章：还原计划起点、还原计划合并前节点、原 SDUcraft 起点、合并节点；文章必须属于所选分类，日期需按历史顺序排列。无效配置退回单轨并在设置页提示。
- **事件日期**：文章编辑页的 SDUCraft 时间线侧栏可指定日期，留空沿用发布日期。仅影响时间线。
- **矿车人物**：统一使用后台保存的皮肤及文章切换规则。空皮肤隐藏人物，图片使用 64×64 PNG，模型选择 Classic（Steve模型）或 Slim（Alex模型）。
- **交互页脚**：首页总开关、音效、音量及高级交互参数。关闭页脚时不加载页脚资源。
- **彩蛋**：内置彩蛋按原注册代码加载，后台不覆盖其参数。自定义彩蛋独立分区、整行编辑，支持横向／深度随机、目标方块、单独静音及自定义音效。固定深度允许 -6–12（草地为 0），实际绑定到可挖掘方块。
- **文章导航**：选择同分类或全站，显示开关继续由 iro 设置控制。

时间线下设基础设置、画质设置、矿车人物三个栏目；人物切换规则位于矿车人物页的三个人物设置下方，以独立标题分区并整行展示。画质设置可分别调整省电／标准／高画质的 FPS 上限、3D 开关、阴影、像素比例及环境／樱花粒子数量。自动模式选择省电或标准档；关闭 3D 使用静态轨道。


品牌文案、公告标签及世界生成规则仍在代码中维护。
字体和信纸装饰使用主题内资源。修改后需进行 PHP 语法检查及真实 WordPress 后台、PJAX 浏览验证。

## 功能模块

主题入口为 `functions.php`。各功能按职责拆分到独立模块，主要入口如下：

| 功能 | 入口文件 |
| --- | --- |
| 整合包内容类型、字段、排序和后台管理 | `inc/modpack-post-type.php` |
| 整合包列表与详情 | `user/page-game-download.php`、`single-sducraft_modpack.php` |
| 整合包卡片和前端交互 | `template-parts/modpack-card.php`、`css/modpack.css`、`js/modpack-page.js` |
| 公告页面 | `inc/announcement-page.php`、`user/page-announcement.php` |
| 首页分类文章短代码 | `inc/category-posts.php`、`js/category-posts.js` |
| MC 历史时间线 | `inc/timeline.php`、`template-parts/timeline-page.php`、`template-parts/timeline.php` |
| Minecraft 交互页脚 | `footer/`（详见 [`footer/README.md`](footer/README.md)） |
| 全站资源加载 | `functions.php`、`style.css` |
| 设置读取及模块加载 | `opt/helpers.php`、`opt/bootstrap.php` |
| 后台设置栏目 | `opt/settings.php`、`opt/sections/` |
| 时间线配置解析及编辑字段 | `inc/timeline-settings.php`、`inc/timeline-admin.php` |
| 查询排序 | `functions.php` |
| 菜单、上传及分页兼容处理 | `functions.php` |
| FileBird 列表短代码 | `functions.php` |
| 日夜轮播短代码 | `functions.php` |

## 目录结构

```text
SDUCraft/
├─ functions.php                 模块加载和原有主题扩展
├─ style.css                     子主题声明和全站样式
├─ single-sducraft_modpack.php   整合包详情模板
├─ inc/                          PHP 功能模块及时间线编辑字段
├─ opt/                          设置入口、读取助手及后台页面
│  └─ sections/                  通用、时间线、页脚设置字段
├─ user/                         可由后台选择的页面模板
├─ template-parts/               模板片段及动态选择的时间线页面
├─ css/                          功能样式
├─ js/                           前端和后台脚本
├─ layouts/                      父主题局部模板覆盖
├─ assets/                       通用静态资源
└─ footer/                       Minecraft 页脚组件
```

## 开发约定

原本定义在 `functions.php` 中的资源加载、查询排序、短代码及 filter 保留原位。此次职责拆分集中在设置系统；原有公告、整合包、时间线和页脚模块保持现有组织。

- 优先通过子主题覆盖或扩展父主题，避免直接修改 `Sakurairo` 源码。
- 可复用或持续增长的功能应放入 `inc/`、`template-parts/` 或独立组件目录，并由 `functions.php` 引入。
- 新增 PHP 函数、选项和脚本句柄使用 `sducraft_` 前缀。
- 后台字段定义放在 `opt/sections/`；字段值的业务解释放在对应功能模块，不混入后台界面文件。栏目文件在设置注册回调内加载，共用 `$prefix`、`$field`、`$number`。
- 页脚保持独立组件：`footer/settings.php` 负责方块定义读取、配置转换和 filter，`footer/bootstrap.php` 负责前台接入。
- `user/` 页面模板、根目录单篇模板和静态资源路径保留，避免影响数据库中的模板选择及媒体地址。
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

时间线入口为 `template-parts/timeline-page.php`，资源目录说明见 [assets/README.md](assets/README.md)，皮肤设置见 [assets/skin/README.md](assets/skin/README.md)。

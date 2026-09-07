# SDUcraft Minecraft 交互页脚

该组件在网站页脚生成可挖掘的 Minecraft 地层，并通过 `wp_footer` 接入
SDUcraft 子主题。入口是 `bootstrap.php`，由主题根目录的 `functions.php`
加载。

## 文件

- `bootstrap.php`：注册脚本、样式并输出组件。
- `mc-footer.php`：页脚结构和前端配置。
- `mc-footer.css`：组件样式。
- `mc-world.js`：方块类型、地层和特殊结构。
- `mc-footer.js`：点火、挖掘、粒子和弹窗交互。
- `easter-eggs.php`：SDUcraft 当前使用的彩蛋。
- `../assets/minecraft/`：Minecraft 方块、物品、粒子与音效资源。

## 地层配置

`mc-world.js` 中：

- `blocks` 定义方块纹理、硬度、挖掘音效和是否可挖掘。
- `layers` 定义地层顺序和厚度。
- `structures` 在基础地层中生成树木、矿物和建筑。

资源路径相对于 `assets/minecraft/`。例如方块纹理使用
`texture/block/stone.png`，粒子使用 `texture/particle/`，工具使用
`texture/item/`。

## 彩蛋配置

在 `easter-eggs.php` 中登记彩蛋。每项彩蛋使用：

- `id`：唯一标识。
- `x`：从左到右的比例，范围为 0 到 1，也可设为 `random`。
- `depth`：相对草方块的深度，也可设为 `random`。
- `block`：可选的目标方块类型。
- `title`：弹窗标题。
- `render` 或 `content`：彩蛋内容。
- `sound`：可选音效；设为 `false` 时静音。

默认彩蛋音效与全局交互参数分别由
`sducraft_mc_footer_default_easter_egg_sound` 和
`sducraft_mc_footer_config` 过滤器调整。

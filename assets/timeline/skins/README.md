# 矿车乘客配置

修改 `../rider.json`（即 assets/timeline/rider.json），刷新时间线即可生效。皮肤路径相对于 rider.json。

```json
{
  "default": {"skin": "skins/steve.png", "model": "classic"},
  "switches": [
    {"afterFromEnd": 10, "skin": "skins/my-skin.png", "model": "slim"},
    {"afterFromEnd": 3, "skin": "none"}
  ]
}
```

- default：默认皮肤；skin 为 none 时不显示人物。
- skin：标准 64×64 Minecraft PNG 皮肤，支持透明外层。暂不支持旧版 64×32 皮肤。
- model：classic 为四像素宽手臂（Steve），slim 为三像素宽手臂（Alex）；不填默认 classic。PNG 无法可靠推断手臂类型，请显式指定。
- afterFromEnd：按页面实际节点顺序从末尾计数，最后一个节点是倒数第 1 个。越过指定节点、下一个节点成为焦点后切换；指定节点本身仍使用之前的皮肤。例如 38 条记录时，倒数第 10 个是第 29 条，从第 30 条起应用新皮肤。
- 上例最后两条记录隐藏人物。afterFromEnd=1 后没有下一个节点，因此不会触发。
- 多条规则自动按经过顺序应用；向上回看时也会恢复对应皮肤。超出节点数量的规则忽略。
- 图片缺失或尺寸不符时回退默认 Steve，时间线仍可阅读。新增文件随子主题一起上传；如启用了 CDN 缓存，需要清理对应文件缓存。

默认配置没有切换规则，全程使用内置 Steve。所有人物几何共用现有场景渲染器，与矿车一起转向，不引入新 WebGL 上下文或第三方依赖。

## 两条起源支线

rider.json 新增 branches 配置（和 default、switches 同级）：

```json
"branches": {
  "restoration": {"skin": "skins/steve.png", "model": "classic"},
  "vanilla": {"skin": "skins/alex.png", "model": "slim"}
}
```

restoration 对应还原计划，vanilla 对应原 SDUcraft。两者均可设置 skin 为 none。Steve / Alex 是区分支线的占位人物，不代表历史成员的真实皮肤。主线继续使用 default / switches；进入还原计划支线时使用 restoration，另一辆车独立使用 vanilla。缺省配置使用 Steve / Alex。

页面仍然最新在上，新增“从最初开始”入口到达底部。人物默认背向读者；向下滚动时转向读者，向上滚动时转回背向，停止滚动后保持当前朝向。两条支线同步应用，矿车自身仍沿轨道定向。原 SDUcraft 的车只在其成立节点与合并站之间运行。在距合并点 80 像素的滚动区间内，两车逐渐靠拢、对齐并合为一辆；跨过合并点后只显示主线车及其皮肤。反向阅读时恢复两车及各自皮肤，不会延伸到其成立之前。

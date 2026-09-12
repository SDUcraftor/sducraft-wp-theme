<?php
/** Settings fields registered in the scope of opt/settings.php. */
defined('ABSPATH') || exit;

Sakurairo_CSF::createSection($prefix, array('id' => 'sducraft_footer', 'title' => '自定义页脚', 'icon' => 'fa fa-cubes'));
Sakurairo_CSF::createSection($prefix, array('parent' => 'sducraft_footer', 'title' => '交互设置', 'icon' => 'fa fa-hand-pointer', 'fields' => array(
    $field('footer_enabled', '启用首页交互页脚', 'switcher', true),
    $field('footer_sound', '启用音效', 'switcher', true),
    $number('footer_volume', '音量（0–100）', 68, 0, 100),
    array('type' => 'subheading', 'content' => '高级交互参数'),
    $number('footer_delay', 'TNT 出现延迟（毫秒）', 4000, 0, 60000),
    $number('footer_attempts', '点火所需次数', 5, 1, 30),
    $number('footer_scroll', '地下解锁滚动阈值', 600, 1, 10000),
)));
$world_fields = array(array('type' => 'subheading', 'content' => '地层厚度'));
$block_definitions = sducraft_mc_blocks();
foreach (sducraft_mc_layer_defaults() as $type => $rule) {
    $world_fields[] = $number('world_layer_' . $type, ($block_definitions[$type]['label'] ?? $type) . '（层）', $rule['count'], $rule['min'], $rule['max']);
}
$world_fields[] = array('type' => 'submessage', 'style' => 'info', 'content' => '地层顺序固定为：空气、草地、泥土、石头、基岩。泥土和石头可设为 0；草地与基岩至少保留 1 层。修改后保存并刷新，彩蛋深度输入范围随之更新；超出世界范围的彩蛋会就近放置。');
$world_fields[] = array('type' => 'subheading', 'content' => '地表装饰');
$world_fields[] = $field('world_oak_tree', '橡树', 'switcher', true, array('desc' => '保持现有位置和形状；空气不足 6 层时不生成，避免树冠被截断。'));
$world_fields[] = $field('world_sapling', '树苗', 'switcher', true, array('desc' => '保持现有位置；至少需要 1 层空气。'));
$world_fields[] = array('type' => 'subheading', 'content' => '挖掘');
$world_fields[] = array_merge($number('world_mining_speed', '挖掘速度倍率', 1, .25, 4, .25), array('desc' => '1 为原速度，2 为两倍速度、挖掘时间减半；保留不同方块之间的硬度差异。'));
Sakurairo_CSF::createSection($prefix, array('parent' => 'sducraft_footer', 'title' => '世界设置', 'icon' => 'fa fa-globe', 'fields' => $world_fields));
list($min_depth, $max_depth) = sducraft_mc_depth_range();
$fields = array(array('type' => 'subheading', 'style' => 'info', 'content' => '自定义彩蛋与主题内文件注册的彩蛋共同加载；此处仅提供一些基础类型，高级配置请自行前往相关文件注册。'));
$fields[] = $field('custom_eggs', '自定义彩蛋', 'group', array(), array('class' => 'sducraft-full-row', 'button_title' => '添加彩蛋', 'fields' => array(
    $field('title', '标题', 'text', ''), $field('enabled', '启用', 'switcher', true),
    $field('x_mode', '横向', 'button_set', 'percent', array('options' => array('random' => '随机', 'percent' => '百分比', 'fixed' => '固定格数'))),
    array_merge($number('x', '横向位置（%）', 50, 0, 100), array('dependency' => array('x_mode', '==', 'percent'))),
    array_merge($number('column', '横向格数', 1, 1, 10000), array('desc' => '从左往右，第 1 格起计；超出当前设备宽度时取最右一格。', 'dependency' => array('x_mode', '==', 'fixed'))),
    $field('depth_mode', '深度', 'button_set', 'fixed', array('options' => array('random' => '随机', 'fixed' => '固定格数'))),
    array_merge($number('depth', '深度格数', min(5, $max_depth), $min_depth, $max_depth), array('desc' => '草地为 0，向下为正，向上为负。当前范围：' . $min_depth . ' 至 ' . $max_depth . '。', 'dependency' => array('depth_mode', '==', 'fixed'))),
    $field('block', '优先目标方块', 'select', '', array('options' => sducraft_mc_target_blocks(), 'desc' => '优先寻找附近指定方块，再尝试全图同类方块；不存在时退回附近可挖掘方块，不会生成或替换方块。')),
    $field('image', '图片', 'upload', '', array('library' => 'image')),
    $field('content', '正文', 'wp_editor', ''),
    $field('sound_enabled', '音效', 'switcher', true, array('text_on' => '开', 'text_off' => '关')),
    $field('sound', '音效路径', 'upload', '', array('library' => 'audio', 'desc' => '留空使用默认音效。', 'dependency' => array('sound_enabled', '==', 'true'))),
), 'desc' => '此处添加的彩蛋与主题注册的彩蛋共同加载；内置彩蛋由原注册代码控制。'));
Sakurairo_CSF::createSection($prefix, array('parent' => 'sducraft_footer', 'title' => '彩蛋设置', 'icon' => 'fa fa-gift', 'fields' => $fields));

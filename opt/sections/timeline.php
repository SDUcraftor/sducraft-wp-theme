<?php
/** Settings fields registered in the scope of opt/settings.php. */
defined('ABSPATH') || exit;

Sakurairo_CSF::createSection($prefix, array('id' => 'sducraft_timeline', 'title' => '时间线', 'icon' => 'fa fa-history'));
$category = sducraft_timeline_category();
$query = array('post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => -1);
$query['cat'] = $category;
$posts = array();
$timeline_posts = $category ? get_posts($query) : array();
foreach ($timeline_posts as $post) $posts[$post->ID] = get_the_title($post) . ' (#' . $post->ID . ')';
$categories = array(0 => '请选择分类');
foreach (get_categories(array('hide_empty' => false)) as $term) $categories[$term->term_id] = $term->name;
$fields = array(
    $field('timeline_category', '时间线分类', 'select', 0, array('options' => $categories, 'desc' => '更改分类后先保存并刷新，再选择下方节点文章。')),
    $field('timeline_nodes', '轨道节点', 'select', 'custom', array('options' => array('custom' => '指定双轨节点文章', 'single' => '普通单轨'), 'desc' => '双轨保留现有结构。四篇文章必须不同，且起源不得晚于合并；配置不完整时自动使用单轨。')),
);
foreach (array('restoration_start' => '还原计划起点', 'restoration_end' => '还原计划合并前节点', 'vanilla' => '原 SDUcraft 起点', 'merge' => '合并节点') as $key => $title) {
    $fields[] = $field('node_' . $key, $title, 'select', '', array('class' => 'sducraft-post-select', 'options' => $posts, 'placeholder' => '请选择文章', 'chosen' => true, 'settings' => array('width' => '100%'), 'dependency' => array('timeline_nodes', '==', 'custom')));
}
$fields[] = $field('timeline_quality', '默认画质', 'select', 'auto', array('options' => array('auto' => '自动（推荐）', 'low' => '省电', 'standard' => '标准', 'high' => '高画质'), 'desc' => '统一调整阴影、分辨率和粒子。自动模式沿用设备判断；仍尊重系统减少动态效果偏好。'));
Sakurairo_CSF::createSection($prefix, array('parent' => 'sducraft_timeline', 'title' => '基础设置', 'icon' => 'fa fa-sliders-h', 'fields' => $fields));
$fields = array(array('type' => 'submessage', 'style' => 'info', 'content' => '自动模式按设备选择省电或标准档。关闭 3D 后使用静态轨道，保留文章和阅读交互。FPS 为渲染上限，实际帧率取决于设备。'));
foreach (sducraft_quality_defaults() as $name => $defaults) {
    $fields[] = array('type' => 'subheading', 'content' => array('low' => '省电', 'standard' => '标准', 'high' => '高画质')[$name]);
    $fields[] = $field('quality_' . $name . '_render', '启用 3D 渲染', 'switcher', $defaults['render']);
    $fields[] = $number('quality_' . $name . '_fps', '渲染帧率上限（FPS）', $defaults['fps'], 10, 120);
    $fields[] = $field('quality_' . $name . '_shadows', '实时阴影', 'switcher', $defaults['shadows']);
    $fields[] = $number('quality_' . $name . '_ratio', '渲染像素比例上限', $defaults['ratio'], .5, 3, .1);
    $fields[] = $number('quality_' . $name . '_particles', '环境粒子数量', $defaults['particles'], 0, 300);
    $fields[] = $number('quality_' . $name . '_petals', '每组樱花粒子上限（共三组）', $defaults['petals'], 0, 100);
}
Sakurairo_CSF::createSection($prefix, array('parent' => 'sducraft_timeline', 'title' => '画质设置', 'icon' => 'fa fa-desktop', 'fields' => $fields));
$skinFields = static function ($skinId, $modelId) use ($field) {
    return array(
        $field($skinId, '皮肤图片', 'upload', '', array('class' => 'sducraft-skin-field', 'library' => 'image', 'desc' => '选择 64×64 PNG 皮肤；点击“3D 预览”可旋转查看人物，留空隐藏人物。')),
        $field($modelId, '人物模型', 'select', 'classic', array('options' => array('classic' => 'Classic（Steve模型）', 'slim' => 'Slim（Alex模型）'))),
    );
};
$fields = array();
foreach (array('rider' => '主线默认人物', 'restoration' => '还原计划人物', 'vanilla' => '原 SDUcraft 人物') as $key => $title) {
    $fields[] = array('type' => 'subheading', 'content' => $title);
    $fields = array_merge($fields, $skinFields($key . '_skin', $key . '_model'));
}

$rules = $field('rider_switches', '人物切换规则', 'group', array(), array('class' => 'sducraft-full-row', 'button_title' => '添加切换规则', 'accordion_title_prefix' => '切换规则', 'accordion_title_number' => true, 'accordion_title_auto' => false, 'fields' => array_merge(array(
    $field('post', '经过文章后切换', 'select', '', array('class' => 'sducraft-post-select', 'options' => $posts, 'placeholder' => '请选择文章', 'chosen' => true, 'settings' => array('width' => '100%'))),
), $skinFields('skin', 'model')), 'desc' => '按页面从上到下经过节点后切换，向上回看恢复之前的人物。'));
$fields[] = array('type' => 'subheading', 'content' => '人物切换规则');
$fields[] = $rules;
Sakurairo_CSF::createSection($prefix, array('parent' => 'sducraft_timeline', 'title' => '矿车人物', 'icon' => 'fa fa-user', 'fields' => $fields));

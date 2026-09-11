<?php
/** SDUCraft settings page, field helpers, assets and menu placement. */
defined('ABSPATH') || exit;

add_action('after_setup_theme', function () {
    if (!is_admin() || !class_exists('Sakurairo_CSF')) return;
    $prefix = 'sducraft_options';
    Sakurairo_CSF::createOptions($prefix, array(
        'menu_title' => 'SDUCraft 设置', 'menu_slug' => 'sducraft_options',
        'framework_title' => 'SDUCraft 设置', 'menu_icon' => 'dashicons-admin-generic',
        'show_bar_menu' => false, 'show_sub_menu' => true, 'show_in_network' => false,
        'framework_class' => 'sducraft-settings',
        'footer_text' => 'SDUCraft 子主题设置',
    ));
    $field = static function ($id, $title, $type, $default, $extra = array()) {
        return array_merge(array('id' => $id, 'title' => $title, 'type' => $type, 'default' => $default), $extra);
    };
    $number = static function ($id, $title, $default, $min, $max, $step = 1) use ($field) {
        return $field($id, $title, 'number', $default, array('attributes' => array('min' => $min, 'max' => $max, 'step' => $step)));
    };
    require __DIR__ . '/sections/general.php';
    require __DIR__ . '/sections/timeline.php';
    require __DIR__ . '/sections/footer.php';
}, 5);

add_action('admin_enqueue_scripts', function ($hook) {
    if ($hook !== 'toplevel_page_sducraft_options') return;
    wp_enqueue_style('sducraft-settings', get_stylesheet_directory_uri() . '/css/settings.css', array(), filemtime(get_stylesheet_directory() . '/css/settings.css'));
});

add_filter('custom_menu_order', '__return_true');
add_filter('menu_order', function ($order) {
    if (!is_array($order) || !in_array('iro_options', $order, true) || !in_array('sducraft_options', $order, true)) return $order;
    $order = array_values(array_diff($order, array('sducraft_options')));
    array_splice($order, array_search('iro_options', $order, true) + 1, 0, array('sducraft_options'));
    return $order;
});

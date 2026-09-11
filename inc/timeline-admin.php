<?php
/** Timeline editor metadata and settings notices. */
defined('ABSPATH') || exit;

add_action('admin_notices', function () {
    if (!current_user_can('manage_options') || (get_current_screen()->id ?? '') !== 'toplevel_page_sducraft_options') return;
    if (sducraft_opt('timeline_nodes', 'custom') === 'custom' && !sducraft_timeline_roles(sducraft_get_timeline_items())) {
        echo '<div class="notice notice-warning"><p>SDUCraft：双轨节点不完整、文章不属于当前分类，或日期顺序不正确。前台暂时使用单轨，请检查时间线设置。</p></div>';
    }
});

add_action('add_meta_boxes_post', function () {
    add_meta_box('sducraft-event-date', 'SDUCraft 时间线', function ($post) {
        wp_nonce_field('sducraft_event_date', 'sducraft_event_date_nonce');
        echo '<label>事件日期 <input type="date" name="sducraft_event_date" value="' . esc_attr(get_post_meta($post->ID, '_sducraft_event_date', true)) . '"></label><p>留空使用文章发布日期，仅影响时间线显示和排序。</p>';
    }, 'post', 'side');
});
add_action('save_post_post', function ($post_id) {
    if (!isset($_POST['sducraft_event_date_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['sducraft_event_date_nonce'])), 'sducraft_event_date')
        || !current_user_can('edit_post', $post_id) || (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id)) return;
    $value = sanitize_text_field(wp_unslash($_POST['sducraft_event_date'] ?? ''));
    if ($value === '') { delete_post_meta($post_id, '_sducraft_event_date'); return; }
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $value, $parts) && checkdate((int) $parts[2], (int) $parts[3], (int) $parts[1])) {
        update_post_meta($post_id, '_sducraft_event_date', $value);
    }
});

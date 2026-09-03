<?php
/**
 * SDUcraft modpack content type and editor fields.
 */

if (!defined('ABSPATH')) {
    exit;
}

const SDUCRAFT_MODPACK_POST_TYPE = 'sducraft_modpack';

function sducraft_register_modpack_post_type() {
    $labels = array(
        'name'                  => '整合包',
        'singular_name'         => '整合包',
        'menu_name'             => '整合包',
        'name_admin_bar'        => '整合包',
        'add_new'               => '新建整合包',
        'add_new_item'          => '新建整合包',
        'edit_item'             => '编辑整合包',
        'new_item'              => '新整合包',
        'view_item'             => '查看整合包',
        'view_items'            => '查看整合包',
        'search_items'          => '搜索整合包',
        'not_found'             => '没有找到整合包',
        'not_found_in_trash'    => '回收站中没有整合包',
        'all_items'             => '全部整合包',
        'archives'              => '整合包下载',
        'attributes'            => '整合包属性',
        'featured_image'        => '整合包封面',
        'set_featured_image'    => '设置整合包封面',
        'remove_featured_image' => '移除整合包封面',
        'use_featured_image'    => '使用为整合包封面',
    );

    register_post_type(SDUCRAFT_MODPACK_POST_TYPE, array(
        'labels'             => $labels,
        'description'        => 'SDUcraft 提供的 Minecraft 整合包与客户端下载。',
        'public'             => true,
        'show_in_rest'       => true,
        'menu_icon'          => 'dashicons-archive',
        'has_archive'        => false,
        'rewrite'            => array(
            'slug'       => 'game-download',
            'with_front' => false,
        ),
        'supports'           => array('title', 'editor', 'thumbnail', 'revisions'),
        'publicly_queryable' => true,
        'show_in_nav_menus'  => true,
        'menu_position'      => 21,
    ));
}
add_action('init', 'sducraft_register_modpack_post_type');

function sducraft_modpack_statuses() {
    return array(
        'pinned'       => '置顶',
        'maintained'  => '维护中',
        'archived'    => '已归档',
        'discontinued'=> '停止维护',
    );
}

function sducraft_modpack_status_order($status) {
    return array(
        'pinned'        => 1,
        'maintained'   => 2,
        'archived'     => 3,
        'discontinued' => 4,
    )[$status] ?? 2;
}

function sducraft_add_modpack_meta_boxes() {
    add_meta_box(
        'sducraft-modpack-details',
        '整合包信息',
        'sducraft_render_modpack_details_meta_box',
        SDUCRAFT_MODPACK_POST_TYPE,
        'normal',
        'high'
    );

    add_meta_box(
        'sducraft-modpack-downloads',
        '下载项',
        'sducraft_render_modpack_downloads_meta_box',
        SDUCRAFT_MODPACK_POST_TYPE,
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'sducraft_add_modpack_meta_boxes');

function sducraft_render_modpack_details_meta_box($post) {
    wp_nonce_field('sducraft_save_modpack', 'sducraft_modpack_nonce');

    $fields = array(
        'minecraft_version' => array('Minecraft 版本', '例如：1.21.7'),
        'modpack_version'   => array('整合包版本', '例如：4.2.0'),
        'author'            => array('作者', '个人或制作团队'),
    );
    $status = get_post_meta($post->ID, '_sducraft_modpack_status', true);
    $summary = get_post_meta($post->ID, '_sducraft_modpack_summary', true);
    ?>
    <div class="sducraft-modpack-fields">
        <?php foreach ($fields as $key => $field) : ?>
            <p>
                <label for="sducraft-modpack-<?php echo esc_attr($key); ?>"><strong><?php echo esc_html($field[0]); ?></strong></label>
                <input id="sducraft-modpack-<?php echo esc_attr($key); ?>" class="widefat" type="text"
                    name="sducraft_modpack[<?php echo esc_attr($key); ?>]"
                    value="<?php echo esc_attr(sducraft_get_modpack_field($post->ID, $key)); ?>"
                    placeholder="<?php echo esc_attr($field[1]); ?>">
            </p>
        <?php endforeach; ?>
        <p>
            <label for="sducraft-modpack-status"><strong>状态</strong></label>
            <select id="sducraft-modpack-status" name="sducraft_modpack[status]">
                <?php foreach (sducraft_modpack_statuses() as $value => $label) : ?>
                    <option value="<?php echo esc_attr($value); ?>" <?php selected($status ?: 'maintained', $value); ?>><?php echo esc_html($label); ?></option>
                <?php endforeach; ?>
            </select>
        </p>
        <p>
            <label for="sducraft-modpack-summary"><strong>简短介绍</strong></label>
            <textarea id="sducraft-modpack-summary" class="widefat" rows="4" name="sducraft_modpack[summary]" placeholder="用于下载列表，建议控制在两三行内。"><?php echo esc_textarea($summary); ?></textarea>
        </p>
    </div>
    <?php
}

function sducraft_render_modpack_downloads_meta_box($post) {
    $downloads = get_post_meta($post->ID, '_sducraft_modpack_downloads', true);
    if (!is_array($downloads)) {
        $downloads = array();
    }
    ?>
    <div id="sducraft-modpack-downloads-list">
        <?php foreach ($downloads as $index => $download) : ?>
            <?php sducraft_render_modpack_download_row($index, $download); ?>
        <?php endforeach; ?>
    </div>
    <p><button type="button" class="button button-secondary" id="sducraft-add-download">添加下载项</button></p>
    <script type="text/html" id="tmpl-sducraft-modpack-download">
        <?php sducraft_render_modpack_download_row('{{data.index}}', array()); ?>
    </script>
    <p class="description">文件既可以从媒体库选择，也可以直接填写外部下载地址。附件大小会在前台自动读取。</p>
    <?php
}

function sducraft_render_modpack_download_row($index, $download) {
    $download = wp_parse_args($download, array(
        'label'         => '',
        'platform'      => '',
        'architecture'  => '',
        'url'           => '',
        'attachment_id' => 0,
    ));
    $prefix = 'sducraft_modpack_downloads[' . $index . ']';
    ?>
    <div class="sducraft-download-row">
        <div class="sducraft-download-row__fields">
            <p><label>按钮文字<input type="text" name="<?php echo esc_attr($prefix); ?>[label]" value="<?php echo esc_attr($download['label']); ?>" placeholder="例如：Windows 客户端下载"></label></p>
            <p><label>平台<input type="text" name="<?php echo esc_attr($prefix); ?>[platform]" value="<?php echo esc_attr($download['platform']); ?>" placeholder="Windows / Linux"></label></p>
            <p><label>架构<input type="text" name="<?php echo esc_attr($prefix); ?>[architecture]" value="<?php echo esc_attr($download['architecture']); ?>" placeholder="x86_64 / ARM64"></label></p>
        </div>
        <p>
            <label>下载地址<input class="widefat sducraft-download-url" type="url" name="<?php echo esc_attr($prefix); ?>[url]" value="<?php echo esc_url($download['url']); ?>" placeholder="https://..."></label>
            <input class="sducraft-download-attachment-id" type="hidden" name="<?php echo esc_attr($prefix); ?>[attachment_id]" value="<?php echo absint($download['attachment_id']); ?>">
        </p>
        <p>
            <button type="button" class="button sducraft-select-download">从媒体库选择</button>
            <button type="button" class="button-link-delete sducraft-remove-download">移除此项</button>
        </p>
    </div>
    <?php
}

function sducraft_save_modpack_meta($post_id) {
    if (!isset($_POST['sducraft_modpack_nonce']) ||
        !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['sducraft_modpack_nonce'])), 'sducraft_save_modpack')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $details = isset($_POST['sducraft_modpack']) && is_array($_POST['sducraft_modpack'])
        ? wp_unslash($_POST['sducraft_modpack'])
        : array();

    foreach (array('minecraft_version', 'modpack_version', 'author') as $key) {
        update_post_meta($post_id, '_sducraft_modpack_' . $key, sanitize_text_field($details[$key] ?? ''));
    }

    $statuses = sducraft_modpack_statuses();
    $status = sanitize_key($details['status'] ?? 'maintained');
    update_post_meta($post_id, '_sducraft_modpack_status', isset($statuses[$status]) ? $status : 'maintained');
    update_post_meta($post_id, '_sducraft_modpack_status_order', sducraft_modpack_status_order($status));
    update_post_meta($post_id, '_sducraft_modpack_summary', sanitize_textarea_field($details['summary'] ?? ''));

    $downloads = isset($_POST['sducraft_modpack_downloads']) && is_array($_POST['sducraft_modpack_downloads'])
        ? wp_unslash($_POST['sducraft_modpack_downloads'])
        : array();
    $clean_downloads = array();

    foreach ($downloads as $download) {
        if (!is_array($download)) {
            continue;
        }

        $url = esc_url_raw($download['url'] ?? '');
        $attachment_id = absint($download['attachment_id'] ?? 0);
        if (!$url && $attachment_id) {
            $url = wp_get_attachment_url($attachment_id);
        }
        if (!$url) {
            continue;
        }

        $clean_downloads[] = array(
            'label'         => sanitize_text_field($download['label'] ?? ''),
            'platform'      => sanitize_text_field($download['platform'] ?? ''),
            'architecture'  => sanitize_text_field($download['architecture'] ?? ''),
            'url'           => $url,
            'attachment_id' => $attachment_id,
        );
    }

    update_post_meta($post_id, '_sducraft_modpack_downloads', $clean_downloads);
}
add_action('save_post_' . SDUCRAFT_MODPACK_POST_TYPE, 'sducraft_save_modpack_meta');

function sducraft_enqueue_modpack_admin_assets($hook) {
    $screen = get_current_screen();
    if (!$screen || $screen->post_type !== SDUCRAFT_MODPACK_POST_TYPE || !in_array($hook, array('post.php', 'post-new.php', 'edit.php'), true)) {
        return;
    }

    if (in_array($hook, array('post.php', 'post-new.php'), true)) {
        wp_enqueue_media();
    }

    $script_dependencies = array('jquery', 'wp-util');
    if ($hook === 'edit.php') {
        $script_dependencies[] = 'inline-edit-post';
    }

    wp_enqueue_script(
        'sducraft-modpack-admin',
        get_stylesheet_directory_uri() . '/js/modpack-admin.js',
        $script_dependencies,
        wp_get_theme()->get('Version'),
        true
    );
    wp_enqueue_style(
        'sducraft-modpack-admin',
        get_stylesheet_directory_uri() . '/css/modpack-admin.css',
        array(),
        wp_get_theme()->get('Version')
    );
}
add_action('admin_enqueue_scripts', 'sducraft_enqueue_modpack_admin_assets');

function sducraft_enqueue_modpack_assets() {
    if (!is_page_template('user/page-game-download.php') && !is_singular(SDUCRAFT_MODPACK_POST_TYPE)) {
        return;
    }

    wp_enqueue_style(
        'sducraft-modpack',
        get_stylesheet_directory_uri() . '/css/modpack.css',
        array('sakurairo-child-style'),
        wp_get_theme()->get('Version')
    );
}
add_action('wp_enqueue_scripts', 'sducraft_enqueue_modpack_assets', 30);

function sducraft_get_modpack_data($post_id = 0) {
    $post_id = $post_id ?: get_the_ID();
    $status_key = get_post_meta($post_id, '_sducraft_modpack_status', true) ?: 'maintained';
    $statuses = sducraft_modpack_statuses();
    $downloads = get_post_meta($post_id, '_sducraft_modpack_downloads', true);

    return array(
        'minecraft_version' => get_post_meta($post_id, '_sducraft_modpack_minecraft_version', true),
        'modpack_version'   => get_post_meta($post_id, '_sducraft_modpack_modpack_version', true),
        'author'            => sducraft_get_modpack_field($post_id, 'author'),
        'status'            => $status_key,
        'status_label'      => $statuses[$status_key] ?? $statuses['maintained'],
        'summary'           => get_post_meta($post_id, '_sducraft_modpack_summary', true),
        'downloads'         => is_array($downloads) ? $downloads : array(),
    );
}

function sducraft_get_modpack_field($post_id, $field) {
    return get_post_meta($post_id, '_sducraft_modpack_' . $field, true);
}

function sducraft_get_modpack_page_url() {
    $pages = get_posts(array(
        'post_type'      => 'page',
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'meta_key'       => '_wp_page_template',
        'meta_value'     => 'user/page-game-download.php',
        'fields'         => 'ids',
        'no_found_rows'  => true,
    ));

    return $pages ? get_permalink($pages[0]) : home_url('/game-download/');
}

function sducraft_get_download_size($download) {
    $attachment_id = absint($download['attachment_id'] ?? 0);
    if (!$attachment_id) {
        return '';
    }

    $path = get_attached_file($attachment_id);
    return $path && is_file($path) ? size_format(filesize($path)) : '';
}

function sducraft_modpack_admin_columns($columns) {
    return array(
        'cb'                => $columns['cb'],
        'title'             => '整合包名称',
        'minecraft_version' => 'Minecraft',
        'modpack_version'   => '整合包版本',
        'modpack_status'    => '状态',
        'date'              => $columns['date'],
    );
}
add_filter('manage_' . SDUCRAFT_MODPACK_POST_TYPE . '_posts_columns', 'sducraft_modpack_admin_columns');

function sducraft_render_modpack_admin_column($column, $post_id) {
    if ($column === 'minecraft_version') {
        echo esc_html(get_post_meta($post_id, '_sducraft_modpack_minecraft_version', true) ?: '—');
    } elseif ($column === 'modpack_version') {
        echo esc_html(get_post_meta($post_id, '_sducraft_modpack_modpack_version', true) ?: '—');
    } elseif ($column === 'modpack_status') {
        $status = get_post_meta($post_id, '_sducraft_modpack_status', true) ?: 'maintained';
        $statuses = sducraft_modpack_statuses();
        echo esc_html($statuses[$status] ?? $statuses['maintained']);
        printf(
            '<span class="sducraft-modpack-quick-data" hidden data-minecraft-version="%s" data-modpack-version="%s" data-author="%s" data-status="%s"></span>',
            esc_attr(sducraft_get_modpack_field($post_id, 'minecraft_version')),
            esc_attr(sducraft_get_modpack_field($post_id, 'modpack_version')),
            esc_attr(sducraft_get_modpack_field($post_id, 'author')),
            esc_attr($status)
        );
    }
}
add_action('manage_' . SDUCRAFT_MODPACK_POST_TYPE . '_posts_custom_column', 'sducraft_render_modpack_admin_column', 10, 2);

function sducraft_modpack_quick_edit_fields($column, $post_type) {
    if ($post_type !== SDUCRAFT_MODPACK_POST_TYPE || $column !== 'modpack_status') {
        return;
    }
    ?>
    <fieldset class="sducraft-modpack-quick-edit">
        <div class="inline-edit-col">
            <div class="inline-edit-group wp-clearfix">
                <strong class="inline-edit-group-title">整合包信息</strong>
                <?php wp_nonce_field('sducraft_quick_edit_modpack', 'sducraft_modpack_quick_nonce', false); ?>
                <label><span class="title">Minecraft 版本</span><span class="input-text-wrap"><input type="text" name="sducraft_quick[minecraft_version]"></span></label>
                <label><span class="title">整合包版本</span><span class="input-text-wrap"><input type="text" name="sducraft_quick[modpack_version]"></span></label>
                <label><span class="title">作者</span><span class="input-text-wrap"><input type="text" name="sducraft_quick[author]"></span></label>
                <label>
                    <span class="title">整合包状态</span>
                    <select name="sducraft_quick[status]">
                        <?php foreach (sducraft_modpack_statuses() as $value => $label) : ?>
                            <option value="<?php echo esc_attr($value); ?>"><?php echo esc_html($label); ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
            </div>
        </div>
    </fieldset>
    <?php
}
add_action('quick_edit_custom_box', 'sducraft_modpack_quick_edit_fields', 10, 2);

function sducraft_save_modpack_quick_edit($post_id) {
    if (!isset($_POST['sducraft_modpack_quick_nonce']) ||
        !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['sducraft_modpack_quick_nonce'])), 'sducraft_quick_edit_modpack') ||
        !current_user_can('edit_post', $post_id)) {
        return;
    }

    $quick = isset($_POST['sducraft_quick']) && is_array($_POST['sducraft_quick'])
        ? wp_unslash($_POST['sducraft_quick'])
        : array();

    foreach (array('minecraft_version', 'modpack_version', 'author') as $key) {
        if (array_key_exists($key, $quick)) {
            update_post_meta($post_id, '_sducraft_modpack_' . $key, sanitize_text_field($quick[$key]));
        }
    }

    if (isset($quick['status'])) {
        $statuses = sducraft_modpack_statuses();
        $status = sanitize_key($quick['status']);
        if (isset($statuses[$status])) {
            update_post_meta($post_id, '_sducraft_modpack_status', $status);
            update_post_meta($post_id, '_sducraft_modpack_status_order', sducraft_modpack_status_order($status));
        }
    }
}
add_action('save_post_' . SDUCRAFT_MODPACK_POST_TYPE, 'sducraft_save_modpack_quick_edit', 20);

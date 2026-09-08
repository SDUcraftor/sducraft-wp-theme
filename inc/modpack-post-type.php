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
        'pinned'   => '置顶',
        'normal'   => '普通',
        'archived' => '已归档',
    );
}

function sducraft_normalize_modpack_status($status) {
    $status = sanitize_key((string) $status);
    return isset(sducraft_modpack_statuses()[$status]) ? $status : 'normal';
}

function sducraft_modpack_status_order($status) {
    $status = sducraft_normalize_modpack_status($status);
    return array(
        'pinned'   => 1,
        'normal'   => 2,
        'archived' => 3,
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
    $status = sducraft_normalize_modpack_status(get_post_meta($post->ID, '_sducraft_modpack_status', true));
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
                    <option value="<?php echo esc_attr($value); ?>" <?php selected($status, $value); ?>><?php echo esc_html($label); ?></option>
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

function sducraft_modpack_platforms() {
    return array(
        'windows'   => 'Windows',
        'linux'     => 'Linux',
        'macos'     => 'macOS',
        'android'   => 'Android',
        'universal' => '全平台',
        'other'     => '其他',
    );
}

function sducraft_render_modpack_download_row($index, $download) {
    $download = wp_parse_args($download, array(
        'label'         => '',
        'platform'      => 'windows',
        'platform_custom' => '',
        'architecture'  => '',
        'url'           => '',
        'attachment_id' => 0,
    ));
    $prefix = 'sducraft_modpack_downloads[' . $index . ']';
    $platforms = sducraft_modpack_platforms();
    $platform = isset($platforms[$download['platform']]) ? $download['platform'] : 'other';
    $platform_custom = $download['platform_custom'];
    if ($platform === 'other' && !$platform_custom && !isset($platforms[$download['platform']])) {
        $platform_custom = $download['platform'];
    }
    ?>
    <div class="sducraft-download-row">
        <div class="sducraft-download-row__fields">
            <p><label>按钮文字<input type="text" name="<?php echo esc_attr($prefix); ?>[label]" value="<?php echo esc_attr($download['label']); ?>" placeholder="例如：Windows 客户端下载"></label></p>
            <p class="sducraft-platform-field">
                <label>平台
                    <select class="sducraft-platform-select" name="<?php echo esc_attr($prefix); ?>[platform]">
                        <?php foreach ($platforms as $value => $label) : ?>
                            <option value="<?php echo esc_attr($value); ?>" <?php selected($platform, $value); ?>><?php echo esc_html($label); ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
                <input class="sducraft-platform-custom" type="text" name="<?php echo esc_attr($prefix); ?>[platform_custom]" value="<?php echo esc_attr($platform_custom); ?>" placeholder="填写平台名称" <?php echo $platform === 'other' ? '' : 'hidden'; ?>>
            </p>
            <p><label>架构<input type="text" name="<?php echo esc_attr($prefix); ?>[architecture]" value="<?php echo esc_attr($download['architecture']); ?>" placeholder="x86_64/ARM64/..."></label></p>
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
    $status = sanitize_key($details['status'] ?? 'normal');
    update_post_meta($post_id, '_sducraft_modpack_status', isset($statuses[$status]) ? $status : 'normal');
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

        $platforms = sducraft_modpack_platforms();
        $platform = sanitize_key($download['platform'] ?? 'windows');
        if (!isset($platforms[$platform])) {
            $platform = 'other';
        }

        $clean_downloads[] = array(
            'label'         => sanitize_text_field($download['label'] ?? ''),
            'platform'      => $platform,
            'platform_custom' => $platform === 'other' ? sanitize_text_field($download['platform_custom'] ?? '') : '',
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

    if (is_page_template('user/page-game-download.php')) {
        wp_enqueue_script(
            'sducraft-modpack-page',
            get_stylesheet_directory_uri() . '/js/modpack-page.js',
            array(),
            wp_get_theme()->get('Version'),
            true
        );
        wp_localize_script('sducraft-modpack-page', 'sducraftModpackPage', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('sducraft_load_modpacks'),
            'loading' => '正在加载…',
            'error'   => '加载失败，请重试',
        ));
    }
}
add_action('wp_enqueue_scripts', 'sducraft_enqueue_modpack_assets', 30);

function sducraft_add_modpack_page_meta_box($post) {
    if (get_page_template_slug($post) !== 'user/page-game-download.php') {
        return;
    }

    add_meta_box(
        'sducraft-modpack-page-settings',
        '整合包展示设置',
        'sducraft_render_modpack_page_meta_box',
        'page',
        'side',
        'default'
    );
}
add_action('add_meta_boxes_page', 'sducraft_add_modpack_page_meta_box');

function sducraft_render_modpack_page_meta_box($post) {
    wp_nonce_field('sducraft_save_modpack_page', 'sducraft_modpack_page_nonce');
    ?>
    <p>
        <label for="sducraft-modpack-per-page"><strong>每批展示数</strong></label>
    </p>
    <p>
        <input id="sducraft-modpack-per-page" type="number" min="1" max="50" step="1"
            name="sducraft_modpack_per_page" value="<?php echo esc_attr(sducraft_get_modpack_per_page($post->ID)); ?>">
    </p>
    <p class="description">页面首次展示的数量，也是每次点击“继续查看”后追加的数量。</p>
    <?php
}

function sducraft_save_modpack_page_settings($post_id) {
    if (!isset($_POST['sducraft_modpack_page_nonce']) ||
        !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['sducraft_modpack_page_nonce'])), 'sducraft_save_modpack_page') ||
        (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) ||
        !current_user_can('edit_post', $post_id)) {
        return;
    }

    $per_page = absint($_POST['sducraft_modpack_per_page'] ?? 6);
    update_post_meta($post_id, '_sducraft_modpack_per_page', min(50, max(1, $per_page)));
}
add_action('save_post_page', 'sducraft_save_modpack_page_settings');

function sducraft_get_modpack_per_page($page_id) {
    $per_page = absint(get_post_meta($page_id, '_sducraft_modpack_per_page', true));
    return $per_page ? min(50, $per_page) : 6;
}

function sducraft_get_ordered_modpacks() {
    $query = new WP_Query(array(
        'post_type'              => SDUCRAFT_MODPACK_POST_TYPE,
        'post_status'            => 'publish',
        'posts_per_page'         => -1,
        'orderby'                => 'date',
        'order'                  => 'DESC',
        'no_found_rows'          => true,
        'update_post_term_cache' => false,
    ));
    $posts = $query->posts;

    usort($posts, function ($left, $right) {
        $left_status = get_post_meta($left->ID, '_sducraft_modpack_status', true);
        $right_status = get_post_meta($right->ID, '_sducraft_modpack_status', true);
        $status_difference = sducraft_modpack_status_order($left_status) - sducraft_modpack_status_order($right_status);

        return $status_difference !== 0
            ? $status_difference
            : strcmp($right->post_date, $left->post_date);
    });

    return $posts;
}

function sducraft_render_modpack_cards($posts, $first_image_eager = false) {
    if (!$posts) {
        return '';
    }

    global $post;
    ob_start();
    foreach (array_values($posts) as $index => $modpack_post) {
        $post = $modpack_post;
        setup_postdata($post);
        get_template_part('template-parts/modpack', 'card', array(
            'image_loading' => $first_image_eager && $index === 0 ? 'eager' : 'lazy',
        ));
    }
    wp_reset_postdata();

    return ob_get_clean();
}

function sducraft_load_modpacks() {
    check_ajax_referer('sducraft_load_modpacks', 'nonce');

    $page_id = absint($_POST['page_id'] ?? 0);
    $offset = max(0, absint($_POST['offset'] ?? 0));
    if (!$page_id || get_post_status($page_id) !== 'publish' || get_page_template_slug($page_id) !== 'user/page-game-download.php') {
        wp_send_json_error(array('message' => '无效的整合包页面。'), 400);
    }

    $per_page = sducraft_get_modpack_per_page($page_id);
    $modpacks = sducraft_get_ordered_modpacks();
    $batch = array_slice($modpacks, $offset, $per_page);
    $next_offset = $offset + count($batch);

    wp_send_json_success(array(
        'html'        => sducraft_render_modpack_cards($batch),
        'next_offset' => $next_offset,
        'has_more'    => $next_offset < count($modpacks),
    ));
}
add_action('wp_ajax_sducraft_load_modpacks', 'sducraft_load_modpacks');
add_action('wp_ajax_nopriv_sducraft_load_modpacks', 'sducraft_load_modpacks');

function sducraft_get_modpack_data($post_id = 0) {
    $post_id = $post_id ?: get_the_ID();
    $status_key = sducraft_normalize_modpack_status(get_post_meta($post_id, '_sducraft_modpack_status', true));
    $statuses = sducraft_modpack_statuses();
    $downloads = get_post_meta($post_id, '_sducraft_modpack_downloads', true);

    return array(
        'minecraft_version' => get_post_meta($post_id, '_sducraft_modpack_minecraft_version', true),
        'modpack_version'   => get_post_meta($post_id, '_sducraft_modpack_modpack_version', true),
        'author'            => sducraft_get_modpack_field($post_id, 'author'),
        'status'            => $status_key,
        'status_label'      => $statuses[$status_key] ?? $statuses['normal'],
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
    return $path && is_file($path) ? size_format(filesize($path), 2) : '';
}

function sducraft_get_download_platform_label($download) {
    $platforms = sducraft_modpack_platforms();
    $platform = $download['platform'] ?? '';

    if ($platform === 'other') {
        return trim((string) ($download['platform_custom'] ?? '')) ?: $platforms['other'];
    }

    return $platforms[$platform] ?? (string) $platform;
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
        $status = sducraft_normalize_modpack_status(get_post_meta($post_id, '_sducraft_modpack_status', true));
        $statuses = sducraft_modpack_statuses();
        echo esc_html($statuses[$status] ?? $statuses['normal']);
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

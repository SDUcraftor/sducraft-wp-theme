<?php
/**
 * 分类文章卡片短代码及异步加载。
 */

if (!defined('ABSPATH')) {
    exit;
}

function sducraft_resolve_category_ids($category_list) {
    $items = preg_split('/[,，]/u', (string) $category_list, -1, PREG_SPLIT_NO_EMPTY);
    $category_ids = array();

    foreach ($items as $item) {
        $item = trim($item);
        if ($item === '') {
            continue;
        }

        $term = ctype_digit($item)
            ? get_term(absint($item), 'category')
            : get_term_by('slug', sanitize_title($item), 'category');
        if (!$term && !ctype_digit($item)) {
            $term = get_term_by('name', $item, 'category');
        }
        if ($term instanceof WP_Term && !is_wp_error($term)) {
            $category_ids[] = $term->term_id;
        }
    }

    return array_values(array_unique(array_map('absint', $category_ids)));
}

function sducraft_category_posts_query($category_ids, $number, $offset = 0) {
    $args = array(
        'post_type'           => 'post',
        'post_status'         => 'publish',
        'posts_per_page'      => $number,
        'offset'              => $offset,
        'orderby'             => 'date',
        'order'               => 'DESC',
        'ignore_sticky_posts' => true,
    );
    if ($category_ids) {
        $args['category__in'] = $category_ids;
    }

    return new WP_Query($args);
}

function sducraft_render_category_post_cards($posts) {
    if (!$posts) {
        return '';
    }

    global $post;
    ob_start();
    foreach ($posts as $category_post) {
        $post = $category_post;
        setup_postdata($post);
        get_template_part('tpl/content', 'thumbcard');
    }
    wp_reset_postdata();

    return ob_get_clean();
}

function sducraft_category_posts_shortcode($atts) {
    $atts = shortcode_atts(array('name' => '', 'number' => 6), $atts, 'cat_posts');
    $number = min(30, max(1, absint($atts['number'])));
    $category_ids = sducraft_resolve_category_ids($atts['name']);
    if (trim((string) $atts['name']) !== '' && !$category_ids) {
        return '<p class="sducraft-category-posts__empty">没有找到指定分类。</p>';
    }

    $query = sducraft_category_posts_query($category_ids, $number);
    if (!$query->have_posts()) {
        return '<p class="sducraft-category-posts__empty">这个分类目前还没有文章。</p>';
    }

    wp_enqueue_script('sducraft-category-posts');
    $instance_id = wp_unique_id('sducraft-category-posts-');
    $shown = count($query->posts);
    ob_start();
    ?>
    <div class="sducraft-category-posts" id="<?php echo esc_attr($instance_id); ?>">
        <div class="sducraft-category-posts__list">
            <?php echo sducraft_render_category_post_cards($query->posts); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Rendered by the theme template. ?>
        </div>
        <?php if ($shown < $query->found_posts) : ?>
            <div class="sducraft-category-posts__more">
                <button type="button" class="sducraft-category-posts__button"
                    data-category-ids="<?php echo esc_attr(implode(',', $category_ids)); ?>"
                    data-number="<?php echo esc_attr($number); ?>"
                    data-offset="<?php echo esc_attr($shown); ?>">
                    <i class="fa-solid fa-angle-down" aria-hidden="true"></i><span>继续查看</span>
                </button>
                <span class="screen-reader-text sducraft-category-posts__status" aria-live="polite"></span>
            </div>
        <?php endif; ?>
    </div>
    <?php

    return ob_get_clean();
}
add_shortcode('cat_posts', 'sducraft_category_posts_shortcode');

function sducraft_load_category_posts() {
    check_ajax_referer('sducraft_load_category_posts', 'nonce');
    $category_ids = array_values(array_filter(array_map('absint', explode(',', sanitize_text_field(wp_unslash($_POST['category_ids'] ?? ''))))));
    $number = min(30, max(1, absint($_POST['number'] ?? 6)));
    $offset = max(0, absint($_POST['offset'] ?? 0));
    $query = sducraft_category_posts_query($category_ids, $number, $offset);
    $next_offset = $offset + count($query->posts);

    wp_send_json_success(array(
        'html'        => sducraft_render_category_post_cards($query->posts),
        'next_offset' => $next_offset,
        'has_more'    => $next_offset < $query->found_posts,
    ));
}
add_action('wp_ajax_sducraft_load_category_posts', 'sducraft_load_category_posts');
add_action('wp_ajax_nopriv_sducraft_load_category_posts', 'sducraft_load_category_posts');

add_action('wp_enqueue_scripts', function () {
    $script_path = get_stylesheet_directory() . '/js/category-posts.js';
    wp_register_script(
        'sducraft-category-posts',
        get_stylesheet_directory_uri() . '/js/category-posts.js',
        array(),
        is_file($script_path) ? (string) filemtime($script_path) : wp_get_theme()->get('Version'),
        true
    );
    wp_localize_script('sducraft-category-posts', 'sducraftCategoryPosts', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('sducraft_load_category_posts'),
        'loading' => '正在加载…',
        'error'   => '加载失败，请重试',
    ));
}, 20);

<?php
/**
 * Announcement page template support.
 *
 * @package SduCraft
 */

if (!defined('ABSPATH')) {
    exit;
}

const IRO_ANNOUNCEMENT_CATEGORY_META = '_iro_announcement_category';
const IRO_ANNOUNCEMENT_TEMPLATE = 'user/page-announcement.php';

/**
 * Add the category selector used by the announcement page template.
 */
function iro_add_announcement_category_meta_box() {
    add_meta_box(
        'iro-announcement-category',
        __('公告分类', 'sakurairo'),
        'iro_render_announcement_category_meta_box',
        'page',
        'side',
        'default'
    );
}
add_action('add_meta_boxes_page', 'iro_add_announcement_category_meta_box');

/**
 * Render the announcement category selector.
 *
 * @param WP_Post $post Current page.
 */
function iro_render_announcement_category_meta_box($post) {
    $selected = absint(get_post_meta($post->ID, IRO_ANNOUNCEMENT_CATEGORY_META, true));

    wp_nonce_field('iro_save_announcement_category', 'iro_announcement_category_nonce');
    echo '<p>' . esc_html__('仅供“公告页面模板”使用，并会自动包含所选分类的全部子分类。', 'sakurairo') . '</p>';
    wp_dropdown_categories(array(
        'show_option_none' => __('请选择分类', 'sakurairo'),
        'option_none_value' => '0',
        'hide_empty'       => false,
        'hierarchical'     => true,
        'name'             => 'iro_announcement_category',
        'id'               => 'iro-announcement-category-select',
        'selected'         => $selected,
        'class'            => 'widefat',
    ));
}

/**
 * Save the announcement category selected for a page.
 *
 * @param int $post_id Page ID.
 */
function iro_save_announcement_category_meta_box($post_id) {
    if (!isset($_POST['iro_announcement_category_nonce'])) {
        return;
    }

    $nonce = sanitize_text_field(wp_unslash($_POST['iro_announcement_category_nonce']));
    if (!wp_verify_nonce($nonce, 'iro_save_announcement_category')) {
        return;
    }

    if ((defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) || wp_is_post_revision($post_id)) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $category_id = isset($_POST['iro_announcement_category'])
        ? absint($_POST['iro_announcement_category'])
        : 0;

    if ($category_id && term_exists($category_id, 'category')) {
        update_post_meta($post_id, IRO_ANNOUNCEMENT_CATEGORY_META, $category_id);
    } else {
        delete_post_meta($post_id, IRO_ANNOUNCEMENT_CATEGORY_META);
    }
}
add_action('save_post_page', 'iro_save_announcement_category_meta_box');

/**
 * Return the selected category and all of its descendants.
 *
 * @param int $category_id Parent category ID.
 * @return int[]
 */
function iro_get_announcement_category_ids($category_id) {
    $category_id = absint($category_id);
    if (!$category_id || !term_exists($category_id, 'category')) {
        return array();
    }

    $children = get_term_children($category_id, 'category');
    if (is_wp_error($children)) {
        $children = array();
    }

    return array_values(array_unique(array_merge(array($category_id), array_map('absint', $children))));
}

/**
 * Determine an announcement's display group.
 *
 * Lower values appear first. Important intentionally wins over every other
 * state, including archived. Sticky wins over archived when both are present.
 *
 * @param WP_Post $post Announcement post.
 * @return int
 */
function iro_get_announcement_priority($post) {
    if (has_term('important', 'post_tag', $post)) {
        return 0;
    }

    if (is_sticky($post->ID)) {
        return 1;
    }

    if (has_term('archived', 'post_tag', $post)) {
        return 3;
    }

    return 2;
}

/**
 * Fetch and order announcements for a category tree.
 *
 * @param int $category_id Selected parent category.
 * @return WP_Post[]
 */
function iro_get_announcement_posts($category_id) {
    $category_ids = iro_get_announcement_category_ids($category_id);
    if (!$category_ids) {
        return array();
    }

    $query = new WP_Query(array(
        'post_type'           => 'post',
        'post_status'         => 'publish',
        'posts_per_page'      => -1,
        'category__in'        => $category_ids,
        'ignore_sticky_posts' => true,
        'has_password'        => false,
        'orderby'             => array('date' => 'DESC', 'ID' => 'DESC'),
        'no_found_rows'       => true,
    ));

    $posts = $query->posts;
    usort($posts, function ($left, $right) {
        $priority_comparison = iro_get_announcement_priority($left) <=> iro_get_announcement_priority($right);
        if (0 !== $priority_comparison) {
            return $priority_comparison;
        }

        $date_comparison = strcmp($right->post_date_gmt, $left->post_date_gmt);
        return 0 !== $date_comparison ? $date_comparison : ($right->ID <=> $left->ID);
    });

    return $posts;
}

/**
 * Return the presentation state for an announcement.
 *
 * @param WP_Post $post Announcement post.
 * @return string
 */
function iro_get_announcement_state($post) {
    $priority = iro_get_announcement_priority($post);
    $states = array(
        0 => 'important',
        1 => 'sticky',
        2 => 'normal',
        3 => 'archived',
    );

    return $states[$priority];
}

/**
 * Render a post's content with the same filters used on normal post pages.
 *
 * @param WP_Post $announcement Announcement post.
 * @return string
 */
function iro_render_announcement_content($announcement) {
    global $post;

    $previous_post = $post;
    $post = $announcement;
    setup_postdata($post);
    $content = apply_filters('the_content', $announcement->post_content);
    wp_reset_postdata();
    $post = $previous_post;

    return $content;
}

/**
 * Public REST response used when switching announcements without a page load.
 *
 * @param WP_REST_Request $request REST request.
 * @return WP_REST_Response|WP_Error
 */
function iro_get_announcement_rest_response(WP_REST_Request $request) {
    $post_id = absint($request['id']);
    $page_id = absint($request->get_param('page_id'));
    $announcement = get_post($post_id);
    $page = get_post($page_id);

    if (!$announcement || 'post' !== $announcement->post_type || 'publish' !== $announcement->post_status || !empty($announcement->post_password)) {
        return new WP_Error('iro_announcement_not_found', __('未找到该公告。', 'sakurairo'), array('status' => 404));
    }

    if (!$page || 'page' !== $page->post_type || IRO_ANNOUNCEMENT_TEMPLATE !== get_page_template_slug($page_id)) {
        return new WP_Error('iro_announcement_page_not_found', __('未找到对应的公告页面。', 'sakurairo'), array('status' => 404));
    }

    $category_id = absint(get_post_meta($page_id, IRO_ANNOUNCEMENT_CATEGORY_META, true));
    $category_ids = iro_get_announcement_category_ids($category_id);
    if (!$category_ids || !has_category($category_ids, $announcement)) {
        return new WP_Error('iro_announcement_outside_category', __('该文章不属于此页面选择的公告分类。', 'sakurairo'), array('status' => 404));
    }

    return rest_ensure_response(array(
        'id'        => $announcement->ID,
        'title'     => get_the_title($announcement),
        'date'      => get_the_date(get_option('date_format'), $announcement),
        'datetime'  => get_post_time(DATE_W3C, false, $announcement),
        'content'   => iro_render_announcement_content($announcement),
        'permalink' => get_permalink($announcement),
    ));
}

/** Register the announcement REST endpoint. */
function iro_register_announcement_rest_route() {
    register_rest_route('sakura/v1', '/announcement/(?P<id>\d+)', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'iro_get_announcement_rest_response',
        'permission_callback' => '__return_true',
        'args'                => array(
            'id' => array(
                'validate_callback' => function ($value) {
                    return absint($value) > 0;
                },
            ),
            'page_id' => array(
                'required'          => true,
                'validate_callback' => function ($value) {
                    return absint($value) > 0;
                },
            ),
        ),
    ));
}
add_action('rest_api_init', 'iro_register_announcement_rest_route');

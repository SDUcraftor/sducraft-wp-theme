<?php

if (!defined('ABSPATH')) {
    exit;
}

function sducraft_get_timeline_items() {
    $category = sducraft_timeline_category();
    if (!$category) return array();
    $posts = get_posts(array(
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'cat' => $category,
        'orderby' => 'date',
        'order' => 'DESC',
        'no_found_rows' => true,
    ));
    if (!$posts) {
        return array();
    }
    return array_map(function ($post) {
        $thumbnail_id = get_post_thumbnail_id($post->ID);
        $thumbnail = $thumbnail_id ? wp_get_attachment_image_src($thumbnail_id, 'large') : false;
        $featured_image = $thumbnail ? array(
            'url' => $thumbnail[0],
            'width' => $thumbnail[1],
            'height' => $thumbnail[2],
            'name' => get_post_meta($thumbnail_id, '_wp_attachment_image_alt', true)
                ?: wp_get_attachment_caption($thumbnail_id)
                ?: get_the_title($post),
        ) : null;
        $summary = trim($post->post_excerpt);
        if ($summary === '') {
            $summary = wp_trim_words(wp_strip_all_tags(strip_shortcodes($post->post_content)), 45, '…');
        }
        return array(
            'id' => $post->ID,
            'year' => get_post_meta($post->ID, '_sducraft_event_date', true) ?: get_the_date('Y-m-d', $post),
            'slug' => $post->post_name,
            'title' => get_the_title($post),
            'summary' => $summary,
            'content' => $post->post_content,
            'content_html' => apply_filters('the_content', $post->post_content),
            'featured_image' => $featured_image,
        );
    }, $posts);
}

function sducraft_enqueue_timeline_assets() {
    if (!sducraft_timeline_category() || !is_category(sducraft_timeline_category())) {
        return;
    }

    $directory = get_stylesheet_directory();
    $uri = get_stylesheet_directory_uri();
    wp_enqueue_style('sducraft-timeline', $uri . '/css/timeline.css', array(), filemtime($directory . '/css/timeline.css'));
    wp_enqueue_script('sducraft-timeline', $uri . '/js/timeline.js', array(), max(filemtime($directory . '/js/timeline.js'), filemtime($directory . '/js/timeline-world.js')), true);
    wp_localize_script('sducraft-timeline', 'sducraftTimelineAssets', array(
        'base' => $uri,
        'three' => $uri . '/js/vendor/three-r160/three.module.min.js',
        'loader' => $uri . '/js/vendor/three-r160/GLTFLoader.js',
    ));
}
add_action('wp_enqueue_scripts', 'sducraft_enqueue_timeline_assets', 30);

add_filter('category_template', function ($template) {
    $category = sducraft_timeline_category();
    return $category && is_category($category)
        ? get_stylesheet_directory() . '/template-parts/timeline-page.php'
        : $template;
});

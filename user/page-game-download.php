<?php
/**
 * Template Name: 游戏下载页面模板
 *
 * @package SDUcraft
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

while (have_posts()) :
    the_post();

    $modpack_page_title = get_the_title();
    $modpack_page_intro = trim((string) get_the_content());
    $modpack_query = new WP_Query(array(
        'post_type'              => SDUCRAFT_MODPACK_POST_TYPE,
        'post_status'            => 'publish',
        'posts_per_page'         => -1,
        'orderby'                => 'date',
        'order'                  => 'DESC',
        'no_found_rows'          => true,
        'update_post_term_cache' => false,
    ));

    if ($modpack_query->posts) {
        usort($modpack_query->posts, function ($left, $right) {
            $left_status = get_post_meta($left->ID, '_sducraft_modpack_status', true);
            $right_status = get_post_meta($right->ID, '_sducraft_modpack_status', true);
            $status_difference = sducraft_modpack_status_order($left_status) - sducraft_modpack_status_order($right_status);

            if ($status_difference !== 0) {
                return $status_difference;
            }

            return strcmp($right->post_date, $left->post_date);
        });
    }
    ?>
    <div id="primary" class="content-area modpack-archive">
        <main id="main" class="site-main" role="main">
            <header class="modpack-page-header">
                <div>
                    <span class="modpack-page-header__eyebrow">SDUCRAFT DOWNLOADS</span>
                    <h1><?php echo esc_html($modpack_page_title); ?></h1>
                </div>
                <?php if ($modpack_page_intro) : ?>
                    <div class="modpack-page-header__intro"><?php echo apply_filters('the_content', $modpack_page_intro); ?></div>
                <?php else : ?>
                    <p>选择适合你设备的客户端或整合包版本。</p>
                <?php endif; ?>
            </header>

            <?php if ($modpack_query->have_posts()) : ?>
                <div class="modpack-list">
                    <?php while ($modpack_query->have_posts()) : $modpack_query->the_post(); ?>
                        <?php get_template_part('template-parts/modpack', 'card'); ?>
                    <?php endwhile; ?>
                </div>
            <?php else : ?>
                <div class="modpack-empty">目前还没有可供下载的整合包。</div>
            <?php endif; ?>
        </main>
    </div>
    <?php
    wp_reset_postdata();
endwhile;

get_footer();

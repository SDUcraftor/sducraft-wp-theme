<?php
/*
 * Template Name: 公告页面模板
 *
 * @package Sakurairo
 */

if (!defined('ABSPATH')) {
    exit;
}

$announcement_css = get_stylesheet_directory() . '/css/announcement-page.css';
$announcement_js = get_stylesheet_directory() . '/js/announcement-page.js';

wp_enqueue_style(
    'iro-announcement-page',
    get_stylesheet_directory_uri() . '/css/announcement-page.css',
    array(),
    file_exists($announcement_css) ? (string) filemtime($announcement_css) : IRO_VERSION
);
wp_enqueue_script(
    'iro-announcement-page',
    get_stylesheet_directory_uri() . '/js/announcement-page.js',
    array(),
    file_exists($announcement_js) ? (string) filemtime($announcement_js) : IRO_VERSION,
    true
);

get_header();

while (have_posts()) :
    the_post();

    $announcement_page_id = get_the_ID();
    $announcement_category_id = absint(get_post_meta($announcement_page_id, IRO_ANNOUNCEMENT_CATEGORY_META, true));
    $announcements = iro_get_announcement_posts($announcement_category_id);
    $selected_announcement = $announcements ? $announcements[0] : null;
    $requested_announcement_id = isset($_GET['announcement']) ? absint(wp_unslash($_GET['announcement'])) : 0;

    if ($requested_announcement_id) {
        foreach ($announcements as $announcement) {
            if ($requested_announcement_id === $announcement->ID) {
                $selected_announcement = $announcement;
                break;
            }
        }
    }

    $selected_announcement_id = $selected_announcement ? $selected_announcement->ID : 0;
    ?>
    <main
        id="iro-announcement-app"
        class="announcement-layout"
        data-announcement-app
        data-page-id="<?php echo esc_attr($announcement_page_id); ?>"
        data-endpoint="<?php echo esc_url(rest_url('sakura/v1/announcement/')); ?>"
        data-selected-id="<?php echo esc_attr($selected_announcement_id); ?>"
    >
        <div class="announcement-drawer-backdrop" data-announcement-drawer-close hidden></div>

        <aside class="announcement-sidebar" aria-label="<?php esc_attr_e('公告列表', 'sakurairo'); ?>">
            <div class="announcement-sidebar-header">
                <span class="announcement-sidebar-heading">
                    <i class="fa-regular fa-rectangle-list" aria-hidden="true"></i>
                    <?php esc_html_e('公告列表', 'sakurairo'); ?>
                </span>
                <button class="announcement-drawer-close" type="button" data-announcement-drawer-close aria-label="<?php esc_attr_e('关闭公告列表', 'sakurairo'); ?>">
                    <i class="fa-solid fa-angles-left" aria-hidden="true"></i>
                </button>
            </div>

            <div class="announcement-list custom-scrollbar">
                <?php foreach ($announcements as $announcement) :
                    $state = iro_get_announcement_state($announcement);
                    $labels = array(
                        'important' => __('重要', 'sakurairo'),
                        'sticky'    => __('置顶', 'sakurairo'),
                        'archived'  => __('过期', 'sakurairo'),
                    );
                    $is_selected = $announcement->ID === $selected_announcement_id;
                    ?>
                    <button
                        type="button"
                        class="announcement-list-item announcement-state-<?php echo esc_attr($state); ?><?php echo $is_selected ? ' is-selected' : ''; ?>"
                        data-announcement-id="<?php echo esc_attr($announcement->ID); ?>"
                        aria-current="<?php echo $is_selected ? 'true' : 'false'; ?>"
						        title="<?php echo esc_html(get_the_title($announcement)); ?>"
                    >
                        <time datetime="<?php echo esc_attr(get_post_time(DATE_W3C, false, $announcement)); ?>">
                            <?php echo esc_html(get_the_date('Y-m-d', $announcement)); ?>
                        </time>
                        <span class="announcement-list-title"><?php echo esc_html(get_the_title($announcement)); ?></span>
                        <?php if (isset($labels[$state])) : ?>
                            <span class="announcement-badge"><?php echo esc_html($labels[$state]); ?></span>
                        <?php endif; ?>
                    </button>
                <?php endforeach; ?>
            </div>
        </aside>

        <section class="announcement-main" aria-live="polite" aria-busy="false">
            <div class="announcement-mobile-toolbar">
                <button type="button" class="announcement-drawer-open" data-announcement-drawer-open aria-expanded="false">
                    <i class="fa-regular fa-rectangle-list" aria-hidden="true"></i>
                    <?php esc_html_e('公告列表', 'sakurairo'); ?>
                </button>
            </div>

            <div class="announcement-loading" data-announcement-loading hidden>
                <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
                <span><?php esc_html_e('加载中…', 'sakurairo'); ?></span>
            </div>

            <div class="announcement-error" data-announcement-error hidden></div>

            <?php if ($selected_announcement) : ?>
                <article class="announcement-article" data-announcement-article>
                    <header class="announcement-article-header">
                        <h1 data-announcement-title><?php echo esc_html(get_the_title($selected_announcement)); ?></h1>
                        <time data-announcement-date datetime="<?php echo esc_attr(get_post_time(DATE_W3C, false, $selected_announcement)); ?>">
                            <?php echo esc_html(get_the_date(get_option('date_format'), $selected_announcement)); ?>
                        </time>
                    </header>
                    <div class="entry-content announcement-entry-content" data-announcement-content>
                        <?php echo iro_render_announcement_content($selected_announcement); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                    </div>
                </article>
            <?php else : ?>
                <div class="announcement-empty" data-announcement-empty>
                    <i class="fa-regular fa-folder-open" aria-hidden="true"></i>
                    <?php if (!$announcement_category_id) : ?>
                        <p><?php esc_html_e('尚未为此页面选择公告分类。', 'sakurairo'); ?></p>
                    <?php else : ?>
                        <p><?php esc_html_e('所选分类中暂无已发布的公告。', 'sakurairo'); ?></p>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </section>

        <aside class="announcement-toc" aria-label="<?php esc_attr_e('文章目录', 'sakurairo'); ?>">
            <div class="announcement-toc-heading"><?php esc_html_e('文章目录', 'sakurairo'); ?></div>
            <nav data-announcement-toc></nav>
        </aside>
    </main>
    <?php
endwhile;

get_footer();

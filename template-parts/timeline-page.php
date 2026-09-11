<?php
/** Category page selected explicitly by the timeline settings. */
if (!defined('ABSPATH')) exit;
$items = sducraft_get_timeline_items();
$assets = get_stylesheet_directory_uri() . '/assets';
get_header();
?>
<div id="primary" class="content-area sducraft-timeline-page"><main id="main" class="site-main">
    <?php if ($items) : ?>
        <?php require get_stylesheet_directory() . '/template-parts/timeline.php'; ?>
    <?php else : ?>
        <p class="mc-timeline-empty">时间线暂无文章。</p>
    <?php endif; ?>
</main></div>
<?php get_footer(); ?>

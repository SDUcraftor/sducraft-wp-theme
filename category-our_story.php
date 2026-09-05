<?php
if (!defined('ABSPATH')) exit;
$items = sducraft_get_timeline_items();
$assets = get_stylesheet_directory_uri() . '/assets/timeline';
get_header();
?>
<div id="primary" class="content-area sducraft-timeline-page"><main id="main" class="site-main">
    <?php require get_stylesheet_directory() . '/template-parts/timeline.php'; ?>
</main></div>
<?php get_footer(); ?>

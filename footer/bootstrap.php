<?php
/**
 * Minecraft footer integration for the SDUCraft child theme.
 */

defined('ABSPATH') || exit;

$sducraft_mc_easter_eggs_file = __DIR__ . '/easter-eggs.php';
if (is_file($sducraft_mc_easter_eggs_file)) {
    require_once $sducraft_mc_easter_eggs_file;
}

function sducraft_mc_footer_asset_version($relative_path) {
    $absolute_path = get_stylesheet_directory() . '/footer/' . ltrim($relative_path, '/');

    if (is_file($absolute_path)) {
        return (string) filemtime($absolute_path);
    }

    return (string) wp_get_theme()->get('Version');
}

function sducraft_mc_footer_enqueue_assets() {
    if (!is_front_page() || !sducraft_opt('footer_enabled', true)) {
        return;
    }

    wp_enqueue_style(
        'sducraft-mc-footer',
        get_stylesheet_directory_uri() . '/footer/mc-footer.css',
        array(),
        sducraft_mc_footer_asset_version('mc-footer.css')
    );

    wp_enqueue_script(
        'sducraft-mc-world',
        get_stylesheet_directory_uri() . '/footer/mc-world.js',
        array(),
        sducraft_mc_footer_asset_version('mc-world.js'),
        true
    );

    wp_localize_script('sducraft-mc-world', 'sducraftMCWorldData', array(
        'blocks' => sducraft_mc_blocks(),
    ));

    wp_enqueue_script(
        'sducraft-mc-footer',
        get_stylesheet_directory_uri() . '/footer/mc-footer.js',
        array('sducraft-mc-world'),
        sducraft_mc_footer_asset_version('mc-footer.js'),
        true
    );
}
add_action('wp_enqueue_scripts', 'sducraft_mc_footer_enqueue_assets', 30);

function sducraft_render_mc_footer() {
    if (!is_front_page() || !sducraft_opt('footer_enabled', true)) {
        return;
    }

    get_template_part('footer/mc-footer');
}
add_action('wp_footer', 'sducraft_render_mc_footer', 5);

function sducraft_mc_footer_body_class($classes) {
    if (is_front_page() && sducraft_opt('footer_enabled', true)) {
        $classes[] = 'sducraft-mc-footer-enabled';
    }

    return $classes;
}
add_filter('body_class', 'sducraft_mc_footer_body_class');

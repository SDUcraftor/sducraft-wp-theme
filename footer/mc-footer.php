<?php
/**
 * Minecraft interactive footer markup.
 */

defined('ABSPATH') || exit;

$mc_footer_defaults = array(
    'reveal_delay'      => 4000,
    'ignition_attempts' => 5,
    'scroll_threshold'  => 600,
);

$mc_footer_config = wp_parse_args(
    apply_filters('sducraft_mc_footer_config', $mc_footer_defaults),
    $mc_footer_defaults
);

$mc_footer_assets = trailingslashit(get_stylesheet_directory_uri()) . 'footer/assets/';
?>
<footer
    class="mc-footer"
    id="mc-footer"
    data-state="idle"
    data-assets-base="<?php echo esc_url($mc_footer_assets); ?>"
    data-reveal-delay="<?php echo esc_attr((string) absint($mc_footer_config['reveal_delay'])); ?>"
    data-ignition-attempts="<?php echo esc_attr((string) absint($mc_footer_config['ignition_attempts'])); ?>"
    data-scroll-threshold="<?php echo esc_attr((string) absint($mc_footer_config['scroll_threshold'])); ?>"
    aria-label="<?php echo esc_attr__('Minecraft interactive footer', 'sducraft'); ?>"
>
    <div class="mc-footer__surface" id="mc-surface">
        <div class="mc-footer__blocks" id="mc-surface-blocks" aria-hidden="true"></div>

        <button class="mc-tnt" id="mc-tnt" type="button" aria-label="<?php echo esc_attr__('Try to ignite the TNT', 'sducraft'); ?>" hidden>
            <img src="<?php echo esc_url($mc_footer_assets . 'blocks/tnt_side.png'); ?>" alt="" draggable="false">
            <span class="mc-tnt__spark" aria-hidden="true"></span>
        </button>

        <div class="mc-explosion" id="mc-explosion" aria-hidden="true"></div>
    </div>

    <section class="mc-underground" id="mc-underground" aria-label="<?php echo esc_attr__('Underground block world', 'sducraft'); ?>" aria-hidden="true">
        <div class="mc-underground__world" id="mc-world"></div>
    </section>

    <div class="mc-tool-cursor" id="mc-tool-cursor" aria-hidden="true">
        <img alt="" draggable="false">
    </div>

    <p class="mc-footer__status" id="mc-status" role="status" aria-live="polite"></p>
</footer>

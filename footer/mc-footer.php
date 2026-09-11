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

$mc_footer_easter_eggs = apply_filters('sducraft_mc_footer_easter_eggs', array());
if (!is_array($mc_footer_easter_eggs)) {
    $mc_footer_easter_eggs = array();
}

$mc_footer_easter_eggs = array_values(array_filter(
    $mc_footer_easter_eggs,
    static function ($egg) {
        return is_array($egg)
            && !empty($egg['id'])
            && isset($egg['x'], $egg['depth']);
    }
));

$mc_footer_easter_eggs = array_map(
    static function ($egg) {
        $egg['id'] = sanitize_key($egg['id']);
        return $egg;
    },
    $mc_footer_easter_eggs
);

$mc_footer_easter_eggs = array_values(array_filter(
    $mc_footer_easter_eggs,
    static function ($egg) {
        return $egg['id'] !== '';
    }
));

$mc_footer_easter_egg_data = array_map(
    static function ($egg) {
        unset($egg['render'], $egg['content']);
        return $egg;
    },
    $mc_footer_easter_eggs
);

$mc_footer_assets = trailingslashit(get_stylesheet_directory_uri()) . 'assets/minecraft/';
$mc_footer_default_easter_egg_sound = apply_filters(
    'sducraft_mc_footer_default_easter_egg_sound',
    $mc_footer_assets . 'audio/Mob.villager.yes2.wav.ogg'
);
?>
<footer
    class="mc-footer"
    id="mc-footer"
    data-state="idle"
    data-volume="<?php echo esc_attr(sducraft_opt('footer_sound', true) ? sducraft_setting_number('footer_volume', 68, 0, 100) / 100 : 0); ?>"
    data-assets-base="<?php echo esc_url($mc_footer_assets); ?>"
    data-home-url="<?php echo esc_url(home_url('/')); ?>"
    data-easter-eggs="<?php echo esc_attr(wp_json_encode($mc_footer_easter_egg_data)); ?>"
    data-default-easter-egg-sound="<?php echo esc_url((string) $mc_footer_default_easter_egg_sound); ?>"
    data-reveal-delay="<?php echo esc_attr((string) absint($mc_footer_config['reveal_delay'])); ?>"
    data-ignition-attempts="<?php echo esc_attr((string) absint($mc_footer_config['ignition_attempts'])); ?>"
    data-scroll-threshold="<?php echo esc_attr((string) absint($mc_footer_config['scroll_threshold'])); ?>"
    aria-label="<?php echo esc_attr__('Minecraft interactive footer', 'sducraft'); ?>"
>
    <div class="mc-footer__surface" id="mc-surface">
        <div class="mc-footer__blocks" id="mc-surface-blocks" aria-hidden="true"></div>

        <button class="mc-tnt" id="mc-tnt" type="button" aria-label="<?php echo esc_attr__('Try to ignite the TNT', 'sducraft'); ?>" hidden>
            <img src="<?php echo esc_url($mc_footer_assets . 'texture/block/tnt_side.png'); ?>" alt="" draggable="false">
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

    <div class="mc-easter-egg-dialogs">
        <?php foreach ($mc_footer_easter_eggs as $mc_footer_egg) : ?>
            <?php
            $mc_footer_egg_id = sanitize_key($mc_footer_egg['id']);
            $mc_footer_egg_has_content = isset($mc_footer_egg['content']) || is_callable($mc_footer_egg['render'] ?? null);
            if (!$mc_footer_egg_id || !$mc_footer_egg_has_content) {
                continue;
            }
            $mc_footer_egg_title = isset($mc_footer_egg['title']) ? (string) $mc_footer_egg['title'] : '';
            ?>
            <dialog
                class="mc-easter-egg-dialog"
                data-easter-egg-dialog="<?php echo esc_attr($mc_footer_egg_id); ?>"
                <?php if ($mc_footer_egg_title) : ?>aria-labelledby="mc-easter-egg-title-<?php echo esc_attr($mc_footer_egg_id); ?>"<?php else : ?>aria-label="<?php echo esc_attr__('Discovered easter egg', 'sducraft'); ?>"<?php endif; ?>
            >
                <div class="mc-easter-egg-dialog__frame">
                    <header class="mc-easter-egg-dialog__header">
                        <?php if ($mc_footer_egg_title) : ?>
                            <h2 id="mc-easter-egg-title-<?php echo esc_attr($mc_footer_egg_id); ?>"><?php echo esc_html($mc_footer_egg_title); ?></h2>
                        <?php endif; ?>
                        <button class="mc-easter-egg-dialog__close" type="button" data-mc-dialog-close aria-label="<?php echo esc_attr__('Close', 'sducraft'); ?>">&times;</button>
                    </header>
                    <div class="mc-easter-egg-dialog__content">
                        <?php
                        if (is_callable($mc_footer_egg['render'] ?? null)) {
                            ob_start();
                            $mc_footer_egg_result = call_user_func($mc_footer_egg['render'], $mc_footer_egg);
                            echo ob_get_clean(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                            if (is_string($mc_footer_egg_result)) {
                                echo $mc_footer_egg_result; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                            }
                        } elseif (isset($mc_footer_egg['content'])) {
                            echo wp_kses_post((string) $mc_footer_egg['content']);
                        }
                        ?>
                    </div>
                </div>
            </dialog>
        <?php endforeach; ?>
    </div>

    <p class="mc-footer__status" id="mc-status" role="status" aria-live="polite"></p>
</footer>

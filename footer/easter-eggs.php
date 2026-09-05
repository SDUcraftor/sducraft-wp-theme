<?php
/**
 * Site-specific Minecraft footer easter eggs.
 *
 * Keep registrations in this file so the footer's core interaction files can
 * be updated independently. See README.md for complete examples and events.
 */

defined('ABSPATH') || exit;

/** 
 * 基岩
*/
add_filter('sducraft_mc_footer_easter_eggs', function ($eggs) {
    $eggs[] = array(
        'id'    => 'bedrock',
        'x'     => 0.68,
        'depth' => 8,
        'title' => '你发现了 神秘基岩！？',
        'render' => function () {
            ?>
            <figure class="mc-easter-egg-reward">
                <img
                    class="mc-easter-egg-reward__image"
                    src="<?php echo esc_url(get_stylesheet_directory_uri() . '/footer/assets/blocks/bedrock.png'); ?>"
                    alt="神秘基岩"
                    width="160"
                    height="160"
                >
                <figcaption class="mc-easter-egg-reward__description">
                    <p>到底是谁把基岩塞到这种地方的啊喂！</p>
                </figcaption>
            </figure>
            <?php
        },
    );

    return $eggs;
});

/**
 * 
 */
add_filter('sducraft_mc_footer_easter_eggs', function ($eggs) {
    $eggs[] = array(
        'id'    => 'hyperion',
        'x'     => 0.68,
        'depth' => 9,
        'title' => '你发现了 Hyperion!',
        'render' => function () {
            ?>
            <div style="text-align: center; margin-bottom: 16px;">
                <span style="color: rgb(255, 85, 255); font-family: monospace; font-weight: bold; font-size: 20px;">
                    <span style="height: 32px; margin-right: -5px;">Heroic Hyperion </span> 
                    <span style="color: rgb(255, 170, 0); font-weight: normal; height: 100%;">✪✪✪✪✪</span>
                    <span style="color: red; font-weight: normal; height: 100%;">➎</span>
                </span>
            </div>
            
            <figure class="mc-easter-egg-reward">
                <img
                    class="mc-easter-egg-reward__image"
                    src="https://www.sducraft.top:8443/wp-content/uploads/2026/09/1788494446-HYPERION.gif"
                    alt="Heroic Hyperion"
                    style="width: 80px; height: 80px;"
                >
                <figcaption class="mc-easter-egg-reward__description">
                    <p>Wither Impact!</p>
                </figcaption>
            </figure>
            <p style="text-align: center; margin-top: 40px;">玩Skyblock玩的。</p>
            <?php
        },
    );

    return $eggs;
});
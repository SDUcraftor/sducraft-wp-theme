<?php
/**
 * Site-specific Minecraft footer easter eggs.
 *
 * Keep registrations in this file so the footer's core interaction files can
 * be updated independently. See README.md for complete examples and events.
 */

defined('ABSPATH') || exit;

add_filter('sducraft_mc_footer_easter_eggs', function ($eggs) {
    $eggs[] = array(
        'id'    => 'example-bedrock',
        'x'     => 0.68,
        'depth' => 8,
        'title' => '你发现了 神秘基岩!',
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
                    <p>它似乎不应该出现在这里……也许这片地下还藏着更多东西。</p>
                </figcaption>
            </figure>
            <?php
        },
    );

    return $eggs;
});

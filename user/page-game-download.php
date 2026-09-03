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
    $modpacks = sducraft_get_ordered_modpacks();
    $per_page = sducraft_get_modpack_per_page(get_the_ID());
    $visible_modpacks = array_slice($modpacks, 0, $per_page);
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

            <?php if ($visible_modpacks) : ?>
                <div class="modpack-list" id="sducraft-modpack-list">
                    <?php echo sducraft_render_modpack_cards($visible_modpacks, true); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                </div>
                <?php if (count($visible_modpacks) < count($modpacks)) : ?>
                    <div class="modpack-load-more">
                        <button class="modpack-load-more__button" type="button"
                            data-page-id="<?php echo esc_attr(get_the_ID()); ?>"
                            data-offset="<?php echo esc_attr(count($visible_modpacks)); ?>"
                            aria-controls="sducraft-modpack-list">
                            <i class="fa-solid fa-angle-down" aria-hidden="true"></i>
                            <span>继续查看</span>
                        </button>
                        <span class="screen-reader-text modpack-load-more__status" aria-live="polite"></span>
                    </div>
                <?php endif; ?>
            <?php else : ?>
                <div class="modpack-empty">目前还没有可供下载的整合包。</div>
            <?php endif; ?>
        </main>
    </div>
    <?php
endwhile;

get_footer();

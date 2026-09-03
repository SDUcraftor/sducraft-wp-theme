<?php
if (!defined('ABSPATH')) {
    exit;
}

$modpack = sducraft_get_modpack_data();
$has_thumbnail = has_post_thumbnail();
?>
<article <?php post_class('modpack-card' . ($has_thumbnail ? '' : ' modpack-card--no-image')); ?>>
    <?php if ($has_thumbnail) : ?>
        <a class="modpack-card__cover" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
            <?php the_post_thumbnail('large', array('loading' => 'lazy')); ?>
        </a>
    <?php endif; ?>

    <div class="modpack-card__body">
        <div class="modpack-card__heading">
            <div>
                <span class="modpack-status modpack-status--<?php echo esc_attr($modpack['status']); ?>"><?php echo esc_html($modpack['status_label']); ?></span>
                <h2 class="modpack-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
            </div>
            <time datetime="<?php echo esc_attr(get_the_modified_date(DATE_W3C)); ?>">更新于 <?php echo esc_html(get_the_modified_date('Y-m-d')); ?></time>
        </div>

        <?php if ($modpack['minecraft_version'] || $modpack['modpack_version'] || $modpack['author']) : ?>
            <dl class="modpack-facts">
                <?php if ($modpack['minecraft_version']) : ?><div><dt>Minecraft</dt><dd><?php echo esc_html($modpack['minecraft_version']); ?></dd></div><?php endif; ?>
                <?php if ($modpack['modpack_version']) : ?><div><dt>整合包版本</dt><dd><?php echo esc_html($modpack['modpack_version']); ?></dd></div><?php endif; ?>
                <?php if ($modpack['author']) : ?><div><dt>作者</dt><dd><?php echo esc_html($modpack['author']); ?></dd></div><?php endif; ?>
            </dl>
        <?php endif; ?>

        <?php if ($modpack['summary']) : ?>
            <p class="modpack-card__summary"><?php echo esc_html($modpack['summary']); ?></p>
        <?php endif; ?>

        <div class="modpack-actions">
            <?php foreach (array_slice($modpack['downloads'], 0, 2) as $download) : ?>
                <?php $label = $download['label'] ?: (($download['platform'] ?: '整合包') . '下载'); ?>
                <a class="modpack-download" href="<?php echo esc_url($download['url']); ?>" download>
                    <i class="fa-solid fa-download" aria-hidden="true"></i>
                    <span><?php echo esc_html($label); ?></span>
                    <?php if ($size = sducraft_get_download_size($download)) : ?><small><?php echo esc_html($size); ?></small><?php endif; ?>
                </a>
            <?php endforeach; ?>
            <a class="modpack-details" href="<?php the_permalink(); ?>">详细信息 <i class="fa-solid fa-angle-right" aria-hidden="true"></i></a>
        </div>
    </div>
</article>

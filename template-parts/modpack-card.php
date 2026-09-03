<?php
if (!defined('ABSPATH')) {
    exit;
}

$modpack = sducraft_get_modpack_data();
$published_date = get_the_date('Y-m-d');
$modified_date = get_the_modified_date('Y-m-d');
$image_loading = isset($args['image_loading']) && $args['image_loading'] === 'eager' ? 'eager' : 'lazy';
$image_attributes = array('loading' => $image_loading);
if ($image_loading === 'eager') {
    $image_attributes['fetchpriority'] = 'high';
}
?>
<article <?php post_class('modpack-card'); ?>>
    <?php if (has_post_thumbnail()) : ?>
        <a class="modpack-card__cover" href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true">
            <?php the_post_thumbnail('large', $image_attributes); ?>
        </a>
    <?php else : ?>
        <div class="modpack-card__cover modpack-cover-placeholder" aria-hidden="true">
            <i class="fa-solid fa-cubes"></i>
            <span>SDUCRAFT</span>
        </div>
    <?php endif; ?>

    <div class="modpack-card__body">
        <div class="modpack-card__heading">
            <div>
                <?php if ($modpack['status'] !== 'normal') : ?>
                    <span class="modpack-status modpack-status--<?php echo esc_attr($modpack['status']); ?>"><?php echo esc_html($modpack['status_label']); ?></span>
                <?php endif; ?>
                <h2 class="modpack-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
            </div>
            <div class="modpack-card__dates">
                <time datetime="<?php echo esc_attr(get_the_date(DATE_W3C)); ?>">发布于 <?php echo esc_html($published_date); ?></time>
                <?php if ($modified_date !== $published_date) : ?>
                    <time datetime="<?php echo esc_attr(get_the_modified_date(DATE_W3C)); ?>">更新于 <?php echo esc_html($modified_date); ?></time>
                <?php endif; ?>
            </div>
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
                <?php $label = $download['label'] ?: (sducraft_get_download_platform_label($download) . '下载'); ?>
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

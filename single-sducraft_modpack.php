<?php
/**
 * Single modpack page.
 */

get_header();
?>
<div id="primary" class="content-area modpack-single">
    <main id="main" class="site-main" role="main">
        <?php while (have_posts()) : the_post(); ?>
            <?php
            $modpack = sducraft_get_modpack_data();
            $published_date = get_the_date('Y-m-d');
            $modified_date = get_the_modified_date('Y-m-d');
            ?>
            <article <?php post_class('modpack-release'); ?>>
                <header class="modpack-release__header">
                    <div class="modpack-release__intro">
                        <a class="modpack-back" href="<?php echo esc_url(sducraft_get_modpack_page_url()); ?>"><i class="fa-solid fa-angle-left" aria-hidden="true"></i> 全部整合包</a>
                        <?php if ($modpack['status'] !== 'normal') : ?>
                            <span class="modpack-status modpack-status--<?php echo esc_attr($modpack['status']); ?>"><?php echo esc_html($modpack['status_label']); ?></span>
                        <?php endif; ?>
                        <h1><?php the_title(); ?></h1>
                        <?php if ($modpack['summary']) : ?><p><?php echo esc_html($modpack['summary']); ?></p><?php endif; ?>
                    </div>
                    <?php if (has_post_thumbnail()) : ?>
                        <figure class="modpack-release__cover"><?php the_post_thumbnail('large'); ?></figure>
                    <?php else : ?>
                        <div class="modpack-release__cover modpack-cover-placeholder" aria-hidden="true">
                            <i class="fa-solid fa-cubes"></i>
                            <span>SDUCRAFT</span>
                        </div>
                    <?php endif; ?>
                </header>

                <dl class="modpack-facts modpack-facts--large">
                    <?php if ($modpack['minecraft_version']) : ?><div><dt>Minecraft</dt><dd><?php echo esc_html($modpack['minecraft_version']); ?></dd></div><?php endif; ?>
                    <?php if ($modpack['modpack_version']) : ?><div><dt>整合包版本</dt><dd><?php echo esc_html($modpack['modpack_version']); ?></dd></div><?php endif; ?>
                    <?php if ($modpack['author']) : ?><div><dt>作者</dt><dd><?php echo esc_html($modpack['author']); ?></dd></div><?php endif; ?>
                    <div>
                        <dt>日期</dt>
                        <dd><?php echo esc_html($published_date); ?></dd>
                        <?php if ($modified_date !== $published_date) : ?><small>更新于 <?php echo esc_html($modified_date); ?></small><?php endif; ?>
                    </div>
                </dl>

                <?php if ($modpack['downloads']) : ?>
                    <section class="modpack-downloads" aria-labelledby="modpack-downloads-title">
                        <h2 id="modpack-downloads-title">选择下载</h2>
                        <div class="modpack-downloads__list">
                            <?php foreach ($modpack['downloads'] as $download) : ?>
                                <?php
                                $platform_label = sducraft_get_download_platform_label($download);
                                $label = $download['label'] ?: ($platform_label . '下载');
                                $details = array_filter(array($platform_label, $download['architecture'] ?? '', sducraft_get_download_size($download)));
                                ?>
                                <a class="modpack-download modpack-download--large" href="<?php echo esc_url($download['url']); ?>" download>
                                    <i class="fa-solid fa-download" aria-hidden="true"></i>
                                    <span><strong><?php echo esc_html($label); ?></strong><?php if ($details) : ?><small><?php echo esc_html(implode(' · ', $details)); ?></small><?php endif; ?></span>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </section>
                <?php endif; ?>

                <?php if (trim((string) get_the_content())) : ?>
                    <section class="modpack-release__content entry-content">
                        <?php the_content(); ?>
                    </section>
                <?php endif; ?>
            </article>
        <?php endwhile; ?>
    </main>
</div>
<?php get_footer(); ?>

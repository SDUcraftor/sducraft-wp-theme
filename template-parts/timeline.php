<?php
/** One server-rendered history for WordPress and the local preview. */
if (!defined('ABSPATH')) exit;
// Stable date sort: same-day entries retain their established editorial order.
foreach ($items as $i => &$item) $item['_order'] = $i;
unset($item);
usort($items, function ($a, $b) { return strcmp($b['year'], $a['year']) ?: (($b['title'] === '一校三地汇聚') <=> ($a['title'] === '一校三地汇聚')) ?: $a['_order'] <=> $b['_order']; });
$years = array_values(array_unique(array_map(function ($item) { return substr($item['year'], 0, 4); }, $items)));
$manifest = json_decode(file_get_contents(__DIR__ . '/../assets/timeline/history/manifest.json'), true) ?: array();
$latest = $items[0]['year'];
?>
<div id="mc-timeline-app" class="mc-viewport" data-rider-config="<?php echo esc_url($assets . '/rider.json'); ?>" data-textures="<?php echo esc_url($assets . '/textures/'); ?>" data-minecart-model="<?php echo esc_url($assets . '/minecart.glb'); ?>" data-chest-model="<?php echo esc_url($assets . '/end_chest.glb'); ?>">
    <div class="mc-world-backdrop" aria-hidden="true"></div><canvas class="mc-world-canvas" aria-hidden="true"></canvas><div class="mc-vignette" aria-hidden="true"></div>
    <div class="mc-load-status" role="status">正在铺好来时的路…</div>
    <div class="mc-topbar"><a href="#mc-timeline-app" class="mc-brand">SDUcraft <span>编年史</span></a><a href="https://www.sducraft.top/intro/history" target="_blank" rel="noopener">历史档案 ↗</a></div>
    <header class="mc-story-header"><p class="mc-story-kicker">BACK ALONG THE TRACKS</p><h1>沿着来路，<br>回到最初<span>。</span></h1><p class="mc-hero-copy">从今天的共同世界，回到第一个放下的方块。<br>让我们倒着走一遍，看看故事如何开始。</p><a class="mc-start" href="#mc-year-<?php echo esc_attr($years[0]); ?>">从最近的一站出发 <span>↓</span></a><a class="mc-start-origin" href="#mc-origins">从最初开始 ↑</a><div class="mc-hero-meta"><span><?php echo esc_html($years[0]); ?> → <?php echo esc_html(end($years)); ?></span><span><?php echo count($items); ?> 个记忆坐标</span><span>一校 · 三地 · 八校区</span></div></header>
    <nav class="mc-year-nav" aria-label="按年份回顾"><?php foreach ($years as $year) : ?><a href="#mc-year-<?php echo esc_attr($year); ?>" data-year="<?php echo esc_attr($year); ?>" aria-label="回顾 <?php echo esc_attr($year); ?> 年"><span><?php echo esc_html($year); ?></span></a><?php endforeach; ?></nav>
    <div class="mc-stops-stream">
    <?php $previous = null; foreach ($items as $index => $item) :
        $year = substr($item['year'], 0, 4);
        $origin = $item['year'] === '2021-10-16' && $item['title'] === '一校三地汇聚' ? 'merge' : (in_array($item['title'], array('还原计划启程', '百廿校庆特别献礼'), true) && $year === '2021' ? 'restoration' : ($item['year'] === '2021-10-02' && $item['title'] === 'SDUcraft 正式成立' ? 'vanilla' : ''));
        $photos = $manifest[$item['year']] ?? array();
        // Two different events share this date; the source photo belongs to the merger.
        if ($item['year'] === '2021-10-16' && $item['title'] !== '一校三地汇聚') $photos = array();
        if ($year !== $previous) :
            if ($previous !== null) echo '</div>';
            $previous = $year;
    ?><div class="mc-year-group" id="mc-year-<?php echo esc_attr($year); ?>"><header class="mc-year-heading"><span><?php echo esc_html($year); ?></span><p><?php echo $index === 0 ? '最近的记忆' : '再往前，一起走过的日子'; ?></p></header><?php endif; ?>
        <section class="mc-milestone-block <?php echo $item['has_chest'] ? 'is-milestone' : ''; ?> <?php echo $photos ? 'has-photo' : ''; ?>" data-photo-style="<?php echo in_array($item['title'], array('方块山大 2.0 启动', '方块山大登上迎新晚会'), true) ? 'building' : ($photos && $item['has_chest'] ? 'gathering' : 'archive'); ?>" data-origin="<?php echo esc_attr($origin); ?>" data-side="<?php echo $origin === 'vanilla' || (!$origin && $index % 2) ? 'right' : 'left'; ?>" data-year="<?php echo esc_attr($year); ?>" data-date="<?php echo esc_attr($item['year']); ?>" id="mc-stop-<?php echo (int)$index; ?>">
            <span class="mc-stop-anchor" aria-hidden="true"></span>
            <button class="mc-station-sign" type="button" data-detail="mc-detail-<?php echo (int)$index; ?>" aria-label="阅读 <?php echo esc_attr($item['year'] . ' ' . $item['title']); ?>"><time datetime="<?php echo esc_attr($item['year']); ?>"><?php echo esc_html($item['year']); ?></time></button>
            <article class="mc-gui-card"><div class="mc-card-label"><span><?php echo $origin === 'merge' ? '◆ 两条来路 · 在此汇聚' : ($origin === 'restoration' ? '还原计划线' : ($origin === 'vanilla' ? '原 SDUcraft 线' : ($item['has_chest'] ? '◆ 里程碑' : '沿途记事'))); ?></span><?php if ($photos) : ?><span>▧ 历史影像</span><?php endif; ?></div><h3><button class="mc-entry-title" type="button" data-detail="mc-detail-<?php echo (int)$index; ?>" aria-label="阅读：<?php echo esc_attr($item['title']); ?>"><?php echo esc_html($item['title']); ?></button></h3><div class="mc-card-body"><?php echo wp_kses_post(wpautop($item['content'])); ?></div>
            <?php if ($item['has_chest']) : ?><button class="mc-chest-btn" type="button" data-detail="mc-detail-<?php echo (int)$index; ?>" aria-label="打开回忆：<?php echo esc_attr($item['title']); ?>"><img src="<?php echo esc_url($assets . '/ender-chest.png'); ?>" alt=""><span class="mc-chest-tip">打开回忆</span></button><?php endif; ?></article>
            <?php if ($photos) : $photo = $photos[0]; $caption = $photo['name'] ?: $item['title']; ?><figure class="mc-memory-display"><button type="button" data-detail="mc-detail-<?php echo (int)$index; ?>" data-photo="true" aria-label="查看历史照片：<?php echo esc_attr($caption); ?>"><img src="<?php echo esc_url($assets . '/history/' . $photo['file']); ?>" alt="<?php echo esc_attr($caption); ?>" width="<?php echo (int)$photo['width']; ?>" height="<?php echo (int)$photo['height']; ?>" loading="lazy" decoding="async"></button><figcaption><?php echo esc_html($caption); ?><span><?php echo esc_html($item['year']); ?></span></figcaption></figure><?php endif; ?>
            <template id="mc-detail-<?php echo (int)$index; ?>"><h2><?php echo esc_html($item['title']); ?></h2><time><?php echo esc_html($item['year']); ?></time><div class="mc-entry-text"><?php echo wp_kses_post(wpautop($item['content'])); ?></div><?php foreach ($photos as $photo) : ?><figure><img width="<?php echo (int)$photo['width']; ?>" height="<?php echo (int)$photo['height']; ?>" src="<?php echo esc_url($assets . '/history/' . $photo['file']); ?>" alt="<?php echo esc_attr($photo['name'] ?: $item['title']); ?>"><figcaption><?php echo esc_html($photo['name'] ?: $item['title']); ?> · SDUcraft 历史档案</figcaption></figure><?php endforeach; ?></template>
        </section>
    <?php endforeach; if ($previous !== null) echo '</div>'; ?></div>
    <footer class="mc-story-footer" id="mc-origins"><p class="mc-story-kicker">THE FIRST BLOCK / 2021</p><h2>原来，我们从这里开始。</h2><p>向上，沿着时间前行。两条来路，在 2021 年相遇。</p><a href="#mc-year-<?php echo esc_attr($years[0]); ?>">回到最近的记忆 ↑</a><span class="mc-footer-wordmark">SDUcraft</span></footer>
    <aside class="mc-journey-hud" aria-label="当前位置"><span class="mc-hud-year"><?php echo esc_html($years[0]); ?> 年</span><span class="mc-hud-date"><?php echo esc_html($latest); ?></span><span class="mc-hud-count">01 / <?php echo count($items); ?></span><div class="mc-progress"><i></i></div></aside>
    <dialog class="mc-story-dialog" aria-labelledby="mc-dialog-title"><div class="mc-book"><button class="mc-dialog-close" type="button" aria-label="关闭历史书">×</button><div class="mc-book-page"><p class="mc-book-kicker">SDUcraft · 来时的路</p><h2 id="mc-dialog-title"></h2><time class="mc-book-date"></time><div class="mc-book-content"></div><div class="mc-book-navigation"><button type="button" class="mc-book-prev" aria-label="上一页">←</button><output class="mc-book-page-number" aria-live="polite"></output><button type="button" class="mc-book-next" aria-label="下一页">→</button></div></div></div><div class="mc-book-footer"><button type="button" class="mc-entry-prev">← 较新的故事</button><a href="https://www.sducraft.top/intro/history" target="_blank" rel="noopener">历史原文 ↗</a><button type="button" class="mc-entry-next">更早的故事 →</button></div></dialog>
</div>

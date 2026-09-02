<!--
  覆盖Sakurairo的post-nextprev文件
  将上一篇文章及下一篇文章的范围限定在同一分类目录里
-->

<?php

/**
 * NEXT / PREVIOUS POSTS
 */

if (iro_opt('article_nextpre') == '1') {
?>
	<section class="post-squares nextprev">
		<?php
		$classify_display_id = iro_opt('classify_display');
		$load_svg_url = iro_opt('vision_resource_basepath', 'https://s.nmxc.ltd/sakurairo_vision/@3.0/') . 'basic/puff-load.svg';
		$prev_link_html = '<div class="background lazyload" style="background-image:url(' . $load_svg_url . ');" data-src="' . get_prev_thumbnail_url() . '"></div>' .
			'<span class="label">' .
			__("Previous Post", 'sakurairo') .
			'</span>' .
			'<div class="info">' .
			'<h3>%title</h3><hr>' .
			'</div>';


		$next_link_html = '<div class="background lazyload" style="background-image:url(' . $load_svg_url . ');" data-src="' . get_next_thumbnail_url() . '"></div>' .
			'<span class="label">' .
			__("Next Post", 'sakurairo') .
			'</span>' .
			'<div class="info">' .
			'<h3>%title</h3><hr>' .
			'</div>';
	
      // 下面两个方法的true参数表示“选取同一分类里的文章”，若不限定范围则改为 false
		previous_post_link('%link', $prev_link_html, true, $classify_display_id);
		next_post_link('%link', $next_link_html, true, $classify_display_id)  ?>
	</section>
<?php } ?>

<?php
/** SDUCraft theme entry point and existing theme extensions. */
defined('ABSPATH') || exit;

require_once __DIR__ . '/opt/bootstrap.php';
add_action('wp_enqueue_scripts', function () {
    // 注册多个样式文件
    $styles = array(
        'sakurairo-child-style' => 'style.css',
        'sducraft-letter' => 'css/letter.css',
        'sducraft-mc-sign' => 'css/mc-sign.css',
    );
    
    foreach ($styles as $handle => $file) {
        wp_enqueue_style(
            $handle,
            get_stylesheet_directory_uri() . '/' . $file,
            array(),
            filemtime(get_stylesheet_directory() . '/' . $file)
        );
    }
}, 20);

add_action('wp_enqueue_scripts', function () {
    if (is_front_page()) {
        wp_enqueue_script(
            'sducraft-hero',
            get_stylesheet_directory_uri() . '/js/hero.js',
            array(),
            wp_get_theme()->get('Version'),
            true
        );
    }
}, 20);
require_once __DIR__ . '/footer/bootstrap.php';
require_once __DIR__ . '/inc/announcement-page.php';
require_once __DIR__ . '/inc/modpack-post-type.php';
require_once __DIR__ . '/inc/category-posts.php';
require_once __DIR__ . '/inc/timeline.php';

/**
 * @author Billadom
 * 添加自定义图标
 */
function sducraft_add_custom_icons() {
    wp_enqueue_style(
        'sducraft_dashicons',
        get_stylesheet_directory_uri() . '/inc/modules/dashicons/css/icn-jennystudio.css',
        [],
        null
    );
}

add_action('wp_enqueue_scripts', 'sducraft_add_custom_icons');
add_action('admin_enqueue_scripts', 'sducraft_add_custom_icons');
add_action('login_enqueue_scripts', 'sducraft_add_custom_icons');


/**
 * @author Billadom
 * 给 wp:query 的 query 参数中添加了一些参数
 * sticky_prior: 若设置为true，则会将被设置为置顶的文章顶置，此参数优先级最高
 * prior_tag: 若设置此参数，则会将拥有对应标签的文章前置，优先级低于 sticky_prior
 * defer_tag: 若设置此参数，则会将拥有对应标签的文章后置
 * 使用 prior_tag 和 defer_tag 时请输入标签，若该标签有别名则输入别名。
 * 
 * 示例: "query":{......, "sticky_prior":true, "prior_tag":"show", "defer_tag":"archived"}
 * 
 * tip: 该函数实现的所有功能在预览时均不可用，请保存后自行查看网页确认效果。
 */
add_filter('query_loop_block_query_vars', function($query, $block) {
	$q_context = $block->context['query'] ?? array();

	if (isset($q_context['sticky_prior']) && $q_context['sticky_prior'] === true) {
		$query['ignore_sticky_posts'] = 1;
		$query['do_sticky_prior'] = true;
		add_filter('posts_clauses', 'apply_sticky_prior_sql', 20, 2);
	}

	if (!empty($q_context['prior_tag'])) {
		$query['prior_tag_slug'] = $q_context['prior_tag'];
		add_filter('posts_clauses', 'apply_tag_prior_sql', 15, 2);
	}

	if (!empty($q_context['defer_tag'])) {
		$query['defer_tag_slug'] = $q_context['defer_tag'];
		add_filter('posts_clauses', 'apply_tag_defer_sql', 10, 2);
	}

	return $query;
}, 10, 2);

/**
 * @author Billadom
 * sticky_prior 功能实现
 */
function apply_sticky_prior_sql($clauses, $wp_query) {
	if ($wp_query->get('do_sticky_prior') !== true) return $clauses;
	$sticky_ids = get_option('sticky_posts');
	if (!empty($sticky_ids)) {
		global $wpdb;
		$ids_str = implode(',', array_map('intval', $sticky_ids));
		// 获取按日期升序排列的 ID，配合 DESC 排序，可实现：置顶(新->旧) > 普通文章
		$sorted_ids = $wpdb->get_col("SELECT ID FROM $wpdb->posts WHERE ID IN ($ids_str) ORDER BY post_date ASC");
		if ($sorted_ids) {
			$list = implode(',', $sorted_ids);
			$clauses['orderby'] = "FIELD({$wpdb->posts}.ID, $list) DESC, " . $clauses['orderby'];
		}
	}
	return $clauses;
}

/**
 * @author Billadom
 * prior_tag 功能实现
 */
function apply_tag_prior_sql($clauses, $wp_query) {
	$slug = $wp_query->get('prior_tag_slug');
	$sorted_ids = get_sorted_ids_by_tag($slug, 'ASC');
	if (!empty($sorted_ids)) {
		global $wpdb;
		$list = implode(',', $sorted_ids);
		$clauses['orderby'] = "FIELD({$wpdb->posts}.ID, $list) DESC, " . $clauses['orderby'];
	}
	return $clauses;
}

/**
 * @author Billadom
 * defer_tag 功能实现
 */
function apply_tag_defer_sql($clauses, $wp_query) {
	$slug = $wp_query->get('defer_tag_slug');
	$sorted_ids = get_sorted_ids_by_tag($slug, 'DESC');
	if (!empty($sorted_ids)) {
		global $wpdb;
		$list = implode(',', $sorted_ids);
		$clauses['orderby'] = "FIELD({$wpdb->posts}.ID, $list) ASC, " . $clauses['orderby'];
	}
	return $clauses;
}

/**
 * @author Billadom
 * 辅助函数，防止在排序下沉后不按原有的规则进行进行排序
 */ 
function get_sorted_ids_by_tag($slug, $order = 'DESC') {
	global $wpdb;
	$term = get_term_by('slug', $slug, 'post_tag');
	if (!$term) return array();

	$ids = get_objects_in_term($term->term_id, 'post_tag');
	if (empty($ids)) return array();

	$ids_str = implode(',', array_map('intval', $ids));
	return $wpdb->get_col("SELECT ID FROM $wpdb->posts WHERE ID IN ($ids_str) AND post_status = 'publish' ORDER BY post_date $order");
}

/**
 * @author Billadom
 * 扩展媒体库支持的文件类型
 * 使用时根据需要加入对应的扩展名和MIME类型，MIME类型可查阅https://mime.wcode.net/zh-hans/
 * 使用“unset($mimes['xxx']);”来禁用某一特定文件类型
 */
add_filter('upload_mimes', function($mimes) {
	$mimes['mrpack'] = 'application/x-modrinth-modpack+zip';
	$mimes['svg'] = 'image/svg';
	$mimes['exe'] = 'application/octet-stream';
	$mimes['ttf'] = 'application/x-font-truetype';

	//unset($mimes['zip']);

	return $mimes;
}, 10);
/**
 * @author Billadom
 * 增加FileBird文件夹显示的短代码
 * 例：[filebird_list folder="ABC"] 即可显示ABC文件夹下所有文件的表格
 */
add_action('init', function() {
	add_shortcode('filebird_list', function($atts) {
		$atts = shortcode_atts(array(
			'folder' => '其他',
		), $atts);
		return render_filebird_folder_list(array('folderName' => $atts['folder']));
	});
});

function render_filebird_folder_list($attributes) {
	global $wpdb;
	$folder_name = $attributes['folderName'];

	// 获取文件夹 ID
	$fbv_table = $wpdb->prefix . 'fbv';
	$folder_id = $wpdb->get_var($wpdb->prepare(
		"SELECT id FROM $fbv_table WHERE name = %s LIMIT 1",
		$folder_name
	));

	if (!$folder_id) {
		return '<p>未找到名为“' . esc_html($folder_name) . '”的文件夹。</p>';
	}

	// 获取该文件夹下的所有附件 ID
	$relation_table = $wpdb->prefix . 'fbv_attachment_folder';
	$attachment_ids = $wpdb->get_col($wpdb->prepare(
		"SELECT attachment_id FROM $relation_table WHERE folder_id = %d",
		$folder_id
	));

	if (empty($attachment_ids)) {
		return '<p>文件夹“' . esc_html($folder_name) . '”中没有文件。</p>';
	}

	// 构建查询
	$args = array(
		'post_type'      => 'attachment',
		'post_status'    => 'inherit',
		'post__in'       => $attachment_ids,
		'posts_per_page' => -1,
		'orderby'        => 'date',
		'order'          => 'DESC'
	);
	$query = new WP_Query($args);

	if (!$query->have_posts()) {
		return '<p>无法加载文件列表。</p>';
	}

	// 渲染 HTML 表格
	$output = '<div class="filebird-list-container">';
	$output .= '<table class="filebird-file-table" style="width:100%; border-collapse: collapse; margin-top: 10px;">';
	$output .= '<thead>
                    <tr style="background: #f4f4f4; text-align: left;">
                        <th style="padding: 10px; border: 1px solid #ddd;">文件名</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">上传时间</th>
                        <th style="padding: 10px; border: 1px solid #ddd;">大小</th>
                    </tr>
                </thead>';
	$output .= '<tbody>';

	while ($query->have_posts()) {
		$query->the_post();
		$id = get_the_ID();
		$file_url = wp_get_attachment_url($id);
		$file_path = get_attached_file($id);

		// 获取并格式化后缀名
		$extension = pathinfo($file_path, PATHINFO_EXTENSION);
		$display_name = get_the_title() . ($extension ? '.' . strtolower($extension) : '');

		$file_size = file_exists($file_path) ? size_format(filesize($file_path)) : '未知';
		$upload_time = get_the_time('Y-m-d H:i');

		$output .= '<tr>';
		$output .= '<td style="padding: 10px; border: 1px solid #ddd;"><a href="' . esc_url($file_url) . '" target="_blank">' . esc_html($display_name) . '</a></td>';
		$output .= '<td style="padding: 10px; border: 1px solid #ddd;">' . esc_html($upload_time) . '</td>';
		$output .= '<td style="padding: 10px; border: 1px solid #ddd;">' . esc_html($file_size) . '</td>';
		$output .= '</tr>';
	}
	wp_reset_postdata();

	$output .= '</tbody></table></div>';

	return $output;
}

/**
 * @author Billadom
 * 不知道为什么wp-dark-mode的暗黑模式在query切换页的时候
 * 会把body的css弄掉，导致暗黑模式效果诡异
 * 
 * 该函数将部分非刷新的跳转强制用windows.location.href的跳转，强制刷新
 */ 
function query_loop_force_full_reload() {
?>
<script>
document.addEventListener("DOMContentLoaded", function() {
    document.querySelectorAll(".wp-block-query-pagination a").forEach(link => {
        link.addEventListener("click", function(e){
            e.stopImmediatePropagation();
            e.preventDefault();
            window.location.href = link.href;
        });
    });

});
</script>
<?php
}
add_action('wp_footer', 'query_loop_force_full_reload');
/**
 * @author Billadom
 */
function iro_render_text_only_menu_item($item_output, $item, $depth, $args) {
    if (in_array('menu-text-only', (array) $item->classes, true)) {
        return $args->before
            . '<span class="menu-text-only-label">'
            . $args->link_before
            . esc_html($item->title)
            . $args->link_after
            . '</span>'
            . $args->after;
    }

    return $item_output;
}
add_filter('walker_nav_menu_start_el', 'iro_render_text_only_menu_item', 10, 4);
/**
 * @author Billadom
 * 用于生成不同时间显示不同slider的短代码
 */
function sducraft_timed_smartslider($atts) {
    $atts = shortcode_atts([
        'day'         => 22,
        'night'       => 23,
        'night_start' => 22,
        'day_start'   => 7,
    ], $atts, 'timed_smartslider');

    $hour        = (int) current_time('G');
    $night_start = (int) $atts['night_start'];
    $day_start   = (int) $atts['day_start'];

    // 默认夜间范围：22:00–06:59
    $is_night = $hour >= $night_start || $hour < $day_start;

    $slider_id = $is_night
        ? absint($atts['night'])
        : absint($atts['day']);

    if (!$slider_id) {
        return '';
    }

    return do_shortcode(
        sprintf('[smartslider3 slider="%d"]', $slider_id)
    );
}
add_shortcode('timed_smartslider', 'sducraft_timed_smartslider');

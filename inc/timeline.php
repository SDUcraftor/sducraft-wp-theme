<?php

if (!defined('ABSPATH')) {
    exit;
}

function sducraft_timeline_default_items() {
    return array(
        array('2021-02-06', 64, 'overworld', '还原计划启程', '山东大学minecraft还原计划小组成立，还原计划开始！', false),
        array('2021-10-02', 60, 'overworld', 'SDUcraft 正式成立', 'De_xiaofeng在自己8750H的笔记本上开设生存服，并配置了公网转发，主要为山大人提供服务。同时，该服以及未来开设的与该系列相关的服被命名为SDUcraft。SDUcraft正式成立！', true),
        array('2021-10-16', 56, 'overworld', '百廿校庆特别献礼', "山大百廿校庆，山东大学minecraft还原计划小组发布还原计划成品视频：<a href='https://www.bilibili.com/video/BV1mv411g77R' target='_blank' rel='noopener'>【Minecraft】方块世界里的山大：山东大学百廿校庆特别献礼</a>。", true),
        array('2021-10-16', 52, 'overworld', '一校三地汇聚', '山东大学minecraft还原计划小组与SDUcraft合并，成立一个新的面向一校三地八校区的Minecraft交流平台，命名为山东大学minecraft&amp;SDUcraft，简称SDUcraft，负责人由De_xiaofeng担任。原SDUcraft更名为SDUcraft_Vanilla_Server。', true),
        array('2021-11-14', 48, 'overworld', '第一台实体服务器', 'De_xiaofeng自费购入实体机供SDUcraft使用，主要配置为12600K+32G+512G。SDUcraft_Vanilla_Server从8750H的笔记本迁移到该实体机。', false),
        array('2022-01-26', 47, 'mine', '临时迁移', 'SDUcraft_Vanilla_Server由于实体机托管问题，暂时迁移到AKKuma提供的计算机上。', false),
        array('2022-03-08', 43, 'mine', '实体机重新托管', '实体机托管问题最终在他人的帮助下得到解决，SDUcraft_Vanilla_Server重新迁移回原12600K主机。同时调整服务器域名，in.sducraft.top用于校内访问，out.sducraft.top用于校外访问。', false),
        array('2022-03-26', 39, 'mine', '空岛服上线', "由De_xiaofeng和MX_w制作的空岛服正式上线，并发布<a href='https://www.sducraft.top/front/Document/2022-03-26/clRgc7UoGL3IBdKB/sducraft_island_tutorial-20230326.pdf' target='_blank' rel='noopener'>空岛服介绍文档</a>。", false),
        array('2022-04-21', 35, 'mine', '首届 UHC 开放报名', 'UHC报名开启，计划于五一举办。由De_xiaofeng和goodmoon制作，并发布了UHC介绍文档。', false),
        array('2022-04-30', 31, 'mine', '首届 UHC', '举办首届UHC。比赛中途，校外人员因作弊被踢出服务器，随后校外转发服务器遭到攻击，严重影响校外连接并迫使比赛停赛。之后不久，停用了公开的校外访问地址out.sducraft.top。', true),
        array('2022-07-15', 27, 'mine', '高校小游戏联赛', '受上海交通大学MC社邀请，参加高校小游戏联赛。', false),
        array('2022-10-02', 23, 'mine', '生存服二周目', '生存服二周目更新。同时调整服务器命名，弃用SDUcraft_Vanilla_Server，将MC服务器分为SDUcraft群组服和SDUcraft校区展示服，简称群组服和展示服。', true),
        array('2022-12-12', 19, 'mine', '服务器硬件升级', '服务器硬件升级。此前已进行过多次调整，截至当时主要配置为13700K+128G+512G SSD+1T SSD。', false),
        array('2023-05-14', 16, 'mine', '招收新一届负责人', '发布公告，SDUcraft招收新一届负责人。', false),
        array('2023-07-09', 15, 'deepslate', '负责人换届', '负责人换届，新一届负责人由SheepXiu担任。', false),
        array('2023-08-27', 12, 'deepslate', '交流群突破 500 人', '山东大学minecraft&amp;SDUcraft交流群人数到达514人！', false),
        array('2023-09-26', 9, 'deepslate', '学生社团正式成立', "在SheepXiu的努力下，<a href='http://www.youth.sdu.edu.cn/tz_content.jsp?urltype=news.NewsContentUrl&amp;wbtreeid=1004&amp;wbnewsid=8783' target='_blank' rel='noopener'>山东大学Minecraft社团正式成立</a>。次日，社团成立感言发布于<a href='https://www.sdrj.sdu.edu.cn/info/1003/35814.htm' target='_blank' rel='noopener'>山大日记</a>。", true),
        array('2023-10-14', 6, 'deepslate', '首次参加百团大战', "MC社参与百团大战，社团Q群人数从500+激增到900+。<a href='https://www.sducraft.top/community/activity/4' target='_blank' rel='noopener'>查看活动记录</a>。", true),
        array('2023-12-02', 3, 'deepslate', '宇宙超级无敌铁镐杯', '受MUA邀请，参加宇宙超级无敌铁镐杯。', false),
        array('2023-12-05', 0, 'deepslate', 'SDUcraft 讲堂', "2023年10月至12月，SDUcraft开展了一系列Minecraft技术讲解活动，涉及Web部署与服务器运维、Server架构与客户端配置、建筑交流。<a href='https://www.sducraft.top/community/activity/6' target='_blank' rel='noopener'>查看讲堂系列活动</a>。", true),
        array('2024-02-23', -1, 'lava', 'MC 建筑赛收官', "<a href='https://www.sducraft.top/community/activity/9' target='_blank' rel='noopener'>“经典·未来”MC建筑赛完美收官</a>，创作出许多极具想象力的作品。", false),
        array('2024-03-01', -4, 'lava', 'Mathcraft 数模比赛', "举办<a href='https://www.sducraft.top/community/activity/7' target='_blank' rel='noopener'>“经典·未来”Mathcraft：史蒂夫与艾利克斯的难题</a>数模比赛，比赛圆满完成！", false),
        array('2024-04-04', -8, 'lava', '三周目启动', '2024年4月4日晚19:30，SDUcraft三周目正式启动，峰值在线人数达到42人！', true),
        array('2024-05-14', -11, 'lava', '招收新一届负责人', '发布公告，SDUcraft招收新一届负责人。', false),
        array('2024-06-30', -14, 'lava', '方块山大 2.0 启动', '方块山大2.0项目正式启动！', true),
        array('2024-08-08', -18, 'lava', '首个模组服', '2024年8月8日晚19:30，机械动力服正式启动！SDUcraft迎来第一个模组服。', true),
        array('2024-08-25', -21, 'lava', '第一次社员大会', "<a href='https://www.sducraft.top/community/activity/12' target='_blank' rel='noopener'>山东大学学生Minecraft社团第一次社员大会</a>进行工作总结，完成2024年度负责人换届。", true),
        array('2024-09-05', -25, 'lava', '负责人换届', '负责人换届，新一届负责人由Mingzu_担任。', false),
        array('2024-09-20', -28, 'lava', '方块山大登上迎新晚会', "在SheepXiu、Joker等人的努力下，方块山大2.0的成果被保送至迎新晚会，新生好评如潮。<a href='https://www.sducraft.top/community/activity/13' target='_blank' rel='noopener'>查看活动记录</a>。", true),
        array('2024-09-21', -31, 'lava', '社团招新', "发布招新视频：<a href='https://www.douyin.com/user/MS4wLjABAAAAlMToZoJ8HazANU2YP9MOpl3ikcMCtblEfwtLv8IiaUc?from_tab_name=main&amp;modal_id=7417018881774013734' target='_blank' rel='noopener'>同学，你也想加入山大MC社团吗？</a>", false),
        array('2024-09-23', -35, 'lava', '交流群达到 1314 人', '山东大学学生Minecraft社团交流群人数达到1314人！', false),
        array('2024-10-27', -38, 'lava', '再战百团争鸣', "10月20日在青岛校区、10月26至27日在济南四校区参与百团争鸣，群人数激增。<a href='https://www.sducraft.top/community/activity/16' target='_blank' rel='noopener'>查看活动记录</a>。", true),
        array('2024-10-31', -41, 'lava', '第二台物理服务器', '在Mingzu等人的努力下，第二台物理服务器（搭载R9 9950X处理器）托管至中心校区数据中心机房。', true),
        array('2025-04-04', -45, 'lava', '集体观看 Minecraft 大电影', "MC社集体观看首个Minecraft大电影。<a href='https://www.sducraft.top/community/activity/18' target='_blank' rel='noopener'>查看活动记录</a>。", false),
        array('2025-09-01', -48, 'lava', '负责人换届', '负责人换届，新一届负责人由yangxin担任。', false),
        array('2025-10-10', -52, 'lava', '社团 Logo 诞生', '9月7日启动Logo征集活动，历时一个月，共选出22个符合要求的作品，并通过投票选出社团Logo。', true),
        array('2025-11-08', -55, 'lava', '第一届小游戏活动', '在Blocks和epsilonH等人的努力下，成功举办第一届小游戏活动，在线人数20+！', true),
        array('2026-08-11', -58, 'lava', '第三届社员代表大会', '山东大学学生Minecraft社团第三届社员代表大会于方块山大中心校区线上服务器举办，审议社团工作报告，表决通过2026版社团章程等文件，选举产生新任负责同学。theDipper任总负责人（社长）暨济南校区负责人，Cr-keleiter任青岛校区负责人，tuxiaoqimc任威海校区负责人。', true),
    );
}

function sducraft_register_timeline_post_type() {
    register_post_type('mc_timeline', array(
        'labels' => array(
            'name' => '我们的故事',
            'singular_name' => '时间线节点',
            'add_new_item' => '添加时间线节点',
            'edit_item' => '编辑时间线节点',
            'menu_name' => '我们的故事',
        ),
        'public' => false,
        'show_ui' => true,
        'show_in_rest' => true,
        'menu_icon' => 'dashicons-location-alt',
        'supports' => array('title', 'editor'),
    ));

    $meta = array(
        'timeline_year_label' => 'sanitize_text_field',
        'timeline_y_level' => 'intval',
        'timeline_biome' => 'sanitize_key',
        'timeline_has_chest' => 'rest_sanitize_boolean',
        'timeline_featured_model' => 'esc_url_raw',
    );
    foreach ($meta as $key => $sanitize_callback) {
        register_post_meta('mc_timeline', $key, array(
            'show_in_rest' => true,
            'single' => true,
            'type' => $key === 'timeline_y_level' ? 'integer' : ($key === 'timeline_has_chest' ? 'boolean' : 'string'),
            'sanitize_callback' => $sanitize_callback,
            'auth_callback' => function () {
                return current_user_can('edit_posts');
            },
        ));
    }
}
add_action('init', 'sducraft_register_timeline_post_type');

function sducraft_timeline_add_meta_box() {
    add_meta_box('sducraft-timeline-details', 'Minecraft 时间线设置', 'sducraft_timeline_render_meta_box', 'mc_timeline', 'side');
}
add_action('add_meta_boxes', 'sducraft_timeline_add_meta_box');

function sducraft_timeline_render_meta_box($post) {
    wp_nonce_field('sducraft_timeline_meta', 'sducraft_timeline_nonce');
    $year = get_post_meta($post->ID, 'timeline_year_label', true);
    $y = get_post_meta($post->ID, 'timeline_y_level', true);
    $biome = get_post_meta($post->ID, 'timeline_biome', true) ?: 'overworld';
    $has_chest = (bool)get_post_meta($post->ID, 'timeline_has_chest', true);
    $model = get_post_meta($post->ID, 'timeline_featured_model', true);
    ?>
    <p><label for="timeline_year_label">展示日期</label><br><input class="widefat" id="timeline_year_label" name="timeline_year_label" value="<?php echo esc_attr($year); ?>" placeholder="2026-08-11"></p>
    <p><label for="timeline_y_level">Y 坐标</label><br><input class="widefat" type="number" min="-64" max="320" id="timeline_y_level" name="timeline_y_level" value="<?php echo esc_attr($y); ?>"></p>
    <p><label for="timeline_biome">地层</label><br><select class="widefat" id="timeline_biome" name="timeline_biome">
        <?php foreach (array('overworld' => '地表', 'mine' => '矿井', 'deepslate' => '深板岩', 'lava' => '熔岩层') as $value => $label) : ?>
            <option value="<?php echo esc_attr($value); ?>" <?php selected($biome, $value); ?>><?php echo esc_html($label); ?></option>
        <?php endforeach; ?>
    </select></p>
    <p><label><input type="checkbox" name="timeline_has_chest" value="1" <?php checked($has_chest); ?>> 显示里程碑宝箱</label></p>
    <p><label for="timeline_featured_model">可选 GLB 模型 URL</label><br><input class="widefat" type="url" id="timeline_featured_model" name="timeline_featured_model" value="<?php echo esc_attr($model); ?>"></p>
    <?php
}

function sducraft_timeline_save_meta($post_id) {
    if (!isset($_POST['sducraft_timeline_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['sducraft_timeline_nonce'])), 'sducraft_timeline_meta')) {
        return;
    }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE || !current_user_can('edit_post', $post_id)) {
        return;
    }
    $biomes = array('overworld', 'mine', 'deepslate', 'lava');
    $biome = isset($_POST['timeline_biome']) ? sanitize_key(wp_unslash($_POST['timeline_biome'])) : 'overworld';
    update_post_meta($post_id, 'timeline_year_label', isset($_POST['timeline_year_label']) ? sanitize_text_field(wp_unslash($_POST['timeline_year_label'])) : '');
    update_post_meta($post_id, 'timeline_y_level', isset($_POST['timeline_y_level']) ? intval($_POST['timeline_y_level']) : 64);
    update_post_meta($post_id, 'timeline_biome', in_array($biome, $biomes, true) ? $biome : 'overworld');
    update_post_meta($post_id, 'timeline_has_chest', isset($_POST['timeline_has_chest']) ? '1' : '0');
    update_post_meta($post_id, 'timeline_featured_model', isset($_POST['timeline_featured_model']) ? esc_url_raw(wp_unslash($_POST['timeline_featured_model'])) : '');
}
add_action('save_post_mc_timeline', 'sducraft_timeline_save_meta');

function sducraft_seed_timeline_items() {
    if (get_option('sducraft_timeline_seed_version')) {
        return;
    }
    if (get_posts(array('post_type' => 'mc_timeline', 'post_status' => 'any', 'numberposts' => 1, 'fields' => 'ids'))) {
        update_option('sducraft_timeline_seed_version', 1, false);
        return;
    }
    foreach (sducraft_timeline_default_items() as $item) {
        $post_id = wp_insert_post(array(
            'post_type' => 'mc_timeline',
            'post_status' => 'publish',
            'post_title' => $item[3],
            'post_content' => wp_kses_post($item[4]),
            'post_date' => $item[0] . ' 12:00:00',
        ));
        if (!is_wp_error($post_id)) {
            update_post_meta($post_id, 'timeline_year_label', $item[0]);
            update_post_meta($post_id, 'timeline_y_level', $item[1]);
            update_post_meta($post_id, 'timeline_biome', $item[2]);
            update_post_meta($post_id, 'timeline_has_chest', $item[5] ? '1' : '0');
        }
    }
    update_option('sducraft_timeline_seed_version', 1, false);
}
add_action('admin_init', 'sducraft_seed_timeline_items');

function sducraft_get_timeline_items() {
    $posts = get_posts(array(
        'post_type' => 'mc_timeline',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'meta_key' => 'timeline_y_level',
        'orderby' => 'meta_value_num',
        'order' => 'DESC',
    ));
    if (!$posts) {
        return array_map(function ($item) {
            return array(
                'id' => 'default-' . sanitize_title($item[0] . '-' . $item[3]),
                'year' => $item[0],
                'y' => $item[1],
                'biome' => $item[2],
                'title' => $item[3],
                'content' => $item[4],
                'has_chest' => $item[5],
                'model' => '',
            );
        }, sducraft_timeline_default_items());
    }
    return array_map(function ($post) {
        return array(
            'id' => $post->ID,
            'year' => get_post_meta($post->ID, 'timeline_year_label', true) ?: get_the_date('Y-m-d', $post),
            'y' => (int)get_post_meta($post->ID, 'timeline_y_level', true),
            'biome' => get_post_meta($post->ID, 'timeline_biome', true) ?: 'overworld',
            'title' => get_the_title($post),
            'content' => $post->post_content,
            'has_chest' => (bool)get_post_meta($post->ID, 'timeline_has_chest', true),
            'model' => get_post_meta($post->ID, 'timeline_featured_model', true),
        );
    }, $posts);
}

function sducraft_enqueue_timeline_assets() {
    if (!is_category('our_story')) {
        return;
    }

    $directory = get_stylesheet_directory();
    $uri = get_stylesheet_directory_uri();
    wp_enqueue_style('sducraft-timeline', $uri . '/css/timeline.css', array(), filemtime($directory . '/css/timeline.css'));
    wp_enqueue_script('sducraft-timeline', $uri . '/js/timeline.js', array(), max(filemtime($directory . '/js/timeline.js'), filemtime($directory . '/js/timeline-world.js')), true);
    wp_localize_script('sducraft-timeline', 'sducraftTimelineAssets', array(
        'base' => $uri,
        'three' => $uri . '/js/vendor/three-r160/three.module.min.js',
        'loader' => $uri . '/js/vendor/three-r160/GLTFLoader.js',
        'roll' => $uri . '/assets/timeline/audio/Minecart_inside.ogg',
        'ding' => $uri . '/assets/timeline/audio/Click_pitch0.6.ogg.mp3',
        'click' => $uri . '/assets/timeline/audio/Wood_click.ogg.mp3',
    ));
}
add_action('wp_enqueue_scripts', 'sducraft_enqueue_timeline_assets', 30);

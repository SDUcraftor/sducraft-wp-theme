<?php
/** World definitions and footer configuration adapters. */
defined('ABSPATH') || exit;

/** Shared by the world renderer, settings choices and target validation. */
function sducraft_mc_blocks() {
    static $blocks;
    if ($blocks === null) {
        $decoded = json_decode(file_get_contents(get_stylesheet_directory() . '/footer/blocks.json'), true);
        $blocks = is_array($decoded) ? $decoded : array();
    }
    return $blocks;
}

function sducraft_mc_target_blocks() {
    $choices = array('' => '不限（附近可挖掘方块）');
    foreach (sducraft_mc_blocks() as $type => $block) {
        if (($block['mineable'] ?? true) !== false) $choices[$type] = $block['label'] ?? $type;
    }
    return $choices;
}

function sducraft_mc_layer_defaults() {
    return array(
        'sky' => array('count' => 6, 'min' => 0, 'max' => 12),
        'grass' => array('count' => 1, 'min' => 1, 'max' => 3),
        'dirt' => array('count' => 3, 'min' => 0, 'max' => 20),
        'stone' => array('count' => 8, 'min' => 0, 'max' => 30),
        'deepslate' => array('count' => 10, 'min' => 0, 'max' => 30),
        'bedrock' => array('count' => 1, 'min' => 1, 'max' => 3),
    );
}

function sducraft_mc_world_settings() {
    $layers = array();
    foreach (sducraft_mc_layer_defaults() as $type => $rule) {
        $layers[] = array('type' => $type, 'count' => (int) sducraft_setting_number('world_layer_' . $type, $rule['count'], $rule['min'], $rule['max']));
    }
    return array(
        'layers' => $layers,
        'oakTree' => (bool) sducraft_opt('world_oak_tree', true),
        'sapling' => (bool) sducraft_opt('world_sapling', true),
        'miningSpeed' => sducraft_setting_number('world_mining_speed', 1, .25, 4),
    );
}

function sducraft_mc_depth_range() {
    $layers = sducraft_mc_world_settings()['layers'];
    $sky = $layers[0]['count'];
    return array(-$sky, array_sum(array_column($layers, 'count')) - $sky - 1);
}

add_filter('sducraft_mc_footer_config', function ($config) {
    $config['reveal_delay'] = sducraft_setting_number('footer_delay', 4000, 0, 60000);
    $config['ignition_attempts'] = sducraft_setting_number('footer_attempts', 5, 1, 30);
    $config['scroll_threshold'] = sducraft_setting_number('footer_scroll', 600, 1, 10000);
    return $config;
});

add_filter('sducraft_mc_footer_easter_eggs', function ($eggs) {
    list($min_depth, $max_depth) = sducraft_mc_depth_range();
    foreach ((array) sducraft_opt('custom_eggs', array()) as $index => $row) {
        if (!is_array($row) || empty($row['enabled'])) continue;
        $row = array_merge(array('x_mode' => 'percent', 'depth_mode' => 'fixed', 'sound_enabled' => true), $row);
        $content = wp_kses_post($row['content'] ?? '');
        $url = esc_url($row['image'] ?? '');
        if ($url) $content = '<figure class="mc-easter-egg-reward"><img class="mc-easter-egg-reward__image" src="' . $url . '" alt=""></figure>' . $content;
        $egg = array('id' => 'custom-' . absint($index), 'title' => sanitize_text_field($row['title'] ?? ''), 'content' => $content, 'x' => $row['x_mode'] === 'random' ? 'random' : max(0, min(100, (float) ($row['x'] ?? 50))) / 100, 'depth' => $row['depth_mode'] === 'random' ? 'random' : max($min_depth, min($max_depth, (int) ($row['depth'] ?? 5))));
        if ($row['x_mode'] === 'fixed') $egg['column'] = max(0, min(9999, (int) ($row['column'] ?? 1) - 1));
        if (!empty($row['block']) && isset(sducraft_mc_target_blocks()[$row['block']])) $egg['block'] = $row['block'];
        if (empty($row['sound_enabled'])) $egg['sound'] = false;
        elseif (!empty($row['sound'])) $egg['sound'] = esc_url_raw($row['sound']);
        $eggs[] = $egg;
    }
    return array_values($eggs);
}, 20);

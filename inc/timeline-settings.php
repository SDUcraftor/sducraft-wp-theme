<?php
/** Timeline category, branch, quality and rider configuration. */
defined('ABSPATH') || exit;

function sducraft_timeline_category() {
    return absint(sducraft_opt('timeline_category', 0));
}

function sducraft_timeline_roles($items) {
    $roles = array();
    if (sducraft_opt('timeline_nodes', 'custom') === 'single') return $roles;
    $ids = array();
    foreach (array('restoration_start', 'restoration_end', 'vanilla', 'merge') as $key) {
        $ids[$key] = absint(sducraft_opt('node_' . $key, 0));
    }
    $dates = array_column($items, 'year', 'id');
    if (count(array_unique($ids)) !== 4 || in_array(0, $ids, true)) return array();
    foreach ($ids as $id) if (!isset($dates[$id])) return array();
    if ($dates[$ids['restoration_start']] > $dates[$ids['restoration_end']]
        || $dates[$ids['restoration_end']] > $dates[$ids['merge']]
        || $dates[$ids['vanilla']] > $dates[$ids['merge']]) return array();
    foreach ($ids as $key => $id) $roles[$id] = strpos($key, 'restoration') === 0 ? 'restoration' : $key;
    return $roles;
}

function sducraft_quality_defaults() {
    return array(
        'low' => array('fps' => 25, 'render' => true, 'shadows' => false, 'ratio' => 1, 'particles' => 24, 'petals' => 12),
        'standard' => array('fps' => 30, 'render' => true, 'shadows' => true, 'ratio' => 1.5, 'particles' => 70, 'petals' => 32),
        'high' => array('fps' => 60, 'render' => true, 'shadows' => true, 'ratio' => 2, 'particles' => 100, 'petals' => 48),
    );
}

function sducraft_quality_profiles() {
    $profiles = sducraft_quality_defaults();
    foreach ($profiles as $name => &$profile) {
        foreach (array('fps' => array(10, 120), 'ratio' => array(.5, 3), 'particles' => array(0, 300), 'petals' => array(0, 100)) as $key => $range) {
            $profile[$key] = sducraft_setting_number('quality_' . $name . '_' . $key, $profile[$key], $range[0], $range[1]);
            if ($key !== 'ratio') $profile[$key] = (int) $profile[$key];
        }
        foreach (array('render', 'shadows') as $key) $profile[$key] = (bool) sducraft_opt('quality_' . $name . '_' . $key, $profile[$key]);
    }
    unset($profile);
    return $profiles;
}

function sducraft_rider_settings($items) {
    $skin = static function ($row) {
        $row = is_array($row) ? $row : array();
        return array('skin' => esc_url_raw($row['skin'] ?? '') ?: 'none', 'model' => ($row['model'] ?? '') === 'slim' ? 'slim' : 'classic');
    };
    $result = array('default' => $skin(array('skin' => sducraft_opt('rider_skin', ''), 'model' => sducraft_opt('rider_model', 'classic'))), 'switches' => array(), 'branches' => array());
    foreach (array('restoration', 'vanilla') as $branch) {
        $result['branches'][$branch] = $skin(array('skin' => sducraft_opt($branch . '_skin', ''), 'model' => sducraft_opt($branch . '_model', 'classic')));
    }
    $positions = array_flip(array_column($items, 'id'));
    foreach ((array) sducraft_opt('rider_switches', array()) as $row) {
        if (!is_array($row)) continue;
        $id = absint($row['post'] ?? 0);
        if (isset($positions[$id])) $result['switches'][] = array_merge($skin($row), array('afterFromEnd' => count($items) - $positions[$id]));
    }
    return $result;
}

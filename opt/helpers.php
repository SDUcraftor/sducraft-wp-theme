<?php
/** Shared option accessors; no feature logic. */
defined('ABSPATH') || exit;

function sducraft_opt($key, $default = null) {
    $options = get_option('sducraft_options', array());
    return is_array($options) && array_key_exists($key, $options) ? $options[$key] : $default;
}

function sducraft_setting_number($key, $default, $min, $max) {
    $value = sducraft_opt($key, $default);
    return max($min, min($max, is_numeric($value) ? (float) $value : $default));
}

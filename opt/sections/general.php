<?php
/** Settings fields registered in the scope of opt/settings.php. */
defined('ABSPATH') || exit;

Sakurairo_CSF::createSection($prefix, array('id' => 'sducraft_general', 'title' => '通用设置', 'icon' => 'fa fa-globe'));
Sakurairo_CSF::createSection($prefix, array('parent' => 'sducraft_general', 'title' => '文章导航', 'icon' => 'fa fa-exchange-alt', 'fields' => array($field('nextprev_same_category', '上一篇／下一篇范围', 'select', '1', array('options' => array('1' => '同一分类', '0' => '全站'), 'desc' => '显示开关仍由 iro 主题设置控制。')))));

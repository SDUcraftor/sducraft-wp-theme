# SDUCraft Minecraft Footer

This component is integrated with the Sakurairo child theme through `wp_footer`.
It does not override the parent theme's `footer.php`, so Sakurairo updates can
continue to change the original footer safely.

## Files

- `bootstrap.php`: registers assets and renders the component.
- `mc-footer.php`: WordPress template markup and configuration attributes.
- `mc-footer.css`: component-scoped styles.
- `mc-footer.js`: interaction state machine.
- `assets/`: block textures, tools, particles, and audio.

The child theme loads this directory from its root `functions.php`:

```php
require_once get_stylesheet_directory() . '/footer/bootstrap.php';
```

## Configuration

Defaults can be changed with the `sducraft_mc_footer_config` filter:

```php
add_filter('sducraft_mc_footer_config', function ($config) {
    $config['reveal_delay'] = 4000;
    $config['ignition_attempts'] = 5;
    $config['scroll_threshold'] = 600;
    return $config;
});
```

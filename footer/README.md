# SDUCraft Minecraft Footer

This component is integrated with the Sakurairo child theme through `wp_footer`.
It does not override the parent theme's `footer.php`, so Sakurairo updates can
continue to change the original footer safely.

## Files

- `bootstrap.php`: registers assets and renders the component.
- `easter-eggs.php`: site-specific PHP easter-egg registrations.
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

## Block coordinates and extension events

Every generated cell exposes these data attributes:

- `data-column`: the actual responsive grid column.
- `data-x-ratio`: the stable horizontal position from `0` to `1`.
- `data-row`: the actual grid row.
- `data-depth`: depth relative to the grass row. Grass is `0`, the first dirt
  row is `1`, and the first stone row is `4`.
- `data-type`: the block type.

Register an easter egg in `easter-eggs.php`. The horizontal
position is resolution independent; it is resolved to the nearest mineable
block in the requested depth when the world is built.

The file contains one complete, enabled example using the bundled bedrock
texture. Copy that registration when adding another easter egg, then directly
replace its title, image markup, description, `x`, and `depth` values.

```php
add_filter('sducraft_mc_footer_easter_eggs', function ($eggs) {
    $eggs[] = array(
        'id'      => 'hidden-note',
        'x'       => 0.65,
        'depth'   => 7,
        'title'   => 'Hidden note',
        'render'  => function ($egg) {
            ?>
            <p>You found an easter egg rendered by PHP.</p>
            <p><?php echo do_shortcode('[your_shortcode]'); ?></p>
            <?php
        },
    );
    return $eggs;
});
```

When that block is mined, the footer automatically opens a dialog containing
the output of `render`. The callback may output normal PHP template markup or
return an HTML string; it can use images, shortcodes, buttons, or dynamic
WordPress data. Its `$egg` argument is the complete registration array. For
simple trusted text/HTML, use `content` instead of `render`; `content` is
passed through `wp_kses_post()`.

`render` and `content` stay on the server and are deliberately omitted from the
JSON metadata sent to the mining code. Other scalar fields in the registration
array remain available in the JavaScript events.

External JavaScript can react without changing the mining code:

```js
document.addEventListener('sducraft:block-mined', (event) => {
    const egg = event.detail.easterEggs.find((item) => item.id === 'hidden-note');
    if (egg) window.alert(egg.message);
});
```

Available events:

- `sducraft:world-built`: reports responsive world dimensions and resolved
  easter-egg positions.
- `sducraft:block-before-break`: fires immediately before breaking. It is
  cancelable with `event.preventDefault()`.
- `sducraft:block-mined`: fires after a block is broken and includes its
  coordinates, type, world dimensions, and matching easter-egg metadata.

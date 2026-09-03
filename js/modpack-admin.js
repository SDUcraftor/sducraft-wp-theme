(function ($) {
    'use strict';

    var list = $('#sducraft-modpack-downloads-list');

    function syncPlatformCustom(scope) {
        $(scope).find('.sducraft-platform-select').each(function () {
            var custom = $(this).closest('.sducraft-platform-field').find('.sducraft-platform-custom');
            custom.prop('hidden', this.value !== 'other');
        });
    }

    syncPlatformCustom(document);

    $('#sducraft-add-download').on('click', function () {
        var index = 'new_' + Date.now();
        list.append(wp.template('sducraft-modpack-download')({ index: index }));
        syncPlatformCustom(list);
    });

    list.on('change', '.sducraft-platform-select', function () {
        syncPlatformCustom($(this).closest('.sducraft-platform-field'));
    });

    list.on('click', '.sducraft-remove-download', function () {
        $(this).closest('.sducraft-download-row').remove();
    });

    list.on('click', '.sducraft-select-download', function () {
        var row = $(this).closest('.sducraft-download-row');
        var frame = wp.media({
            title: '选择整合包文件',
            button: { text: '使用此文件' },
            multiple: false
        });

        frame.on('select', function () {
            var attachment = frame.state().get('selection').first().toJSON();
            row.find('.sducraft-download-url').val(attachment.url);
            row.find('.sducraft-download-attachment-id').val(attachment.id);
        });

        frame.open();
    });

    if (typeof inlineEditPost !== 'undefined') {
        var originalInlineEdit = inlineEditPost.edit;
        inlineEditPost.edit = function (id) {
            originalInlineEdit.apply(this, arguments);

            var postId = typeof id === 'object' ? parseInt(this.getId(id), 10) : parseInt(id, 10);
            var row = $('#post-' + postId);
            var editRow = $('#edit-' + postId);
            var data = row.find('.sducraft-modpack-quick-data');

            if (!data.length || !editRow.length) {
                return;
            }

            editRow.find('[name="sducraft_quick[minecraft_version]"]').val(data.attr('data-minecraft-version'));
            editRow.find('[name="sducraft_quick[modpack_version]"]').val(data.attr('data-modpack-version'));
            editRow.find('[name="sducraft_quick[author]"]').val(data.attr('data-author'));
            editRow.find('[name="sducraft_quick[status]"]').val(data.attr('data-status'));
        };
    }
}(jQuery));

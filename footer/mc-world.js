(() => {
    'use strict';

    const blocks = window.sducraftMCWorldData.blocks;

    // Layers are ordered from the top of the world to the bottom.
    const settings = window.sducraftMCWorldData.settings;
    const layers = settings.layers;

    // Structures replace the base layer at matching cells. Coordinates use
    // depth relative to grass: grass is 0 and the row above it is -1.
    const structures = [
        function oakTree(cell) {
            if (!settings.oakTree || layers[0].count < 6) return null;
            if (cell.baseType !== 'sky') return null;

            const treeColumn = Math.floor(cell.columns * 0.72);
            const distance = Math.abs(cell.column - treeColumn);

            if (cell.column === treeColumn && cell.depth >= -4 && cell.depth <= -1) return 'log';
            if (cell.depth === -6 && distance <= 1) return 'leaves';
            if ((cell.depth === -5 || cell.depth === -4) && distance <= 2) return 'leaves';
            if (cell.depth === -3 && distance <= 1) return 'leaves';
            return null;
        },
        function sapling(cell) {
            if (!settings.sapling) return null;
            if (cell.baseType !== 'sky') return null;
            if (cell.depth === -1 && cell.column === Math.floor(cell.columns * 0.25)) return 'sapling';
            return null;
        },
    ];

    function getLayout() {
        let row = 0;
        let surfaceRow = -1;
        const ranges = layers.map((layer) => {
            if (!blocks[layer.type]) {
                throw new Error(`Unknown SDUCraft MC layer block type: ${layer.type}`);
            }
            const count = Math.max(0, Math.trunc(Number(layer.count) || 0));
            const range = { type: layer.type, start: row, end: row + count };
            if (surfaceRow < 0 && layer.type === 'grass' && count > 0) surfaceRow = row;
            row += count;
            return range;
        }).filter((range) => range.end > range.start);

        if (surfaceRow < 0) {
            throw new Error('SDUCraft MC world requires a grass layer.');
        }

        return { rows: row, surfaceRow, ranges };
    }

    function getType({ row, column, columns, layout }) {
        const range = layout.ranges.find((item) => row >= item.start && row < item.end);
        const baseType = range?.type || 'sky';
        const cell = {
            row,
            column,
            columns,
            surfaceRow: layout.surfaceRow,
            depth: row - layout.surfaceRow,
            baseType,
        };

        for (const structure of structures) {
            const type = structure(cell);
            if (type && !blocks[type]) {
                throw new Error(`Unknown SDUCraft MC structure block type: ${type}`);
            }
            if (type) return type;
        }
        return baseType;
    }

    window.SDUCraftMCWorld = {
        blocks,
        layers,
        structures,
        miningSpeed: settings.miningSpeed,
        getLayout,
        getType,
        getBlock(type) {
            return blocks[type] || blocks.sky;
        },
    };
})();

import { accent } from './colors.js';

/**
 * Builds panel controls from data, using the `dp-*` components in demo-ui.css.
 *
 * Demos whose controls are fixed write them in HTML. These helpers are for controls
 * that come from a library registry (the instrument presets, an effect's parameters),
 * so the panel stays in step with the library without each demo listing them.
 */

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
}

/** Formats a parameter value to fit the narrow `.dp-val` column. */
export function formatValue(v, unit = '', step = 0.01) {
    // Whole hertz, never abbreviated, so the value shown is the value played.
    if (unit === 'Hz') return `${Math.round(v)}`;
    if (unit === 's') return v < 1 ? `${Math.round(v * 1000)}ms` : `${v.toFixed(1)}s`;
    if (unit === 'dB') return `${Math.round(v)}`;
    // A whole-number slider shows whole numbers.
    if (step >= 1) return `${Math.round(v)}`;
    return Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
}

// Per-slider value mapping and readout, so setRange can move a slider from code.
const ranges = new WeakMap();

/**
 * Appends a labeled slider row. The track fills with the accent color up to the
 * value; `color` sets that accent for this row (otherwise it inherits `--accent`).
 * @param {HTMLElement} parent
 * @param {object} p  `label`, `min`, `max`, `value`, and optionally `step`, `unit`,
 *                    `scale: 'log'`, `live: false`, `color`, `onChange(value)`.
 * @returns {HTMLInputElement}
 */
export function addRange(parent, { label, min, max, value, step = 0.01, unit = '', scale = 'linear', live = true, color, onChange }) {
    const row = el('div', 'dp-row');
    const input = el('input', 'dp-range');
    const val = el('span', 'dp-val');
    input.type = 'range';

    // A log slider runs over 0–1000 and maps exponentially between min and max. Its
    // value is then snapped to `step`, as a linear slider's is by the input itself, so
    // the readout and onChange always get the same exact value.
    const log = scale === 'log';
    const toSlider = v => log ? Math.round(1000 * Math.log(v / min) / Math.log(max / min)) : v;
    const snap = v => Math.min(max, Math.max(min, Math.round(v / step) * step));
    const fromSlider = s => log ? snap(min * Math.pow(max / min, s / 1000)) : s;
    if (log) { input.min = 0; input.max = 1000; input.step = 1; }
    else { input.min = min; input.max = max; input.step = step; }
    input.value = toSlider(value);
    val.textContent = formatValue(value, unit, step);
    if (color) row.style.setProperty('--accent', color);
    fillTrack(input);

    input.addEventListener('input', () => {
        const v = fromSlider(Number(input.value));
        val.textContent = formatValue(v, unit, step);
        fillTrack(input);
        if (live) onChange?.(v);
    });
    if (!live) input.addEventListener('change', () => onChange?.(fromSlider(Number(input.value))));

    row.append(el('span', 'dp-label', label), input, val);
    parent.append(row);
    ranges.set(input, { toSlider, readout: val, unit, step });
    return input;
}

/** Moves a slider made by addRange to `value` and updates its readout, without firing onChange. */
export function setRange(input, value) {
    const { toSlider, readout, unit, step } = ranges.get(input);
    input.value = toSlider(value);
    readout.textContent = formatValue(value, unit, step);
    fillTrack(input);
}

/** Sets `--fill`, the share of the track drawn in the accent color, from the slider's position. */
function fillTrack(input) {
    const min = Number(input.min), max = Number(input.max);
    const t = max > min ? (Number(input.value) - min) / (max - min) : 0;
    input.style.setProperty('--fill', `${(t * 100).toFixed(2)}%`);
}

/**
 * Appends a select. `options` is a list of `{ value, label, group? }`; items that
 * share a `group` are gathered into one optgroup. The select gives up focus after a
 * change, so the computer keyboard goes back to playing notes.
 * @returns {HTMLSelectElement}
 */
export function addSelect(parent, { label, options, value, onChange }) {
    const select = el('select', 'dp-select');
    const groups = new Map();
    for (const opt of options) {
        const option = el('option', null, opt.label);
        option.value = opt.value;
        if (opt.group) {
            if (!groups.has(opt.group)) {
                const optgroup = el('optgroup');
                optgroup.label = opt.group;
                groups.set(opt.group, optgroup);
                select.append(optgroup);
            }
            groups.get(opt.group).append(option);
        } else {
            select.append(option);
        }
    }
    select.value = value;
    select.addEventListener('change', () => { onChange?.(select.value); select.blur(); });

    if (label) {
        const row = el('div', 'dp-row');
        row.append(el('span', 'dp-label', label), select);
        parent.append(row);
    } else {
        parent.append(select);
    }
    return select;
}

/**
 * Appends a collapsible `.dp-section` and returns its body for the caller to fill.
 * `color` sets the accent for the section and the controls in it.
 * Wired directly, so it does not depend on `wireCollapsibles` running afterward.
 */
export function addSection(parent, title, { collapsed = false, color } = {}) {
    const section = el('div', collapsed ? 'dp-section collapsed' : 'dp-section');
    if (color) section.style.setProperty('--accent', color);
    const header = el('div', 'dp-section-hd');
    header.append(el('span', 'dp-chevron'), el('span', null, title));
    header.addEventListener('click', () => section.classList.toggle('collapsed'));
    const body = el('div', 'dp-section-body');
    section.append(header, body);
    parent.append(section);
    return body;
}

/**
 * Appends one collapsible section per effect in an EffectChain, with a slider per
 * parameter. Each section takes the next accent color.
 */
export function addEffectControls(parent, chain, { collapsed = false } = {}) {
    chain.effects.forEach(({ def, values }, i) => {
        const body = addSection(parent, def.label, { collapsed, color: accent(i + 1) });
        for (const param of def.params) {
            addRange(body, {
                ...param,
                value: values[param.key],
                onChange: v => chain.set(def.id, param.key, v),
            });
        }
    });
}

/**
 * Replaces a mount element (an empty element in the demo's HTML that marks where
 * built controls go) with the controls built into it, so they sit directly in the
 * panel without an extra container. Call it after the controls are built.
 */
export function unwrap(mount) {
    mount.replaceWith(...mount.childNodes);
}

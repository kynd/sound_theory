/**
 * Wires every `.dp-section` in the document so clicking its header collapses it.
 *
 * Shared rather than repeated per demo, so a section behaves the same everywhere.
 * Mark a section `class="dp-section collapsed"` to have it start closed.
 */
export function wireCollapsibles(root = document) {
    root.querySelectorAll('.dp-section-hd').forEach(header => {
        header.addEventListener('click', () => {
            header.closest('.dp-section')?.classList.toggle('collapsed');
        });
    });
}

/**
 * Wires a button that starts and stops a continuous source (anything with `start()`,
 * `stop()`, and `playing`). The button reads Play or Stop. `startAudio` is called
 * first, since the click is the user gesture that unlocks audio, but not awaited
 * (see startAudio).
 */
export function wirePlayButton(button, source, startAudio) {
    const sync = () => { button.textContent = source.playing ? 'Stop' : 'Play'; };
    button.addEventListener('click', () => {
        if (source.playing) source.stop();
        else { startAudio(); source.start(); }
        sync();
    });
    sync();
    // Returned so a source that stops by itself (a Sequence) can update the label.
    return sync;
}

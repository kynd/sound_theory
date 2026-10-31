import * as Tone from 'tone';

/**
 * Effects described as data: a factory for the Tone node and the parameters a demo
 * can expose. Panels are generated from `params`, so a new parameter appears in every
 * demo that shows the effect.
 *
 * A parameter has `key`, `label`, `min`, `max`, `value` (its default), and `apply`,
 * which writes a value to the node. Optional: `step`, `unit` ('Hz', 's'),
 * `scale: 'log'` for a slider that moves evenly in octaves or decades, and
 * `live: false` for a parameter that is expensive to change and should only apply
 * when the slider is released.
 *
 * Every effect with a dry/wet mix starts at Mix 0, so a chain is transparent until
 * the user turns an effect up.
 */
const MIX = {
    key: 'mix', label: 'Mix', min: 0, max: 1, step: 0.01, value: 0,
    apply: (node, v) => node.wet.rampTo(v, 0.05),
};

export const EFFECTS = [
    {
        id: 'distortion', label: 'Distortion',
        create: () => new Tone.Distortion({ oversample: '4x' }),
        params: [
            { key: 'drive', label: 'Drive', min: 0, max: 1, step: 0.01, value: 0.4,
              apply: (node, v) => { node.distortion = v; } },
            MIX,
        ],
    },
    {
        id: 'filter', label: 'Filter',
        create: () => new Tone.Filter({ type: 'lowpass', rolloff: -12 }),
        params: [
            { key: 'cutoff', label: 'Cutoff', min: 40, max: 20000, step: 1, value: 20000, scale: 'log', unit: 'Hz',
              apply: (node, v) => node.frequency.rampTo(v, 0.02) },
            { key: 'resonance', label: 'Resonance', min: 0.1, max: 15, step: 0.1, value: 1,
              apply: (node, v) => node.Q.rampTo(v, 0.02) },
        ],
    },
    {
        id: 'delay', label: 'Delay',
        create: () => new Tone.FeedbackDelay({ maxDelay: 1 }),
        params: [
            { key: 'time', label: 'Time', min: 0.02, max: 1, step: 0.01, value: 0.25, unit: 's',
              apply: (node, v) => node.delayTime.rampTo(v, 0.05) },
            { key: 'feedback', label: 'Feedback', min: 0, max: 0.9, step: 0.01, value: 0.35,
              apply: (node, v) => node.feedback.rampTo(v, 0.05) },
            MIX,
        ],
    },
    {
        id: 'reverb', label: 'Reverb',
        create: () => new Tone.Reverb({ preDelay: 0.01 }),
        params: [
            // Changing the decay renders a new impulse response.
            { key: 'decay', label: 'Decay', min: 0.2, max: 10, step: 0.1, value: 2.5, unit: 's', live: false,
              apply: (node, v) => { node.decay = v; } },
            MIX,
        ],
    },
];

/**
 * A fixed series of effects between `input` and `output`, in the order given.
 * Connect an instrument to `input` and `output` onward to a MasterBus.
 */
export class EffectChain {
    /** @param {string[]} [ids] effect ids, in signal order. Defaults to every effect. */
    constructor(ids = EFFECTS.map(def => def.id)) {
        this.input = new Tone.Gain();
        this.output = new Tone.Gain();
        this.effects = ids.map(id => {
            const def = EFFECTS.find(d => d.id === id);
            if (!def) throw new Error(`Unknown effect: ${id}`);
            const node = def.create();
            const values = {};
            for (const param of def.params) {
                values[param.key] = param.value;
                param.apply(node, param.value);
            }
            return { def, node, values };
        });
        this.input.chain(...this.effects.map(fx => fx.node), this.output);
    }

    connect(destination) { this.output.connect(destination); return this; }

    get(id, key) { return this._effect(id).values[key]; }

    set(id, key, value) {
        const fx = this._effect(id);
        const param = fx.def.params.find(p => p.key === key);
        if (!param) throw new Error(`Unknown parameter: ${id}.${key}`);
        fx.values[key] = value;
        param.apply(fx.node, value);
    }

    dispose() {
        this.effects.forEach(fx => fx.node.dispose());
        this.input.dispose();
        this.output.dispose();
    }

    _effect(id) {
        const fx = this.effects.find(e => e.def.id === id);
        if (!fx) throw new Error(`Effect not in chain: ${id}`);
        return fx;
    }
}

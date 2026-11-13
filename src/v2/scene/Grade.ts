import { BlendFunction, Effect } from 'postprocessing'
import { Uniform, Vector3 } from 'three'

const fragment = /* glsl */ `
  uniform vec3 uShadow;
  uniform vec3 uHighlight;
  uniform float uSplit;
  uniform float uContrast;
  uniform float uLift;
  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec3 c = inputColor.rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    // multiplicative split-tone: tints the colour without lifting black
    float ws = 1.0 - smoothstep(0.02, 0.5, l);
    float wh = smoothstep(0.4, 0.95, l);
    c *= mix(vec3(1.0), uShadow * 2.0, ws * uSplit);
    c *= mix(vec3(1.0), uHighlight * 2.0, wh * uSplit);
    // filmic S-curve and a touch of black lift so the darks stay rich, not crushed
    vec3 s = c * c * (3.0 - 2.0 * c);
    c = mix(c, s, uContrast);
    c = c * (1.0 - uLift) + uLift * vec3(0.02, 0.018, 0.05);
    outputColor = vec4(clamp(c, 0.0, 1.0), inputColor.a);
  }
`

/** Cinematic colour grade (runs after tone mapping, in display range). */
export class GradeEffect extends Effect {
  constructor({ split = 0.6, contrast = 0.18, lift = 0.012 } = {}) {
    super('GradeEffect', fragment, {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map<string, Uniform>([
        ['uShadow', new Uniform(new Vector3(0.43, 0.44, 0.62))],
        ['uHighlight', new Uniform(new Vector3(0.6, 0.53, 0.42))],
        ['uSplit', new Uniform(split)],
        ['uContrast', new Uniform(contrast)],
        ['uLift', new Uniform(lift)],
      ]),
    })
  }
}

import { useEffect, useRef } from 'react';
import { FileText } from 'lucide-react';

// ─── WebGL Shader Background ──────────────────────────────────────────────────
function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    function syncSize() {
      const w = canvas!.clientWidth || 1280;
      const h = canvas!.clientHeight || 720;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(syncSize).observe(canvas);
    }
    syncSize();

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 a0 = x - floor(x + 0.5);
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 p = (uv - 0.5) * vec2(u_resolution.x/u_resolution.y, 1.0);

    // Botanical Intimacy Palette
    vec3 surface    = vec3(0.984, 0.976, 0.969); // #fbf9f7
    vec3 rose_deep  = vec3(0.478, 0.114, 0.282); // #7a1d48
    vec3 rose_mid   = vec3(0.831, 0.271, 0.498); // #d4457f
    vec3 blush_soft = vec3(0.957, 0.839, 0.890); // #f4d6e3

    float n1 = snoise(p * 0.5 + u_time * 0.02);
    float n2 = snoise(p * 1.2 - u_time * 0.04);
    float n3 = snoise(p * 0.8 + vec2(u_time * 0.015, -u_time * 0.02));

    vec3 color = surface;

    float bleed1 = smoothstep(-0.6, 0.6, n1);
    float bleed2 = smoothstep(-0.2, 0.8, n2);
    float bleed3 = smoothstep(0.0,  0.9, n3);

    color = mix(color, blush_soft, bleed1 * 0.4);
    color = mix(color, rose_mid,   bleed2 * 0.15);
    color = mix(color, rose_deep,  bleed3 * 0.08);

    float grain = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    color += (grain - 0.5) * 0.02;

    gl_FragColor = vec4(color, 1.0);
}`;

    function createShader(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vs));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(program);
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes  = gl.getUniformLocation(program, 'u_resolution');

    let animationId: number;
    function render(t: number) {
      if (typeof ResizeObserver === 'undefined') syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes)  gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animationId = requestAnimationFrame(render);
    }
    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none opacity-60"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// ─── Botanical Floating Accents ───────────────────────────────────────────────
function BotanicalAccents() {
  const svg = (
    <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`
        @keyframes sway {
          0%, 100% { transform: rotate(-1.5deg); }
          50% { transform: rotate(1.5deg); }
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .stem  { stroke: #7a1d48; stroke-width: 1.5; fill: none; stroke-dasharray: 400; stroke-dashoffset: 400; animation: draw 4s ease-out forwards; }
        .leaf  { fill: #d4457f; opacity: 0.4; transform-origin: center; animation: sway 8s ease-in-out infinite; }
        .bloom { fill: #f489b4; opacity: 0.3; transform-origin: center; animation: pulse 6s ease-in-out infinite; }
      `}</style>
      <path className="stem" d="M200,380 Q180,280 200,180 T220,50" />
      <path className="leaf" d="M190,300 Q140,280 150,230 Q175,250 190,300" />
      <path className="leaf" d="M210,250 Q260,230 250,180 Q225,200 210,250" style={{ animationDelay: '-2s' }} />
      <circle className="bloom" cx="220" cy="50" r="25" />
      <circle className="bloom" cx="200" cy="180" r="15" style={{ animationDelay: '-1s' }} />
    </svg>
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-20 left-10 w-32 h-32 opacity-40 animate-gentle-float">{svg}</div>
      <div className="absolute top-1/3 right-10 w-48 h-48 opacity-30 animate-gentle-float-delayed -scale-x-100">{svg}</div>
      <div className="absolute bottom-20 left-20 w-40 h-40 opacity-30 animate-gentle-float-slow">{svg}</div>
      <div className="absolute bottom-1/3 right-20 w-24 h-24 opacity-50 animate-gentle-float rotate-45">{svg}</div>
    </div>
  );
}

// ─── Material Symbol helper ───────────────────────────────────────────────────
// Renders a Material Symbols Outlined icon. fontVariationSettings controls
// fill (0=outlined, 1=filled), weight etc.
function MSIcon({
  name,
  className = 'text-[24px]',
  fill = 0,
}: {
  name: string;
  className?: string;
  fill?: number;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill}` }}
    >
      {name}
    </span>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LandingPageProps {
  onStart: () => void;
  onViewSample: () => void;
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
export function LandingPage({ onStart, onViewSample }: LandingPageProps) {
  return (
    <div className="min-h-screen relative bg-[#fbf9f7] overflow-x-hidden selection:bg-rose-800/20 selection:text-rose-900">
      {/* WebGL animated background */}
      <ShaderBackground />

      {/* Floating botanical accents */}
      <BotanicalAccents />

      {/* ── Desktop Navigation ── */}
      <header className="fixed top-0 w-full z-50 hidden md:flex justify-between items-center px-16 h-24 bg-[#fbf9f7]/30 backdrop-blur-md border-b border-white/20">
        <div className="font-display text-[32px] text-rose-900 tracking-wide">
          HerWellness
        </div>
        <nav className="flex items-center gap-10">
          {['Tracker', 'Case File', 'History', 'Rehearsal'].map((item) => (
            <a
              key={item}
              href="#"
              className="text-[12px] text-rose-600/70 hover:text-rose-900 hover:opacity-100 transition-all duration-300 tracking-[0.2em] uppercase font-semibold"
            >
              {item}
            </a>
          ))}
        </nav>
        <button
          onClick={onStart}
          className="w-12 h-12 rounded-full flex items-center justify-center bg-white/50 text-rose-900 hover:bg-white transition-colors shadow-sm"
          aria-label="Open app"
        >
          <MSIcon name="account_circle" className="text-[20px]" />
        </button>
      </header>

      {/* ── Mobile Navigation ── */}
      <header className="fixed top-0 w-full z-50 flex justify-center items-center h-20 bg-[#fbf9f7]/40 backdrop-blur-md md:hidden border-b border-white/20">
        <div className="font-display text-[28px] text-rose-900 tracking-wide">
          HerWellness
        </div>
      </header>

      {/* ── Main ── */}
      <main className="pt-32 md:pt-48 pb-24 px-6 md:px-16 max-w-[1400px] mx-auto flex flex-col items-center relative z-10">

        {/* ── Hero ── */}
        <section className="w-full flex flex-col items-center text-center mb-48 relative">
          {/* Handwritten annotation */}
          <div className="fade-up-1 absolute -top-16 md:-top-20 right-[5%] md:right-[20%] rotate-12 text-rose-800 font-script text-[28px] md:text-[32px] opacity-80 pointer-events-none">
            100% private &amp; anonymous
          </div>

          <h1 className="fade-up-2 font-display text-[56px] md:text-[80px] lg:text-[100px] text-rose-900 leading-[1.1] tracking-wide max-w-5xl mx-auto mb-10 z-10 relative">
            Your Symptoms,{' '}
            <br />
            <span className="italic font-light text-rose-600">Beautifully Heard.</span>
          </h1>

          <p className="fade-up-3 font-sans text-[20px] md:text-[24px] text-rose-700/80 max-w-3xl mx-auto mb-16 leading-loose font-light">
            A digital sanctuary designed for profound visibility. We believe tracking your health should feel like
            writing in a beautiful journal—private, intimate, and deeply validating.
          </p>

          <div className="fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Primary CTA */}
            <button
              onClick={onStart}
              className="btn-shimmer inline-flex items-center justify-center px-12 py-5 text-white rounded-full text-[13px] tracking-[0.2em] uppercase font-semibold"
            >
              <span className="flex items-center gap-3">
                Begin Your Journal
                <MSIcon name="arrow_forward" className="text-[18px]" />
              </span>
            </button>

            {/* Secondary CTA */}
            <button
              onClick={onViewSample}
              className="px-8 py-5 bg-white/60 backdrop-blur-sm border border-rose-300/40 text-rose-700 font-medium rounded-full text-sm hover:bg-white/80 hover:border-rose-400/60 transition-all hover:-translate-y-0.5"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-[18px] h-[18px]" />
                View Sample Case File
              </span>
            </button>
          </div>
        </section>

        {/* ── Features Grid ── */}
        <section className="w-full max-w-6xl mx-auto mb-48">
          <div className="text-center mb-24 fade-up-1">
            <h2 className="font-display text-[40px] md:text-[48px] text-rose-900 mb-6 italic tracking-wide">
              Empowering Your Narrative
            </h2>
            <p className="font-sans text-[18px] text-rose-700/70 max-w-2xl mx-auto font-light leading-loose">
              Tools designed for clarity, preparation, and peace of mind before your next clinical visit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {/* Card 1 – Case File */}
            <div className="fade-up-2 bg-white/60 backdrop-blur-2xl border border-rose-500/30 rounded-[2.5rem] p-12 flex flex-col items-center text-center gap-8 hover:-translate-y-2.5 transition-transform duration-500 group">
              <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center text-rose-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 transition-transform duration-500">
                <MSIcon name="folder_shared" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-display text-[32px] text-rose-900 mb-4 italic tracking-wide">Case File</h3>
                <p className="font-sans text-[16px] text-rose-700/80 leading-loose font-light">
                  A beautifully synthesized clinical summary of your logs, ready to hand to your practitioner.
                  No more scrambling for dates or forgotten symptoms.
                </p>
              </div>
            </div>

            {/* Card 2 – Rehearsal Mode (offset) */}
            <div className="fade-up-3 bg-white/60 backdrop-blur-2xl border border-rose-500/30 rounded-[2.5rem] p-12 flex flex-col items-center text-center gap-8 hover:-translate-y-2.5 transition-transform duration-500 group md:translate-y-12">
              <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center text-rose-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 transition-transform duration-500">
                <MSIcon name="psychology_alt" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-display text-[32px] text-rose-900 mb-4 italic tracking-wide">Rehearsal Mode</h3>
                <p className="font-sans text-[16px] text-rose-700/80 leading-loose font-light">
                  Practice articulating your concerns before appointments. Guided prompts help you build confidence
                  in expressing exactly what you're experiencing.
                </p>
              </div>
            </div>

            {/* Card 3 – Private Logging */}
            <div className="fade-up-4 bg-white/60 backdrop-blur-2xl border border-rose-500/30 rounded-[2.5rem] p-12 flex flex-col items-center text-center gap-8 hover:-translate-y-2.5 transition-transform duration-500 group">
              <div className="w-20 h-20 rounded-full bg-white/60 flex items-center justify-center text-plum-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group-hover:scale-110 transition-transform duration-500">
                <MSIcon name="lock_person" className="text-[32px]" />
              </div>
              <div>
                <h3 className="font-display text-[32px] text-rose-900 mb-4 italic tracking-wide">Private Logging</h3>
                <p className="font-sans text-[16px] text-rose-700/80 leading-loose font-light">
                  Your data remains yours. Secure, deeply personal journaling fields that feel like writing on
                  high-end stationery, shielded from prying eyes.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-20 px-6 flex flex-col items-center gap-8 text-center bg-transparent border-t border-white/30 backdrop-blur-sm relative z-10">
        <div className="font-display text-[40px] text-rose-900 mb-2 opacity-80 tracking-wide">
          HerWellness
        </div>
        <div className="flex gap-10 mb-4">
          {['Privacy', 'Terms', 'Trust'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-[11px] text-rose-600/60 hover:text-rose-900 transition-colors tracking-[0.2em] uppercase font-semibold"
            >
              {link}
            </a>
          ))}
        </div>
        <p className="font-sans text-[12px] text-rose-600/50 max-w-md tracking-wide font-light leading-relaxed">
          &copy; 2026 HerWellness. Clinical disclaimer: For informational purposes only.
          Not intended to diagnose or treat medical conditions.
        </p>
      </footer>
    </div>
  );
}

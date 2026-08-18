var e=Math.PI*2;function t(e){let t=e.replace(`#`,``).trim();if(t.length===3&&(t=[...t].map(e=>e+e).join(``)),!/^[0-9a-fA-F]{6}$/.test(t))throw TypeError(`Theme sweep colours must use three- or six-digit hex notation`);let n=Number.parseInt(t,16);return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]}function n(e,t,n){let r=e.createShader(t);if(!r)throw Error(`Unable to allocate the theme sweep shader`);if(e.shaderSource(r,n),e.compileShader(r),!e.getShaderParameter(r,e.COMPILE_STATUS)){let t=e.getShaderInfoLog(r)??`Unknown shader compilation error`;throw e.deleteShader(r),Error(t)}return r}function r(e){return e<.5?4*e*e*e:1-(-2*e+2)**3/2}function i(e){return e===`always`||e!==`never`&&window.matchMedia(`(prefers-reduced-motion: reduce)`).matches}function a(e,t){t.onMidpoint?.();let n={reason:e,midpointReached:!0};return t.onComplete?.(n),{cancel:()=>void 0,finished:Promise.resolve(n)}}function o(o){let s=t(o.accent),c=t(o.companion),l=Math.max(1,o.durationMs??1800),u=Math.min(.95,Math.max(.05,o.midpoint??.44)),d=o.reducedMotion??`system`;if(typeof window>`u`||typeof document>`u`)return a(`unavailable`,o);if(i(d))return a(`reduced-motion`,o);let f=document.createElement(`canvas`);f.dataset.themeSweep=``,f.setAttribute(`aria-hidden`,`true`),o.className&&(f.className=o.className),Object.assign(f.style,{position:`fixed`,inset:`0`,width:`100%`,height:`100%`,pointerEvents:`none`,zIndex:String(o.zIndex??2147483646)});let p=f.getContext(`webgl`,{alpha:!0,premultipliedAlpha:!1,antialias:!1,depth:!1,stencil:!1,powerPreference:`high-performance`});if(!p)return a(`unavailable`,o);let m=null,h=null,g=null,_=null,v=0,y=null,b=!1,x=!1,S=!1,C,w,T=new Promise((e,t)=>{C=e,w=t}),E=e=>{if(S)return;S=!0;let t={reason:e,midpointReached:b};o.onComplete?.(t),C(t)},D=()=>{x||(x=!0,window.cancelAnimationFrame(v),window.removeEventListener(`resize`,M),_&&p.deleteBuffer(_),g&&p.deleteProgram(g),m&&p.deleteShader(m),h&&p.deleteShader(h),p.getExtension(`WEBGL_lose_context`)?.loseContext(),f.remove())},O=()=>{x||(D(),E(`cancelled`))},k=null,A=null,j=null,M=()=>{let e=f.getBoundingClientRect(),t=Math.min(window.devicePixelRatio||1,2);f.width=Math.max(1,Math.floor(e.width*t)),f.height=Math.max(1,Math.floor(e.height*t)),p.viewport(0,0,f.width,f.height),k&&p.uniform2f(k,f.width,f.height)};try{if(m=n(p,p.VERTEX_SHADER,`
attribute vec2 p;

void main() {
  gl_Position = vec4(p, 0.0, 1.0);
}
`),h=n(p,p.FRAGMENT_SHADER,`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_res;
uniform float u_progress;
uniform float u_time;
uniform vec3 u_a;
uniform vec3 u_b;
uniform float u_tight;
uniform float u_seed;
uniform float u_reverse;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 3; i++) {
    value += amplitude * vnoise(p);
    p = p * 2.0 + 17.0;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float time = u_time;
  float seed = u_seed;
  float travelUp = mix(-0.6, 1.6, u_progress);
  float travelDown = mix(1.6, -0.6, u_progress);
  float travel = mix(travelUp, travelDown, u_reverse);

  float frequencyA = 3.0 + 1.2 * sin(seed);
  float frequencyB = 6.0 + 1.8 * sin(seed * 1.7 + 1.0);
  float waveA = sin(uv.x * frequencyA + time * 1.3 + seed);
  float waveB = sin(uv.x * frequencyB - time * 0.9 + 1.4 * waveA + seed * 2.3);
  float turbulence = fbm(vec2(uv.x * 2.2 + seed, time * 0.4)) - 0.5;
  float wave = 0.13 * waveA + 0.07 * waveB + 0.09 * turbulence;

  float distanceToBand = uv.y - (travel + wave);
  float glow = exp(-distanceToBand * distanceToBand * u_tight);

  float clouds = fbm(
    vec2(uv.x * 3.4 - time * 0.45, uv.y * 3.4 + time * 0.3) + seed * 3.0
  );
  float striation = 0.5 + 0.5 * sin(
    uv.y * 46.0 + uv.x * 5.0 + clouds * 8.0 - time * 4.0 + seed * 4.0
  );
  float textureValue = (0.58 + 0.42 * clouds) * (0.8 + 0.2 * striation);

  float across = clamp(0.5 + distanceToBand, 0.0, 1.0);
  vec3 color = mix(u_a, u_b, across);
  color += 0.12 * cos(
    6.2831853 * (uv.x * 0.5 + clouds * 0.6 + time * 0.22 + vec3(0.0, 0.33, 0.67))
  );
  color += smoothstep(0.55, 1.0, glow) * 0.3;
  color += (hash(gl_FragCoord.xy + time * 91.7) - 0.5) * 0.085;

  float envelope = smoothstep(0.0, 0.07, u_progress)
    * (1.0 - smoothstep(0.9, 1.0, u_progress));
  float alpha = clamp(glow * textureValue, 0.0, 1.0) * envelope;
  gl_FragColor = vec4(color, alpha);
}
`),g=p.createProgram(),!g)throw Error(`Unable to allocate the theme sweep program`);if(p.attachShader(g,m),p.attachShader(g,h),p.linkProgram(g),!p.getProgramParameter(g,p.LINK_STATUS))throw Error(p.getProgramInfoLog(g)??`Unable to link the theme sweep program`);if(p.useProgram(g),_=p.createBuffer(),!_)throw Error(`Unable to allocate the theme sweep geometry`);p.bindBuffer(p.ARRAY_BUFFER,_),p.bufferData(p.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),p.STATIC_DRAW);let t=p.getAttribLocation(g,`p`);p.enableVertexAttribArray(t),p.vertexAttribPointer(t,2,p.FLOAT,!1,0,0),k=p.getUniformLocation(g,`u_res`),A=p.getUniformLocation(g,`u_progress`),j=p.getUniformLocation(g,`u_time`);let r=p.getUniformLocation(g,`u_a`),i=p.getUniformLocation(g,`u_b`),a=p.getUniformLocation(g,`u_tight`),l=p.getUniformLocation(g,`u_seed`),u=p.getUniformLocation(g,`u_reverse`);p.uniform3f(r,s[0],s[1],s[2]),p.uniform3f(i,c[0],c[1],c[2]),p.uniform1f(a,Math.max(1,o.tightness??9)),p.uniform1f(l,o.seed??e*Math.random()),p.uniform1f(u,+(o.direction===`down`)),p.enable(p.BLEND),p.blendFunc(p.SRC_ALPHA,p.ONE_MINUS_SRC_ALPHA),(o.appendTo??document.body).appendChild(f),M(),window.addEventListener(`resize`,M)}catch{D();try{o.onMidpoint?.(),b=!0,E(`unavailable`)}catch(e){w(e)}return{cancel:O,finished:T}}let N=e=>{y===null&&(y=e);let t=e-y,n=Math.min(t/l,1),i=r(n);if(!b&&i>=u){b=!0;try{o.onMidpoint?.()}catch(e){D(),w(e);return}}if(p.uniform1f(A,i),p.uniform1f(j,t/1e3),p.clearColor(0,0,0,0),p.clear(p.COLOR_BUFFER_BIT),p.drawArrays(p.TRIANGLES,0,3),n<1){v=window.requestAnimationFrame(N);return}b||(b=!0,o.onMidpoint?.()),D(),E(`completed`)};return v=window.requestAnimationFrame(N),{cancel:O,finished:T}}function s(e){let{theme:t,root:n,attribute:r=`data-theme`,applyTheme:i,onMidpoint:a,...s}=e;return o({...s,onMidpoint:()=>{(n??(typeof document<`u`?document.documentElement:null))?.setAttribute(r,t),i?.(),a?.()}})}function c(){let e=null;return{get active(){return e!==null},sweep(t){e?.cancel();let n=s(t);return e=n,n.finished.finally(()=>{e===n&&(e=null)}),n},cancel(){e?.cancel(),e=null}}}var l=`sociially:theme`,u=`sociially:theme-change`,d=900,f=[{id:`paper`,label:`Paper`,isDark:!1,colors:{background:`#fbfbf9`,textPrimary:`#73574a`,textSecondary:`rgba(154, 145, 138, 0.75)`,textInput:`#7e756c`,surface:`rgba(255, 255, 255, 0.72)`,surfaceMuted:`rgba(255, 255, 255, 0.24)`,mascotBody:`#ffffff`,mascotInk:`#73574a`,mascotTrail:`#73574a`},sweep:{accent:`#c58f73`,companion:`#ead6c8`}},{id:`nocturne`,label:`Nocturne`,isDark:!0,colors:{background:`#171310`,textPrimary:`#eadfd8`,textSecondary:`rgba(192, 178, 169, 0.78)`,textInput:`#d2c3ba`,surface:`rgba(39, 31, 27, 0.9)`,surfaceMuted:`rgba(255, 255, 255, 0.045)`,mascotBody:`#f7f0eb`,mascotInk:`#3b2922`,mascotTrail:`#c59686`},sweep:{accent:`#8f6558`,companion:`#6f4e66`}},{id:`cobalt`,label:`Cobalt`,isDark:!0,colors:{background:`#090d18`,textPrimary:`#bfd1ef`,textSecondary:`rgba(132, 156, 194, 0.82)`,textInput:`#9eb3d4`,surface:`rgba(19, 27, 47, 0.92)`,surfaceMuted:`rgba(114, 153, 217, 0.08)`,mascotBody:`#e8f0ff`,mascotInk:`#223861`,mascotTrail:`#78a5ff`},sweep:{accent:`#4f83ff`,companion:`#6e5cff`}},{id:`atelier`,label:`Atelier`,isDark:!1,colors:{background:`#faf6f7`,textPrimary:`#5e2440`,textSecondary:`rgba(156, 94, 126, 0.78)`,textInput:`#7a3f5a`,surface:`rgba(255, 255, 255, 0.76)`,surfaceMuted:`rgba(224, 99, 154, 0.07)`,mascotBody:`#fff4f8`,mascotInk:`#7a3f5a`,mascotTrail:`#d96192`},sweep:{accent:`#e07a9e`,companion:`#f4a7c0`}},{id:`mint`,label:`Mint`,isDark:!1,colors:{background:`#f0fbf4`,textPrimary:`#0d4d2e`,textSecondary:`rgba(63, 138, 99, 0.78)`,textInput:`#286e49`,surface:`rgba(255, 255, 255, 0.74)`,surfaceMuted:`rgba(39, 200, 120, 0.07)`,mascotBody:`#ecfff4`,mascotInk:`#0d4d2e`,mascotTrail:`#16864e`},sweep:{accent:`#10a85e`,companion:`#27c878`}},{id:`amber-crt`,label:`Amber CRT`,isDark:!0,colors:{background:`#0c0700`,textPrimary:`#ffb44d`,textSecondary:`rgba(194, 130, 58, 0.84)`,textInput:`#d89643`,surface:`rgba(38, 22, 4, 0.9)`,surfaceMuted:`rgba(255, 180, 77, 0.065)`,mascotBody:`#fff0d6`,mascotInk:`#3c1b00`,mascotTrail:`#ff9a2f`},sweep:{accent:`#ff7a18`,companion:`#ffb44d`}}],p=document.documentElement,m=document.querySelector(`[data-theme-toggle]`),h=m?.querySelector(`.theme-toggle__icon`),g=document.querySelector(`[data-theme-status]`),_=window.matchMedia(`(prefers-reduced-motion: reduce)`),v=c(),y=0,b=!1;function x(e){return f.find(t=>t.id===e)??f[0]}function S(e){return f[(f.findIndex(t=>t.id===e)+1)%f.length]??f[0]}function C(e){let t=Number.parseInt(e.replace(`#`,``),16);return`${t>>16&255}, ${t>>8&255}, ${t&255}`}function w(e,t=!0){if(p.dataset.theme=e.isDark?`dark`:`light`,p.dataset.themeName=e.id,p.style.setProperty(`--color-bg`,e.colors.background),p.style.setProperty(`--color-text-primary`,e.colors.textPrimary),p.style.setProperty(`--primary-rgb`,C(e.colors.textPrimary)),p.style.setProperty(`--color-text-secondary`,e.colors.textSecondary),p.style.setProperty(`--color-text-input`,e.colors.textInput),p.style.setProperty(`--color-surface`,e.colors.surface),p.style.setProperty(`--color-surface-muted`,e.colors.surfaceMuted),p.style.setProperty(`--color-mascot-body`,e.colors.mascotBody),p.style.setProperty(`--color-mascot-ink`,e.colors.mascotInk),p.style.setProperty(`--color-mascot-trail`,e.colors.mascotTrail),document.querySelector(`meta[name="theme-color"]`)?.setAttribute(`content`,e.colors.background),window.dispatchEvent(new CustomEvent(u,{detail:{themeId:e.id}})),t)try{window.localStorage.setItem(l,e.id)}catch{}}function T(e){if(!m)return;let t=S(e.id);m.setAttribute(`aria-label`,`Switch to ${t.label} theme`),m.setAttribute(`title`,`Next theme: ${t.label}`)}function E(){let e=p.dataset.themeName;if(f.some(t=>t.id===e))return x(e);try{let e=window.localStorage.getItem(l);return x(e===`dark`?`nocturne`:e)}catch{return f[0]}}var D=E();w(D,!1),T(D);function O(){if(window.clearTimeout(y),_.matches){p.classList.remove(`theme-animating`);return}p.classList.add(`theme-animating`),y=window.setTimeout(()=>{p.classList.remove(`theme-animating`),y=0},d)}function k(){!h||_.matches||(h.classList.remove(`theme-pen-shake`),h.offsetWidth,h.classList.add(`theme-pen-shake`))}m?.addEventListener(`click`,()=>{if(b)return;let e=S(D.id);b=!0,m.dataset.animating=`true`,m.setAttribute(`aria-disabled`,`true`),k(),v.sweep({theme:e.id,accent:e.sweep.accent,companion:e.sweep.companion,midpoint:.44,durationMs:1800,reducedMotion:`system`,applyTheme:()=>{O(),w(e,!0),D=e,T(D),g&&(g.textContent=`${D.label} theme active`)},onComplete:()=>{b=!1,delete m.dataset.animating,m.removeAttribute(`aria-disabled`),h?.classList.remove(`theme-pen-shake`)}})}),window.addEventListener(`pagehide`,()=>{v.cancel(),window.clearTimeout(y),p.classList.remove(`theme-animating`)},{once:!0});
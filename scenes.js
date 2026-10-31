// 3D scenes built with Three.js: the hero particle wave and the interactive "skill universe".
// Loaded after the page is interactive; everything still works if WebGL or the CDN is unavailable.
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js";
const root = document.documentElement;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isSmall = () => matchMedia("(max-width: 600px)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const PALETTE = ["#2997ff", "#a970ff", "#ff6ba3", "#ff9f0a", "#30d158", "#40c8e0"];

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// Runs `frame` on every animation frame, but only while `el` is on screen
function loopWhileVisible(el, frame) {
  let raf = 0;
  let running = false;
  const tick = (ms) => {
    frame(ms / 1000);
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !running) {
      running = true;
      raf = requestAnimationFrame(tick);
    } else if (!entry.isIntersecting && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }, { rootMargin: "120px" }).observe(el);
}

/* ---------------------------------------------------------------- Hero wave */

function heroWave(THREE, hero, canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  const COLS = isSmall() ? 64 : 150;
  const ROWS = isSmall() ? 36 : 64;
  const W = isSmall() ? 26 : 48;
  const D = 34;
  const positions = new Float32Array(COLS * ROWS * 3);
  const colors = new Float32Array(COLS * ROWS * 3);
  const stops = ["#0071e3", "#8e44ec", "#e4447a"].map((c) => new THREE.Color(c));
  const tmp = new THREE.Color();
  let k = 0;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const u = c / (COLS - 1);
      positions.set([(u - 0.5) * W, 0, 6 - (r / (ROWS - 1)) * D], k * 3);
      tmp.lerpColors(u < 0.5 ? stops[0] : stops[1], u < 0.5 ? stops[1] : stops[2], u < 0.5 ? u * 2 : (u - 0.5) * 2);
      colors.set([tmp.r, tmp.g, tmp.b], k * 3);
      k++;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(999, 999) },
    uRipple: { value: new THREE.Vector3(0, 0, -100) },
    uSize: { value: 60 },
    uOpacity: { value: 0.7 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime, uSize;
      uniform vec2 uMouse;
      uniform vec3 uRipple;
      attribute vec3 aColor;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec3 p = position;
        float h = sin(p.x * 0.32 + uTime * 0.6) * 0.45
                + cos(p.z * 0.42 + uTime * 0.45) * 0.35
                + sin((p.x + p.z) * 0.18 + uTime * 0.3) * 0.3;
        float d = distance(p.xz, uMouse);
        h += exp(-d * d * 0.06) * 1.4;                         // bump under the cursor
        float age = uTime - uRipple.z;
        float rd = distance(p.xz, uRipple.xy);
        h += exp(-pow(rd - age * 9.0, 2.0) * 0.35) * exp(-age * 1.1) * 1.3; // click ripple
        p.y += h;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (1.0 + h * 0.18) / -mv.z;
        vColor = aColor;
        vAlpha = smoothstep(-28.0, 2.0, p.z) * smoothstep(0.0, 0.25, 1.0 - abs(p.x) / ${(W / 2).toFixed(1)});
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        gl_FragColor = vec4(vColor, vAlpha * uOpacity * smoothstep(0.5, 0.15, r));
      }`,
  });
  scene.add(new THREE.Points(geometry, material));

  const applyTheme = () => {
    const dark = root.dataset.theme === "dark";
    material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    uniforms.uOpacity.value = dark ? 0.85 : 0.55;
    material.needsUpdate = true;
    if (reduceMotion) render();
  };
  new MutationObserver(applyTheme).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  const resize = () => {
    const { width, height } = hero.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Keep the wave in the lower part of tall (phone) heroes
    camera.fov = camera.aspect < 0.8 ? 62 : 50;
    camera.updateProjectionMatrix();
    uniforms.uSize.value = (isSmall() ? 70 : 60) * renderer.getPixelRatio();
    if (reduceMotion) render();
  };
  new ResizeObserver(resize).observe(hero);

  // Pointer: parallax + a bump that follows the cursor on the wave
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const ndc = new THREE.Vector2();
  const target = new THREE.Vector2(999, 999);
  const parallax = { x: 0, y: 0 };
  let now = 0;
  const pointAt = (e) => {
    const r = hero.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(plane, hit);
  };
  hero.addEventListener("pointermove", (e) => {
    parallax.x = ndc.x;
    parallax.y = ndc.y;
    if (pointAt(e)) target.set(hit.x, hit.z);
  });
  hero.addEventListener("pointerleave", () => target.set(999, 999));
  hero.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a, button, input, textarea")) return;
    if (pointAt(e)) uniforms.uRipple.value.set(hit.x, hit.z, now);
  });

  function render() {
    camera.position.set(parallax.x * 2.2, 5.2 + parallax.y * 0.8, 12);
    camera.lookAt(0, 0, -8);
    renderer.render(scene, camera);
  }

  resize();
  applyTheme();
  if (reduceMotion) return render();

  const mouse = uniforms.uMouse.value;
  const cam = { x: 0, y: 0 };
  loopWhileVisible(hero, (t) => {
    now = t;
    uniforms.uTime.value = t;
    if (target.x > 900) mouse.set(999, 999);
    else if (mouse.x > 900) mouse.copy(target);
    else mouse.lerp(target, 0.08);
    cam.x += (parallax.x - cam.x) * 0.04;
    cam.y += (parallax.y - cam.y) * 0.04;
    camera.position.set(cam.x * 2.2, 5.2 + cam.y * 0.8, 12);
    camera.lookAt(0, 0, -8);
    renderer.render(scene, camera);
  });
}

/* ------------------------------------------------------------ Skill universe */

function skillUniverse(THREE, el) {
  const stage = el.querySelector(".universe-stage");
  const canvas = stage.querySelector("canvas");
  const labelsEl = stage.querySelector(".universe-labels");
  const tip = stage.querySelector(".universe-tip");
  const legend = el.querySelector(".universe-legend");
  const countEl = el.querySelector(".universe-count");

  // Skills come from the skill cards already on the page (and so from content.json)
  const groups = [...document.querySelectorAll(".skills-grid .card")].map((card, gi) => ({
    name: card.querySelector("h3")?.textContent.trim() || `Group ${gi + 1}`,
    color: new THREE.Color(PALETTE[gi % PALETTE.length]),
    hex: PALETTE[gi % PALETTE.length],
    items: [...card.querySelectorAll(".tags li")].map((li) => li.textContent.trim()),
  }));
  const nodes = groups.flatMap((g, gi) => g.items.map((name) => ({ name, gi })));
  const N = nodes.length;
  if (!N) return;
  if (countEl) countEl.textContent = `${N} skills · ${groups.length} fields`;

  const R = 5;
  const G = groups.length;
  // Each field gets its own patch of the sphere: field centres are spread with a
  // Fibonacci lattice, and skills spiral around their field's centre.
  const fib = (i, n) => {
    const y = 1 - ((i + 0.5) / n) * 2;
    const r = Math.sqrt(1 - y * y);
    return new THREE.Vector3(Math.cos(i * 2.399963) * r, y, Math.sin(i * 2.399963) * r);
  };
  const cap = Math.min(0.75, 1.9 / Math.sqrt(G)); // patch radius in radians
  groups.forEach((g, gi) => {
    g.center = fib(gi, G);
    const up = Math.abs(g.center.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const t1 = new THREE.Vector3().crossVectors(g.center, up).normalize();
    const t2 = new THREE.Vector3().crossVectors(g.center, t1);
    const members = nodes.filter((n) => n.gi === gi);
    members.forEach((n, j) => {
      const a = cap * Math.sqrt((j + 0.5) / members.length);
      const b = j * 2.399963;
      n.p = g.center.clone().multiplyScalar(Math.cos(a))
        .addScaledVector(t1, Math.sin(a) * Math.cos(b))
        .addScaledVector(t2, Math.sin(a) * Math.sin(b))
        .normalize().multiplyScalar(R);
      n.links = new Set();
    });
  });

  const edgeKeys = new Set();
  const link = (i, j) => edgeKeys.add(i < j ? `${i}-${j}` : `${j}-${i}`);
  // Inside a field: each skill links to its 2 nearest neighbours
  nodes.forEach((n, i) => {
    nodes
      .map((m, j) => [j, n.p.distanceToSquared(m.p)])
      .filter(([j]) => j !== i && nodes[j].gi === n.gi)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .forEach(([j]) => link(i, j));
  });
  // Between fields: each field links to its 2 closest fields through their nearest skills
  groups.forEach((g, gi) => {
    groups
      .map((h, hi) => [hi, g.center.distanceToSquared(h.center)])
      .filter(([hi]) => hi !== gi)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .forEach(([hi]) => {
        let best = null;
        nodes.forEach((a, i) => {
          if (a.gi !== gi) return;
          nodes.forEach((b, j) => {
            if (b.gi !== hi) return;
            const d = a.p.distanceToSquared(b.p);
            if (!best || d < best[2]) best = [i, j, d];
          });
        });
        if (best) link(best[0], best[1]);
      });
  });
  const edges = [...edgeKeys].map((key) => key.split("-").map(Number));
  edges.forEach(([a, b]) => {
    nodes[a].links.add(b);
    nodes[b].links.add(a);
  });

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const world = new THREE.Group();
  scene.add(world);

  // Edges
  const linePos = new Float32Array(edges.length * 6);
  const lineCol = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => {
    linePos.set([...nodes[a].p.toArray(), ...nodes[b].p.toArray()], i * 6);
    const ca = groups[nodes[a].gi].color;
    const cb = groups[nodes[b].gi].color;
    lineCol.set([ca.r, ca.g, ca.b, cb.r, cb.g, cb.b], i * 6);
  });
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  lineGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false });
  world.add(new THREE.LineSegments(lineGeo, lineMat));

  // Highlighted edges of the hovered skill
  const hiGeo = new THREE.BufferGeometry();
  const hiMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
  const hiLines = new THREE.LineSegments(hiGeo, hiMat);
  world.add(hiLines);

  // Nodes
  const nodePos = new Float32Array(N * 3);
  const nodeCol = new Float32Array(N * 3);
  const nodeSize = new Float32Array(N).fill(1);
  const nodeAlpha = new Float32Array(N).fill(1);
  nodes.forEach((n, i) => {
    nodePos.set(n.p.toArray(), i * 3);
    const c = groups[n.gi].color;
    nodeCol.set([c.r, c.g, c.b], i * 3);
  });
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute("aColor", new THREE.BufferAttribute(nodeCol, 3));
  nodeGeo.setAttribute("aSize", new THREE.BufferAttribute(nodeSize, 1));
  nodeGeo.setAttribute("aAlpha", new THREE.BufferAttribute(nodeAlpha, 1));
  const pointUniforms = { uScale: { value: 300 } };
  const glowShader = {
    vertexShader: /* glsl */ `
      uniform float uScale;
      attribute vec3 aColor;
      attribute float aSize, aAlpha;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uScale / -mv.z;
        vColor = aColor;
        vAlpha = aAlpha * mix(0.35, 1.0, smoothstep(-20.0, -10.0, mv.z));
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float glow = smoothstep(0.5, 0.0, d);
        float core = smoothstep(0.2, 0.1, d);
        gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.7), (glow * 0.55 + core * 0.45) * vAlpha);
      }`,
  };
  const nodeMat = new THREE.ShaderMaterial({ uniforms: pointUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...glowShader });
  world.add(new THREE.Points(nodeGeo, nodeMat));

  // Signals travelling along the edges
  const P = reduceMotion ? 0 : isSmall() ? 16 : 32;
  const pulses = Array.from({ length: P }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random(), s: 0.25 + Math.random() * 0.5 }));
  const pulsePos = new Float32Array(Math.max(P, 1) * 3);
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
  pulseGeo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(Math.max(P, 1) * 3).fill(1), 3));
  pulseGeo.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(Math.max(P, 1)).fill(0.45), 1));
  pulseGeo.setAttribute("aAlpha", new THREE.BufferAttribute(new Float32Array(Math.max(P, 1)).fill(0.9), 1));
  if (P) world.add(new THREE.Points(pulseGeo, new THREE.ShaderMaterial({ uniforms: pointUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, ...glowShader })));

  // Wireframe core
  const core = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.5, 1)),
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
  );
  scene.add(core);

  // Labels (HTML, so they stay crisp and selectable by screen size)
  const labels = nodes.map((n) => {
    const s = document.createElement("span");
    s.textContent = n.name;
    s.style.setProperty("--c", groups[n.gi].hex);
    labelsEl.append(s);
    return s;
  });

  // Legend: highlight one field
  let focus = -1;
  const chips = [];
  const addChip = (label, gi, hex) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "u-chip";
    b.innerHTML = hex ? `<i style="background:${hex}"></i>` : "";
    b.append(label);
    b.setAttribute("aria-pressed", gi === -1);
    b.addEventListener("click", () => {
      focus = focus === gi ? -1 : gi;
      chips.forEach((c, j) => c.setAttribute("aria-pressed", j - 1 === focus));
      selected = -1;
      if (focus >= 0) {
        // Turn the sphere so the chosen field faces the visitor
        const c = groups[focus].center;
        const ry = -Math.atan2(c.x, c.z);
        const dy = ((ry - world.rotation.y + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
        turnTo = { y: world.rotation.y + dy, x: Math.atan2(c.y, Math.hypot(c.x, c.z)) };
        vel.x = vel.y = 0;
      } else {
        turnTo = null;
      }
      lastInput = performance.now();
      kick();
    });
    legend.append(b);
    chips.push(b);
  };
  addChip("All", -1);
  groups.forEach((g, gi) => addChip(g.name, gi, g.hex));

  // Interaction state
  let hovered = -1;
  let selected = -1;
  let dragging = false;
  let moved = 0;
  let last = { x: 0, y: 0 };
  const vel = { x: 0, y: 0 };
  let lastInput = 0;
  let turnTo = null;
  const screen = nodes.map(() => ({ x: 0, y: 0, z: 0 }));
  const v = new THREE.Vector3();

  const nearest = (x, y, max) => {
    let best = -1;
    let bd = max * max;
    screen.forEach((s, i) => {
      if (s.z < -0.2 || (focus !== -1 && nodes[i].gi !== focus)) return;
      const d = (s.x - x) ** 2 + (s.y - y) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  };
  const local = (e) => {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    turnTo = null;
    moved = 0;
    last = { x: e.clientX, y: e.clientY };
    stage.setPointerCapture(e.pointerId);
    lastInput = performance.now();
  });
  stage.addEventListener("pointermove", (e) => {
    lastInput = performance.now();
    if (dragging) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      moved += Math.abs(dx) + Math.abs(dy);
      vel.y = dx * 0.006;
      vel.x = dy * 0.006;
      last = { x: e.clientX, y: e.clientY };
      stage.classList.add("grabbing");
    } else if (finePointer) {
      const p = local(e);
      hovered = nearest(p.x, p.y, 26);
      stage.style.cursor = hovered >= 0 ? "pointer" : "grab";
    }
    kick();
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove("grabbing");
    if (moved < 6 && e.type === "pointerup") {
      // A tap or click selects the nearest skill
      const p = local(e);
      const i = nearest(p.x, p.y, finePointer ? 26 : 40);
      selected = i === selected ? -1 : i;
    }
    kick();
  };
  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("pointerleave", () => {
    hovered = -1;
    kick();
  });

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 0, camera.aspect < 1 ? 17.5 : 15.5);
    camera.updateProjectionMatrix();
    pointUniforms.uScale.value = Math.min(width, height) * 0.55 * renderer.getPixelRatio() / 2;
    kick();
  };
  new ResizeObserver(resize).observe(stage);

  let lastActive = -2;
  let lastFocus = -2;
  function updateHighlight() {
    const active = selected >= 0 ? selected : hovered;
    if (active === lastActive && focus === lastFocus) return;
    lastActive = active;
    lastFocus = focus;
    nodes.forEach((n, i) => {
      const related = active < 0 || i === active || n.links.has(active);
      const inFocus = focus === -1 || n.gi === focus;
      nodeAlpha[i] = !inFocus ? 0.12 : related ? 1 : 0.3;
      nodeSize[i] = i === active ? 2.2 : active >= 0 && n.links.has(active) ? 1.4 : 1;
      labels[i].classList.toggle("dim", !inFocus || (active >= 0 && !related));
      labels[i].classList.toggle("active", i === active);
    });
    nodeGeo.attributes.aAlpha.needsUpdate = true;
    nodeGeo.attributes.aSize.needsUpdate = true;
    lineMat.opacity = focus === -1 && active < 0 ? 0.32 : 0.1;
    if (active >= 0) {
      const pts = [];
      nodes[active].links.forEach((j) => pts.push(nodes[active].p, nodes[j].p));
      hiGeo.setFromPoints(pts);
      hiMat.color.set(groups[nodes[active].gi].hex);
      tip.innerHTML = `<strong></strong><span></span>`;
      tip.firstChild.textContent = nodes[active].name;
      tip.lastChild.textContent = groups[nodes[active].gi].name;
    } else {
      hiGeo.setFromPoints([]);
    }
    tip.classList.toggle("show", active >= 0);
  }

  function frame(t) {
    const idle = performance.now() - lastInput > 2500;
    if (turnTo) {
      // Ease towards the focused field, then hold still
      world.rotation.y += (turnTo.y - world.rotation.y) * (reduceMotion ? 1 : 0.08);
      world.rotation.x += (turnTo.x - world.rotation.x) * (reduceMotion ? 1 : 0.08);
    } else {
      if (!dragging) {
        vel.x *= 0.92;
        vel.y *= 0.92;
        if (idle && !reduceMotion) vel.y += (0.0022 - vel.y) * 0.05;
      }
      world.rotation.y += vel.y;
      world.rotation.x = Math.max(-0.9, Math.min(0.9, world.rotation.x + vel.x));
    }
    core.rotation.y -= 0.003;
    core.rotation.x += 0.0015;

    // Move signals along their edges
    pulses.forEach((p, i) => {
      p.t += p.s * 0.016;
      if (p.t > 1) {
        p.t = 0;
        p.e = (Math.random() * edges.length) | 0;
      }
      const [a, b] = edges[p.e];
      v.lerpVectors(nodes[a].p, nodes[b].p, p.t);
      pulsePos.set([v.x, v.y, v.z], i * 3);
    });
    if (P) pulseGeo.attributes.position.needsUpdate = true;

    updateHighlight();
    world.updateMatrixWorld();

    // Project nodes to place the HTML labels
    const { width, height } = renderer.domElement.getBoundingClientRect();
    const small = width < 520;
    const active = selected >= 0 ? selected : hovered;
    nodes.forEach((n, i) => {
      v.copy(n.p).applyMatrix4(world.matrixWorld);
      const depth = v.z / R; // -1 back … 1 front
      v.project(camera);
      const s = screen[i];
      s.x = (v.x * 0.5 + 0.5) * width;
      s.y = (-v.y * 0.5 + 0.5) * height;
      s.z = depth;
      const show = i === active || (focus !== -1 ? nodes[i].gi === focus && depth > -0.3 : depth > (small ? 0.55 : 0.15));
      const op = i === active ? 1 : show ? Math.min(1, (depth + 0.4) * 1.2) : 0;
      const l = labels[i];
      l.style.transform = `translate3d(${s.x.toFixed(1)}px, ${(s.y - 14).toFixed(1)}px, 0) translate(-50%, -100%) scale(${(0.82 + Math.max(depth, 0) * 0.22).toFixed(3)})`;
      l.style.opacity = op.toFixed(2);
      l.style.zIndex = Math.round((depth + 1) * 50);
    });
    if (active >= 0) {
      const s = screen[active];
      tip.style.transform = `translate3d(${Math.min(Math.max(s.x, 90), width - 90).toFixed(1)}px, ${(s.y + 18).toFixed(1)}px, 0) translateX(-50%)`;
    }

    renderer.render(scene, camera);
  }

  // With reduced motion, only render when something changes
  let pending = false;
  function kick() {
    if (!reduceMotion || pending) return;
    pending = true;
    requestAnimationFrame((ms) => {
      pending = false;
      frame(ms / 1000);
      if (Math.abs(vel.x) + Math.abs(vel.y) > 0.0005) kick();
    });
  }

  resize();
  stage.classList.add("ready");
  if (reduceMotion) kick();
  else loopWhileVisible(stage, frame);
}

/* ------------------------------------------------------------------ Start */

async function init() {
  if (!webglAvailable()) {
    root.classList.add("no-webgl");
    return;
  }
  try {
    const THREE = await import(THREE_URL);
    const hero = document.querySelector(".hero");
    const heroCanvas = document.querySelector(".hero-canvas");
    if (hero && heroCanvas) heroWave(THREE, hero, heroCanvas);
    const universe = document.querySelector(".universe");
    if (universe) skillUniverse(THREE, universe);
    root.classList.add("has-3d");
  } catch (err) {
    console.warn("3D scenes disabled:", err);
    root.classList.add("no-webgl");
  }
}

const start = () => ("requestIdleCallback" in window ? requestIdleCallback(init, { timeout: 1500 }) : setTimeout(init, 400));
if (document.readyState === "complete") start();
else addEventListener("load", start);

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

export type ThreeDModelMode =
  | 'platonic'
  | 'archimedes-sphere'
  | 'pyramid-frustum'
  | 'curvature-comparison';

export type PlatonicType =
  | 'tetrahedron'
  | 'cube'
  | 'octahedron'
  | 'dodecahedron'
  | 'icosahedron';

interface ThreeDLabCanvasProps {
  initialMode?: ThreeDModelMode;
}

const PLATONIC_INFO: Record<
  PlatonicType,
  { name: string; faces: number; vertices: number; edges: number; faceShape: string }
> = {
  tetrahedron: {
    name: 'رباعي الوجوه المنتظم',
    faces: 4,
    vertices: 4,
    edges: 6,
    faceShape: 'مثلث متساوي الأضلاع',
  },
  cube: {
    name: 'المكعب (سداسي الوجوه)',
    faces: 6,
    vertices: 8,
    edges: 12,
    faceShape: 'مربع',
  },
  octahedron: {
    name: 'ثماني الوجوه المنتظم',
    faces: 8,
    vertices: 6,
    edges: 12,
    faceShape: 'مثلث متساوي الأضلاع',
  },
  dodecahedron: {
    name: 'اثنا عشري الوجوه المنتظم',
    faces: 12,
    vertices: 20,
    edges: 30,
    faceShape: 'مخمس منتظم',
  },
  icosahedron: {
    name: 'عشريني الوجوه المنتظم',
    faces: 20,
    vertices: 12,
    edges: 30,
    faceShape: 'مثلث متساوي الأضلاع',
  },
};

export const ThreeDLabCanvas: React.FC<ThreeDLabCanvasProps> = ({
  initialMode = 'platonic',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<ThreeDModelMode>(initialMode);
  const [platonic, setPlatonic] = useState<PlatonicType>('icosahedron');
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [radius, setRadius] = useState(1.2);
  const [height, setHeight] = useState(2.4);
  const [curvatureKind, setCurvatureKind] = useState<'euclidean' | 'elliptic' | 'hyperbolic'>('hyperbolic');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [webglError, setWebglError] = useState(false);

  // Refs for smooth state access inside Three.js without recreating renderer
  const sceneStateRef = useRef({
    mode,
    platonic,
    explodeFactor,
    radius,
    height,
    curvatureKind,
  });

  const rebuildSceneRef = useRef<(() => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const requestRenderRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    sceneStateRef.current = {
      mode,
      platonic,
      explodeFactor,
      radius,
      height,
      curvatureKind,
    };
    rebuildSceneRef.current?.();
    requestRenderRef.current?.();
  }, [mode, platonic, explodeFactor, radius, height, curvatureKind]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL strictly via GPU renderer string
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas');
        const gl = probe.getContext('webgl2') || probe.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param) || '');
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || 640;
    const heightPx = container.clientHeight || 440;
    renderer.setSize(width, heightPx);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    const handleContextRestored = () => {
      setWebglError(false);
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
    renderer.domElement.addEventListener(
      'webglcontextrestored',
      handleContextRestored
    );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b172a);
    scene.fog = new THREE.FogExp2(0x0b172a, 0.045);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(
      new RoomEnvironment(),
      0.04
    ).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 0.1, 100);
    camera.position.set(3.8, 2.8, 4.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.4;
    controls.maxDistance = 12;
    controls.target.set(0, 0.2, 0);

    // Three-point studio lighting + cool sky/ground HemisphereLight
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3d6, 2.2);
    keyLight.position.set(5, 7, 5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    rimLight.position.set(-5, 3, -5);
    scene.add(rimLight);

    // Architectural drafting grid & grounded radial pedestal
    const gridHelper = new THREE.GridHelper(12, 24, 0xc8972c, 0x1e3a5f);
    gridHelper.position.y = -1.42;
    const gridMat = gridHelper.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.35;
    scene.add(gridHelper);

    const baseDiscGeo = new THREE.CylinderGeometry(2.6, 2.75, 0.08, 48);
    const baseDiscMat = new THREE.MeshStandardMaterial({
      color: 0x132542,
      roughness: 0.75,
      metalness: 0.2,
    });
    const baseDisc = new THREE.Mesh(baseDiscGeo, baseDiscMat);
    baseDisc.position.y = -1.46;
    baseDisc.receiveShadow = true;
    scene.add(baseDisc);

    // Subject group
    const subjectGroup = new THREE.Group();
    scene.add(subjectGroup);

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4a438,
      metalness: 0.88,
      roughness: 0.22,
      side: THREE.DoubleSide,
    });
    const ivoryMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.08,
      roughness: 0.45,
      side: THREE.DoubleSide,
    });
    const azureGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.15,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0xfde68a,
      transparent: true,
      opacity: 0.85,
    });

    const disposableGeometries: THREE.BufferGeometry[] = [];
    const registerGeo = <T extends THREE.BufferGeometry>(g: T): T => {
      disposableGeometries.push(g);
      return g;
    };

    const clearSubject = () => {
      while (subjectGroup.children.length > 0) {
        subjectGroup.remove(subjectGroup.children[0]);
      }
      while (disposableGeometries.length > 0) {
        disposableGeometries.pop()?.dispose();
      }
    };

    const buildModel = () => {
      clearSubject();
      const st = sceneStateRef.current;

      if (st.mode === 'platonic') {
        let baseGeo: THREE.BufferGeometry;
        switch (st.platonic) {
          case 'tetrahedron':
            baseGeo = new THREE.TetrahedronGeometry(1.35, 0);
            break;
          case 'cube':
            baseGeo = new THREE.BoxGeometry(1.65, 1.65, 1.65);
            break;
          case 'octahedron':
            baseGeo = new THREE.OctahedronGeometry(1.35, 0);
            break;
          case 'dodecahedron':
            baseGeo = new THREE.DodecahedronGeometry(1.3, 0);
            break;
          case 'icosahedron':
          default:
            baseGeo = new THREE.IcosahedronGeometry(1.32, 0);
            break;
        }
        registerGeo(baseGeo);

        // Exploded face construction (multi-part composite)
        const nonIndexed = registerGeo(baseGeo.toNonIndexed());
        const pos = nonIndexed.attributes.position;
        const triCount = pos.count / 3;

        // Inner glowing core sphere & brass axis ring
        const coreGeo = registerGeo(new THREE.SphereGeometry(0.32, 24, 24));
        const coreMesh = new THREE.Mesh(coreGeo, goldMat);
        coreMesh.position.y = 0.2;
        subjectGroup.add(coreMesh);

        const outerRingGeo = registerGeo(new THREE.TorusGeometry(1.75, 0.02, 12, 64));
        const outerRing = new THREE.Mesh(outerRingGeo, goldMat);
        outerRing.position.y = 0.2;
        outerRing.rotation.x = Math.PI / 2.4;
        subjectGroup.add(outerRing);

        const faceGroup = new THREE.Group();
        faceGroup.position.y = 0.2;

        const _v0 = new THREE.Vector3();
        const _v1 = new THREE.Vector3();
        const _v2 = new THREE.Vector3();
        const _center = new THREE.Vector3();

        for (let i = 0; i < triCount; i++) {
          _v0.fromBufferAttribute(pos, i * 3);
          _v1.fromBufferAttribute(pos, i * 3 + 1);
          _v2.fromBufferAttribute(pos, i * 3 + 2);
          _center.copy(_v0).add(_v1).add(_v2).divideScalar(3);
          const normalDir = _center.clone().normalize();

          const triGeo = registerGeo(new THREE.BufferGeometry());
          triGeo.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(
              [_v0.x, _v0.y, _v0.z, _v1.x, _v1.y, _v1.z, _v2.x, _v2.y, _v2.z],
              3
            )
          );
          triGeo.computeVertexNormals();

          const triMesh = new THREE.Mesh(
            triGeo,
            i % 2 === 0 ? ivoryMat : goldMat
          );
          triMesh.castShadow = !isSoftwareGl;
          triMesh.position.copy(normalDir.multiplyScalar(st.explodeFactor * 0.75));
          faceGroup.add(triMesh);
        }

        const edgesGeo = registerGeo(new THREE.EdgesGeometry(baseGeo, 1));
        const edgesLines = new THREE.LineSegments(edgesGeo, wireframeMat);
        edgesLines.scale.setScalar(1 + st.explodeFactor * 0.55);
        faceGroup.add(edgesLines);

        subjectGroup.add(faceGroup);
      } else if (st.mode === 'archimedes-sphere') {
        const r = st.radius;
        const h = r * 2;
        const group = new THREE.Group();
        group.position.y = 0.1;

        // Inner Gold Sphere (V = 4/3 pi r^3)
        const sphereGeo = registerGeo(new THREE.SphereGeometry(r, 32, 32));
        const sphere = new THREE.Mesh(sphereGeo, goldMat);
        sphere.castShadow = !isSoftwareGl;
        group.add(sphere);

        // Equator & meridian brass rings
        const ringGeo = registerGeo(new THREE.TorusGeometry(r + 0.015, 0.018, 12, 64));
        const eqRing = new THREE.Mesh(ringGeo, ivoryMat);
        eqRing.rotation.x = Math.PI / 2;
        group.add(eqRing);

        // Circumscribed Translucent Cylinder (V = 2 pi r^3)
        const cylGeo = registerGeo(new THREE.CylinderGeometry(r, r, h, 36, 1, true));
        const cylMesh = new THREE.Mesh(cylGeo, azureGlassMat);
        cylMesh.renderOrder = 2;
        group.add(cylMesh);

        const cylEdges = registerGeo(
          new THREE.EdgesGeometry(new THREE.CylinderGeometry(r, r, h, 24))
        );
        group.add(new THREE.LineSegments(cylEdges, wireframeMat));

        // Circumscribed Cone inside cylinder for comparison (V = 2/3 pi r^3)
        const coneGeo = registerGeo(new THREE.ConeGeometry(r * 0.98, h, 32, 1, true));
        const coneEdges = registerGeo(new THREE.EdgesGeometry(coneGeo, 15));
        const coneWire = new THREE.LineSegments(
          coneEdges,
          new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.75 })
        );
        group.add(coneWire);

        subjectGroup.add(group);
      } else if (st.mode === 'pyramid-frustum') {
        const b = st.radius * 1.45;
        const top = b * (0.35 + st.explodeFactor * 0.45);
        const h = st.height;

        const group = new THREE.Group();
        group.position.y = -0.1;

        // 4-sided pyramid frustum
        const frustumGeo = registerGeo(
          new THREE.CylinderGeometry(top, b, h, 4, 1)
        );
        frustumGeo.rotateY(Math.PI / 4);

        const frustumMesh = new THREE.Mesh(frustumGeo, ivoryMat);
        frustumMesh.castShadow = !isSoftwareGl;
        group.add(frustumMesh);

        const frustumEdges = registerGeo(new THREE.EdgesGeometry(frustumGeo, 5));
        group.add(new THREE.LineSegments(frustumEdges, wireframeMat));

        // Top gold cap rim
        const capGeo = registerGeo(new THREE.CylinderGeometry(top * 0.99, top * 0.99, 0.04, 4));
        capGeo.rotateY(Math.PI / 4);
        const capMesh = new THREE.Mesh(capGeo, goldMat);
        capMesh.position.y = h / 2;
        group.add(capMesh);

        // Pedestal plinth
        const plinthGeo = registerGeo(new THREE.BoxGeometry(b * 1.65, 0.12, b * 1.65));
        const plinth = new THREE.Mesh(plinthGeo, goldMat);
        plinth.position.y = -h / 2 - 0.06;
        group.add(plinth);

        subjectGroup.add(group);
      } else if (st.mode === 'curvature-comparison') {
        const group = new THREE.Group();
        group.position.y = 0.1;

        if (st.curvatureKind === 'euclidean') {
          const planeGeo = registerGeo(new THREE.PlaneGeometry(3.2, 3.2, 16, 16));
          planeGeo.rotateX(-Math.PI / 2);
          const plane = new THREE.Mesh(planeGeo, ivoryMat);
          group.add(plane);

          const grid = new THREE.GridHelper(3.2, 12, 0xc8972c, 0x334155);
          grid.position.y = 0.01;
          group.add(grid);

          // Geodesic Euclidean Triangle
          const triPts = [
            new THREE.Vector3(0, 0.03, -1.1),
            new THREE.Vector3(-1.05, 0.03, 0.85),
            new THREE.Vector3(1.05, 0.03, 0.85),
            new THREE.Vector3(0, 0.03, -1.1),
          ];
          const triGeo = registerGeo(new THREE.BufferGeometry().setFromPoints(triPts));
          group.add(
            new THREE.Line(
              triGeo,
              new THREE.LineBasicMaterial({ color: 0xc8972c, linewidth: 2 })
            )
          );
        } else if (st.curvatureKind === 'elliptic') {
          const sphereGeo = registerGeo(new THREE.SphereGeometry(1.35, 32, 32));
          const sphere = new THREE.Mesh(sphereGeo, ivoryMat);
          group.add(sphere);

          const wire = new THREE.LineSegments(
            registerGeo(new THREE.WireframeGeometry(sphereGeo)),
            new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 })
          );
          group.add(wire);

          // Spherical triangle arcs (3 mutually orthogonal great circle arcs -> 270 deg!)
          const arcMat = new THREE.LineBasicMaterial({ color: 0xc8972c });
          const rArc = 1.37;
          const makeArc = (p1: THREE.Vector3, p2: THREE.Vector3) => {
            const pts: THREE.Vector3[] = [];
            for (let i = 0; i <= 24; i++) {
              const v = new THREE.Vector3()
                .lerpVectors(p1, p2, i / 24)
                .normalize()
                .multiplyScalar(rArc);
              pts.push(v);
            }
            return new THREE.Line(
              registerGeo(new THREE.BufferGeometry().setFromPoints(pts)),
              arcMat
            );
          };
          const A = new THREE.Vector3(0, 1, 0);
          const B = new THREE.Vector3(1, 0, 0);
          const C = new THREE.Vector3(0, 0, 1);
          group.add(makeArc(A, B), makeArc(B, C), makeArc(C, A));
        } else {
          // Hyperbolic Saddle Surface z = 0.42 * (x^2 - y^2)
          const seg = 36;
          const size = 2.6;
          const saddleGeo = registerGeo(new THREE.PlaneGeometry(size, size, seg, seg));
          saddleGeo.rotateX(-Math.PI / 2);
          const pos = saddleGeo.attributes.position;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = 0.36 * (x * x - z * z);
            pos.setY(i, y);
          }
          saddleGeo.computeVertexNormals();
          const saddleMesh = new THREE.Mesh(saddleGeo, goldMat);
          group.add(saddleMesh);

          const wire = new THREE.LineSegments(
            registerGeo(new THREE.WireframeGeometry(saddleGeo)),
            new THREE.LineBasicMaterial({ color: 0x0b172a, transparent: true, opacity: 0.35 })
          );
          group.add(wire);

          // Curved hyperbolic triangle curving inward on the saddle
          const hPts: THREE.Vector3[] = [];
          const corners = [
            new THREE.Vector2(0, -0.9),
            new THREE.Vector2(-0.85, 0.7),
            new THREE.Vector2(0.85, 0.7),
          ];
          const addCurvedEdge = (a: THREE.Vector2, b: THREE.Vector2) => {
            for (let i = 0; i <= 20; i++) {
              const t = i / 20;
              // Bow inward slightly toward (0,0) for hyperbolic geodesic feel
              const bow = Math.sin(t * Math.PI) * 0.18;
              const x = THREE.MathUtils.lerp(a.x, b.x, t) * (1 - bow);
              const z = THREE.MathUtils.lerp(a.y, b.y, t) * (1 - bow);
              const y = 0.36 * (x * x - z * z) + 0.03;
              hPts.push(new THREE.Vector3(x, y, z));
            }
          };
          addCurvedEdge(corners[0], corners[1]);
          addCurvedEdge(corners[1], corners[2]);
          addCurvedEdge(corners[2], corners[0]);
          const hGeo = registerGeo(new THREE.BufferGeometry().setFromPoints(hPts));
          group.add(new THREE.Line(hGeo, new THREE.LineBasicMaterial({ color: 0xffffff })));
        }

        subjectGroup.add(group);
      }
    };

    rebuildSceneRef.current = buildModel;
    buildModel();

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Coalesced on-demand render scheduler (strictly compliant with Three.js skill)
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        controls.update();
        renderer.render(scene, camera);
        const done = () => {
          renderBusy = false;
          if (renderDirty) requestRender();
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    requestRenderRef.current = requestRender;
    controls.addEventListener('change', requestRender);

    resetCameraRef.current = () => {
      camera.position.set(3.8, 2.8, 4.6);
      controls.target.set(0, 0.2, 0);
      controls.update();
      requestRender();
    };

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };

    window.addEventListener('resize', handleResize);
    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      controls.removeEventListener('change', requestRender);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.removeEventListener(
        'webglcontextrestored',
        handleContextRestored
      );
      clearSubject();
      baseDiscGeo.dispose();
      baseDiscMat.dispose();
      goldMat.dispose();
      ivoryMat.dispose();
      azureGlassMat.dispose();
      wireframeMat.dispose();
      envTex.dispose();
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  // Computed live math metrics
  const sphereVol = ((4 / 3) * Math.PI * Math.pow(radius, 3)).toFixed(2);
  const cylVol = (2 * Math.PI * Math.pow(radius, 3)).toFixed(2);
  const bBase = radius * 1.45;
  const topBase = bBase * (0.35 + explodeFactor * 0.45);
  const frustumVol = (
    (height / 3) *
    (bBase * bBase + bBase * topBase + topBase * topBase)
  ).toFixed(2);

  return (
    <div className="relative w-full h-[460px] sm:h-[540px] rounded-2xl overflow-hidden border border-[#C8972C]/40 bg-[#0B172A] shadow-lg">
      {/* Isolated WebGL Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {webglError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B172A] text-white p-6 text-center">
          <p className="text-lg font-bold mb-2">تعذر تهيئة محرك العرض ثلاثي الأبعاد</p>
          <p className="text-sm text-slate-300">
            يدعم متصفحك العرض التفاعلي ثنائي الأبعاد في التبويبات الأخرى دون قيود.
          </p>
        </div>
      )}

      {/* Top Minimal Info Strip (solid rgba, no backdrop-filter over WebGL) */}
      <div className="absolute top-3 right-3 left-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto bg-[#07101F]/90 border border-white/15 rounded-lg px-3.5 py-2 text-white">
          <p className="text-xs text-[#EBD08A] font-medium">
            {mode === 'platonic' && PLATONIC_INFO[platonic].name}
            {mode === 'archimedes-sphere' && 'نسبة أرخميدس: الكرة والأسطوانة'}
            {mode === 'pyramid-frustum' && 'الهرم الناقص (بردية موسكو)'}
            {mode === 'curvature-comparison' && 'مقارنة انحناء الفضاءات'}
          </p>
          <p className="text-xs text-slate-300 font-mono tabular-nums mt-0.5">
            {mode === 'platonic' &&
              `V=${PLATONIC_INFO[platonic].vertices} · E=${PLATONIC_INFO[platonic].edges} · F=${PLATONIC_INFO[platonic].faces} (V−E+F=2)`}
            {mode === 'archimedes-sphere' &&
              `حجم الكرة = ${sphereVol} | الأسطوانة = ${cylVol} (2:3)`}
            {mode === 'pyramid-frustum' &&
              `الحجم = ${frustumVol} وحدة³`}
            {mode === 'curvature-comparison' &&
              (curvatureKind === 'euclidean'
                ? 'K = 0 · مجموع الزوايا = 180°'
                : curvatureKind === 'elliptic'
                ? 'K > 0 · مجموع الزوايا > 180°'
                : 'K < 0 · مجموع الزوايا < 180°')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => resetCameraRef.current?.()}
          className="pointer-events-auto min-h-[40px] px-3 py-1.5 rounded-lg bg-[#07101F]/90 hover:bg-[#132542] border border-white/20 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#EBD08A]" />
          <span>إعادة ضبط الكاميرا</span>
        </button>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[780px] flex flex-col items-center">
        <button
          type="button"
          onClick={() => setDockCollapsed((c) => !c)}
          className="px-4 py-1 rounded-t-lg bg-[#07101F]/95 border border-b-0 border-white/20 text-xs text-[#EBD08A] font-medium inline-flex items-center gap-1 cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>إظهار أدوات التحكم 3D</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>إخفاء أدوات التحكم</span>
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="w-full bg-[#07101F]/95 border border-white/20 rounded-xl p-3 sm:p-4 text-white space-y-3 shadow-xl">
            {/* Model Mode Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'platonic', label: 'المجسمات الأفلاطونية' },
                  { id: 'archimedes-sphere', label: 'كرة أرخميدس' },
                  { id: 'pyramid-frustum', label: 'الهرم الناقص' },
                  { id: 'curvature-comparison', label: 'الفضاءات اللاإقليدية' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    mode === item.id
                      ? 'bg-[#C8972C] text-[#0B172A] font-bold'
                      : 'bg-white/10 text-slate-200 hover:bg-white/20'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Context-specific Controls */}
            {mode === 'platonic' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/10">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(PLATONIC_INFO) as PlatonicType[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPlatonic(key)}
                      className={`px-2.5 py-1 rounded text-xs cursor-pointer ${
                        platonic === key
                          ? 'bg-white text-[#0B172A] font-bold'
                          : 'bg-white/10 text-slate-300 hover:bg-white/15'
                      }`}
                    >
                      {PLATONIC_INFO[key].faces} وجوه
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-200 shrink-0">
                  <span>التفكيك: {Math.round(explodeFactor * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={explodeFactor}
                    onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                    className="w-28 accent-[#C8972C]"
                  />
                </label>
              </div>
            )}

            {mode === 'archimedes-sphere' && (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10 text-xs">
                <label className="flex items-center gap-3">
                  <span>نصف القطر (r): {radius.toFixed(1)}</span>
                  <input
                    type="range"
                    min="0.6"
                    max="1.5"
                    step="0.1"
                    value={radius}
                    onChange={(e) => setRadius(parseFloat(e.target.value))}
                    className="w-32 accent-[#C8972C]"
                  />
                </label>
                <span className="text-[#EBD08A]">
                  نسبة حجم الكرة إلى الأسطوانة ثابتة دائماً: 2 / 3 (66.7%)
                </span>
              </div>
            )}

            {mode === 'pyramid-frustum' && (
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/10 text-xs">
                <label className="flex items-center gap-2">
                  <span>القاعدة: {bBase.toFixed(2)}</span>
                  <input
                    type="range"
                    min="0.8"
                    max="1.5"
                    step="0.05"
                    value={radius}
                    onChange={(e) => setRadius(parseFloat(e.target.value))}
                    className="w-24 accent-[#C8972C]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span>الارتفاع: {height.toFixed(1)}</span>
                  <input
                    type="range"
                    min="1.2"
                    max="2.8"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(parseFloat(e.target.value))}
                    className="w-24 accent-[#C8972C]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span>نسبة القمة: {Math.round((0.35 + explodeFactor * 0.45) * 100)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={explodeFactor}
                    onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
                    className="w-24 accent-[#C8972C]"
                  />
                </label>
              </div>
            )}

            {mode === 'curvature-comparison' && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                {(
                  [
                    { id: 'euclidean', label: 'المستوي الإقليدي (K = 0)' },
                    { id: 'elliptic', label: 'السطح الكروي لريمان (K > 0)' },
                    { id: 'hyperbolic', label: 'السرج الزائدي للوباتشيفسكي (K < 0)' },
                  ] as const
                ).map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setCurvatureKind(k.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer ${
                      curvatureKind === k.id
                        ? 'bg-white text-[#0B172A] font-bold'
                        : 'bg-white/10 text-slate-200 hover:bg-white/20'
                    }`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

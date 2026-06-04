'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CinematicLayerProps {
  soundActive: boolean;
  slide: number;
}

export default function CinematicLayer({ soundActive, slide }: CinematicLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Scene + Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.08);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;

    // --- Lighting System (Warm orange and cool blue) ---
    const blueLight = new THREE.PointLight(0x3a8cff, 12, 30);
    blueLight.position.set(5, 5, 2);
    scene.add(blueLight);

    const orangeLight = new THREE.PointLight(0xff7722, 10, 30);
    orangeLight.position.set(-5, -5, 2);
    scene.add(orangeLight);

    const ambientLight = new THREE.AmbientLight(0x111122, 1.2);
    scene.add(ambientLight);

    // --- Torus / Holographic Rings (Removed as requested to clear screen overlays) ---

    // --- 3D Particle Galaxy + Neural Network Sphere ---
    const PARTICLE_COUNT = 450;
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const phases = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const radii = new Float32Array(PARTICLE_COUNT);

    const warmColor = new THREE.Color('#ff8c42');
    const blueColor = new THREE.Color('#3a8cff');
    const whiteColor = new THREE.Color('#ffffff');

    // Distribute particles in a galaxy spiral and central neural sphere
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = Math.random() * 0.18 + 0.05;

      if (i < 200) {
        // Neural network sphere particles (clustered around center)
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 2.0 + Math.random() * 0.8; // sphere radius

        positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        radii[i] = r;
      } else {
        // Galaxy spiral outer particles
        const angle = Math.random() * Math.PI * 2;
        const dist = 3.5 + Math.random() * 6.5;
        const spiralOffset = dist * 0.3;
        
        positions[i * 3 + 0] = Math.cos(angle + spiralOffset) * dist;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5; // Thin disc
        positions[i * 3 + 2] = Math.sin(angle + spiralOffset) * dist;
        radii[i] = dist;
      }

      // Color scheme
      let c = whiteColor.clone();
      if (Math.random() < 0.4) {
        c = warmColor.clone().lerp(whiteColor, Math.random() * 0.4);
      } else if (Math.random() < 0.8) {
        c = blueColor.clone().lerp(whiteColor, Math.random() * 0.4);
      }

      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Disk texture
    const diskCanvas = document.createElement('canvas');
    diskCanvas.width = 64; diskCanvas.height = 64;
    const ctx = diskCanvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.25)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const diskTex = new THREE.CanvasTexture(diskCanvas);

    const pointsMat = new THREE.PointsMaterial({
      size: 0.14,
      map: diskTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlesMesh = new THREE.Points(geometry, pointsMat);
    scene.add(particlesMesh);

    // --- Neural network sphere dynamic connection lines ---
    // Draw lines between closest particles in the neural sphere (first 200 nodes)
    const maxConnections = 120;
    const linePositions = new Float32Array(maxConnections * 2 * 3);
    const lineColors = new Float32Array(maxConnections * 2 * 3);
    
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    
    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      linewidth: 1,
    });
    
    const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(linesMesh);

    // Parallax variables
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // Window resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const originalPositions = new Float32Array(positions);
    let animId: number;
    let time = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Increase speeds if sound is active
      const timeScale = soundActive ? 0.016 : 0.007;
      time += timeScale;

      // Animate rings (Removed)

      // Point light oscillations
      blueLight.position.x = Math.sin(time * 0.5) * 6 + 2;
      blueLight.position.y = Math.cos(time * 0.7) * 4;
      orangeLight.position.x = Math.cos(time * 0.6) * 6 - 2;
      orangeLight.position.y = Math.sin(time * 0.5) * 4;

      // Animate particles (orbiting and pulsating)
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const phase = phases[i];
        const speed = speeds[i];
        
        if (i < 200) {
          // Sphere node slow pulsing breathing
          const pulse = 1.0 + Math.sin(time * speed + phase) * 0.08;
          posAttr.array[i * 3 + 0] = originalPositions[i * 3 + 0] * pulse;
          posAttr.array[i * 3 + 1] = originalPositions[i * 3 + 1] * pulse;
          posAttr.array[i * 3 + 2] = originalPositions[i * 3 + 2] * pulse;
        } else {
          // Spiral particle orbiting around center
          const currentAngle = phase + time * speed * 0.3;
          const r = radii[i];
          posAttr.array[i * 3 + 0] = Math.cos(currentAngle) * r;
          posAttr.array[i * 3 + 1] = originalPositions[i * 3 + 1] + Math.sin(time * 1.5 + phase) * 0.2;
          posAttr.array[i * 3 + 2] = Math.sin(currentAngle) * r;
        }
      }
      posAttr.needsUpdate = true;

      // Recalculate connection lines for the neural sphere (first 200 particles)
      let lineIndex = 0;
      const linePosAttr = lineGeo.getAttribute('position') as THREE.BufferAttribute;
      const lineColAttr = lineGeo.getAttribute('color') as THREE.BufferAttribute;

      // Clear line vertices
      linePosAttr.array.fill(0);

      const maxDist = 1.8;
      for (let i = 0; i < 200 && lineIndex < maxConnections; i++) {
        const x1 = posAttr.array[i * 3 + 0];
        const y1 = posAttr.array[i * 3 + 1];
        const z1 = posAttr.array[i * 3 + 2];

        for (let j = i + 1; j < 200 && lineIndex < maxConnections; j++) {
          const x2 = posAttr.array[j * 3 + 0];
          const y2 = posAttr.array[j * 3 + 1];
          const z2 = posAttr.array[j * 3 + 2];

          const dx = x1 - x2;
          const dy = y1 - y2;
          const dz = z1 - z2;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < maxDist) {
            // Add connection segment
            const idx = lineIndex * 6;
            linePosAttr.array[idx + 0] = x1;
            linePosAttr.array[idx + 1] = y1;
            linePosAttr.array[idx + 2] = z1;
            linePosAttr.array[idx + 3] = x2;
            linePosAttr.array[idx + 4] = y2;
            linePosAttr.array[idx + 5] = z2;

            // Fade line color based on distance
            const alpha = 1.0 - dist / maxDist;
            const idxC = lineIndex * 6;
            
            // Cool blue to white connections
            lineColAttr.array[idxC + 0] = 0.2 * alpha;
            lineColAttr.array[idxC + 1] = 0.55 * alpha;
            lineColAttr.array[idxC + 2] = 0.9 * alpha;
            lineColAttr.array[idxC + 3] = 0.2 * alpha;
            lineColAttr.array[idxC + 4] = 0.55 * alpha;
            lineColAttr.array[idxC + 5] = 0.9 * alpha;

            lineIndex++;
          }
        }
      }
      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;

      // Mouse Parallax Camera Transitions
      // Slide transitions change target camera offset
      const isMobile = window.innerWidth <= 1024;
      let targetCameraX = mouse.x * 1.5;
      let targetCameraY = mouse.y * 1.0;
      let targetCameraZ = isMobile ? 8.0 : 6.8;

      if (slide !== 0) {
        if (isMobile) {
          targetCameraX = mouse.x * 0.6;
          targetCameraY = 0.4 + mouse.y * 0.5;
          targetCameraZ = 9.8;
        } else {
          targetCameraX = -2.8 + mouse.x * 0.8;
          targetCameraY = 0.5 + mouse.y * 0.6;
          targetCameraZ = 8.5;
        }
      }

      // Smooth lerp camera translation
      camera.position.x += (targetCameraX - camera.position.x) * 0.04;
      camera.position.y += (targetCameraY - camera.position.y) * 0.04;
      camera.position.z += (targetCameraZ - camera.position.z) * 0.04;

      // Look at dynamic focal point (slightly left of center on slide 1-4 for desktop)
      const targetLookAt = new THREE.Vector3(
        (slide !== 0 && !isMobile) ? -1.0 : 0,
        0,
        0
      );
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      lineGeo.dispose();
      pointsMat.dispose();
      lineMat.dispose();
      diskTex.dispose();
      // Rings dispose (Removed)
      renderer.dispose();
    };
  }, [soundActive, slide]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}

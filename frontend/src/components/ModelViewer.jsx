import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Clone, Environment } from '@react-three/drei';
import { ACESFilmicToneMapping, Box3, Vector3 } from 'three';

// Plant types with their 3 growth stage models (1=seed, 2=growing, 3=mature)
export const PLANT_TYPES = [
  { id: 'tree', label: 'Tree', emoji: '🌳' },
  { id: 'bamboo', label: 'Bamboo', emoji: '🎋' },
  { id: 'coffee', label: 'Coffee', emoji: '☕' },
  { id: 'palm', label: 'Palm', emoji: '🌴' },
];

function getModelPath(plantType, stage) {
  if (stage === 'dead') {
    return `/plants/${plantType}/1.glb`;
  }
  const stageMap = { seed: '1', plant: '2', tree: '3' };
  const num = stageMap[stage] || '1';
  return `/plants/${plantType}/${num}.glb`;
}

/**
 * Normalizes any model to fit within a consistent bounding size,
 * regardless of how it was authored in Blender.
 */
function NormalizedModel({ scene, maxSize = 1.8 }) {
  const groupRef = useRef();

  const box = new Box3().setFromObject(scene);
  const size = new Vector3();
  box.getSize(size);
  const largest = Math.max(size.x, size.y, size.z);
  const scale = largest > 0 ? maxSize / largest : 1;

  const center = new Vector3();
  box.getCenter(center);

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      <group position={[-center.x, -center.y, -center.z]}>
        <Clone object={scene} />
      </group>
    </group>
  );
}

function RotatingModel({ path }) {
  const { scene } = useGLTF(path);
  const groupRef = useRef();
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setOpacity(1));
    return () => cancelAnimationFrame(timer);
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <NormalizedModel scene={scene} maxSize={1.1} />
    </group>
  );
}

// Preload all plant models
PLANT_TYPES.forEach(({ id }) => {
  [1, 2, 3].forEach((n) => {
    useGLTF.preload(`/plants/${id}/${n}.glb`);
  });
});

export default function ModelViewer({ stage, plantType = 'tree' }) {
  const modelPath = getModelPath(plantType, stage);

  return (
    <Canvas
      gl={{
        toneMapping: ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
        alpha: true,
        antialias: true,
      }}
      camera={{ position: [0, 0.3, 3.5], fov: 35 }}
      style={{
        width: '100%',
        height: '100%',
        background: 'transparent',
        pointerEvents: 'none',
      }}
    >
      <Environment preset="sunset" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <RotatingModel key={`${plantType}-${stage}`} path={modelPath} />
    </Canvas>
  );
}

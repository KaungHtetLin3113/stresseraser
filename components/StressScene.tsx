"use client";

import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { ReactNode } from "react";

export type CharacterAction = "idle" | "hit" | "kick" | "punch" | "spit";

type SceneProps = {
  action: CharacterAction;
  cameraReset: number;
  faceImageUrl: string | null;
  onActionComplete: () => void;
  onPhotoTextureError: () => void;
};

function FacePhoto({
  imageUrl,
  onError,
}: {
  imageUrl: string | null;
  onError: () => void;
}) {
  const [loadedFace, setLoadedFace] = useState<{
    imageUrl: string;
    texture: THREE.CanvasTexture;
  } | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    let disposed = false;
    let loadedTexture: THREE.CanvasTexture | null = null;
    const image = new window.Image();
    image.onload = () => {
      if (disposed) return;

      const size = 512;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) {
        onError();
        return;
      }

      const scale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
      const width = image.naturalWidth * scale;
      const height = image.naturalHeight * scale;
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);

      loadedTexture = new THREE.CanvasTexture(canvas);
      loadedTexture.colorSpace = THREE.SRGBColorSpace;
      loadedTexture.anisotropy = 4;
      setLoadedFace({ imageUrl, texture: loadedTexture });
    };
    image.onerror = () => {
      if (!disposed) onError();
    };
    image.src = imageUrl;

    return () => {
      disposed = true;
      image.onload = null;
      image.onerror = null;
      loadedTexture?.dispose();
    };
  }, [imageUrl, onError]);

  const texture =
    loadedFace?.imageUrl === imageUrl ? loadedFace.texture : null;
  if (!texture) return null;

  return (
    <mesh renderOrder={2}>
      <sphereGeometry
        args={[
          0.563,
          48,
          32,
          Math.PI * 0.22,
          Math.PI * 0.56,
          Math.PI * 0.22,
          Math.PI * 0.56,
        ]}
      />
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CartoonCharacter({
  action,
  faceImageUrl,
  onActionComplete,
  onPhotoTextureError,
}: SceneProps) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const mallet = useRef<THREE.Group>(null);
  const impactSpark = useRef<THREE.Group>(null);
  const incomingFist = useRef<THREE.Group>(null);
  const incomingFoot = useRef<THREE.Group>(null);
  const spitDroplet = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Group>(null);
  const rightLeg = useRef<THREE.Group>(null);
  const sceneTime = useRef(0);
  const actionStart = useRef(0);

  useEffect(() => {
    actionStart.current = sceneTime.current;
    if (action === "idle") return;

    const timer = window.setTimeout(onActionComplete, 1250);
    return () => window.clearTimeout(timer);
  }, [action, onActionComplete]);

  useFrame(({ clock }, delta) => {
    const time = clock.elapsedTime;
    sceneTime.current = time;
    const age = action === "idle" ? 0 : time - actionStart.current;
    const smoothStep = (start: number, end: number, value: number) => {
      const progress = THREE.MathUtils.clamp((value - start) / (end - start), 0, 1);
      return progress * progress * (3 - 2 * progress);
    };
    const impactTime = action === "spit" ? 0.66 : 0.34;
    const impact = Math.exp(-(((age - impactTime) / 0.12) ** 2));
    const settle = age > 0.34
      ? Math.exp(-(age - 0.34) * 3.1) * Math.sin((age - 0.34) * 19)
      : 0;
    const windUp = smoothStep(0.02, 0.22, age) * (1 - smoothStep(0.22, 0.34, age));
    const punchApproach = smoothStep(0.08, 0.36, age);
    const punchRetreat = smoothStep(0.43, 0.76, age);
    const kickApproach = smoothStep(0.08, 0.36, age);
    const kickRetreat = smoothStep(0.43, 0.76, age);
    const spitReaction = action === "spit" ? impact : 0;
    const idle = action === "idle" ? 1 : 0;
    const hit = action === "hit" ? 1 : 0;
    const kick = action === "kick" ? 1 : 0;
    const punch = action === "punch" ? 1 : 0;
    const spit = action === "spit" ? 1 : 0;
    const reaction = action === "idle" || spit ? 0 : impact;

    if (root.current) {
      root.current.position.y =
        -1.67 +
        Math.sin(time * 2.2) * 0.025 * idle +
        hit * (reaction * 0.1 + settle * 0.055) +
        kick * (reaction * 0.018 + settle * 0.012) +
        punch * (reaction * 0.04 + settle * 0.02) -
        spitReaction * 0.025;
      root.current.rotation.z =
        Math.sin(time * 0.85) * 0.025 * idle -
        hit * (reaction * 0.26 + settle * 0.12) +
        kick * (reaction * 0.07 - settle * 0.035) +
        punch * (reaction * 0.1 - settle * 0.05) +
        spitReaction * 0.035;
      root.current.rotation.x =
        hit * (reaction * 0.12 + settle * 0.06) +
        punch * (reaction * 0.06 + settle * 0.03) -
        spitReaction * 0.04;
    }
    if (torso.current) {
      torso.current.rotation.x =
        hit * (reaction * 0.15 + settle * 0.07) -
        kick * (windUp * 0.04 + reaction * 0.08 + settle * 0.03);
      torso.current.rotation.z =
        Math.sin(time * 2.2) * 0.012 * idle +
        hit * (reaction * 0.08 + settle * 0.045) -
        kick * (windUp * 0.06 + reaction * 0.055) -
        punch * (reaction * 0.12 + settle * 0.05) +
        spitReaction * 0.07;
      torso.current.scale.x = 1 + reaction * 0.09 + spitReaction * 0.025;
      torso.current.scale.y = 1 - reaction * 0.14 - spitReaction * 0.035;
      torso.current.scale.z = 1 + reaction * 0.07;
    }
    if (head.current) {
      head.current.rotation.x =
        hit * (reaction * 0.18 + settle * 0.07) -
        kick * (reaction * 0.05 + settle * 0.02) -
        punch * (reaction * 0.16 + settle * 0.07) -
        spitReaction * 0.12;
      head.current.rotation.z =
        -hit * (reaction * 0.24 + settle * 0.14) +
        kick * (reaction * 0.09 - settle * 0.04) +
        punch * (reaction * 0.2 - settle * 0.08) +
        spitReaction * 0.15 +
        Math.sin(time * 1.5) * 0.018 * idle;
    }
    if (leftArm.current) {
      leftArm.current.rotation.z = THREE.MathUtils.damp(
        leftArm.current.rotation.z,
        0.12 + hit * (windUp * 0.48 + reaction * 0.78 + settle * 0.16) +
          kick * (reaction * 0.22 + settle * 0.06) +
          punch * (reaction * 0.45 + settle * 0.12) +
          spitReaction * 0.42,
        12,
        delta,
      );
      leftArm.current.rotation.x =
        hit * (windUp * 0.24 + reaction * 0.2) -
        punch * (reaction * 0.3) -
        spitReaction * 0.22;
    }
    if (rightArm.current) {
      rightArm.current.rotation.z = THREE.MathUtils.damp(
        rightArm.current.rotation.z,
        -0.12 - hit * (windUp * 0.54 + reaction * 0.84 + settle * 0.16) -
          kick * (reaction * 0.24 + settle * 0.06) -
          punch * (reaction * 0.48 + settle * 0.12) -
          spitReaction * 0.42,
        12,
        delta,
      );
      rightArm.current.rotation.x =
        -hit * (windUp * 0.18 + reaction * 0.2) -
        punch * (reaction * 0.32) +
        spitReaction * 0.22;
    }
    if (leftLeg.current) {
      leftLeg.current.rotation.x =
        kick * (reaction * 0.14 + settle * 0.05);
      leftLeg.current.rotation.z = kick * (-reaction * 0.05);
    }
    if (rightLeg.current) {
      rightLeg.current.rotation.x =
        kick * (-reaction * 0.12 - settle * 0.04);
    }
    if (mallet.current) {
      const swing = smoothStep(0.04, 0.32, age);
      const retreat = smoothStep(0.39, 0.66, age);
      mallet.current.position.x = 1.35 - swing * 0.8 + retreat * 0.8;
      mallet.current.rotation.z = -0.72 + swing * 1.35 - retreat * 0.63;
      mallet.current.position.y = 3.14 + windUp * 0.22 - reaction * 0.08;
    }
    if (incomingFist.current) {
      incomingFist.current.position.set(
        1.65 - punchApproach * 1.25 + punchRetreat * 1.25,
        2.94,
        0.82,
      );
      incomingFist.current.rotation.z = -0.12 + punchApproach * 0.12;
      incomingFist.current.visible = action === "punch" && age < 0.86;
    }
    if (incomingFoot.current) {
      incomingFoot.current.position.set(
        1.8 - kickApproach * 1.35 + kickRetreat * 1.35,
        1.52,
        0.72,
      );
      incomingFoot.current.rotation.z = -0.08 + kickApproach * 0.08;
      incomingFoot.current.visible = action === "kick" && age < 0.86;
    }
    if (spitDroplet.current) {
      spitDroplet.current.children.forEach((drop, index) => {
        const delay = index * 0.075;
        const flightAge = age - 0.08 - delay;
        const flightDuration = 0.56;
        const progress = THREE.MathUtils.clamp(flightAge / flightDuration, 0, 1);
        const arcHeight = 0.08;
        const verticalTravel = 0.01;

        drop.position.set(
          -1.28 + 1.1 * progress,
          2.61 +
            verticalTravel * progress +
            arcHeight * 4 * progress * (1 - progress),
          0.86 - 0.23 * progress,
        );
        drop.rotation.z = Math.atan2(
          verticalTravel + arcHeight * 4 * (1 - 2 * progress),
          1.1,
        );
        drop.visible =
          action === "spit" && flightAge >= 0 && flightAge < flightDuration + 0.04;
        drop.scale.setScalar(1 - smoothStep(flightDuration, flightDuration + 0.04, flightAge));
      });
    }
    if (impactSpark.current) {
      impactSpark.current.position.set(
        kick ? 0.32 : punch ? 0.38 : -0.48,
        kick ? 1.58 : 3.08,
        0.78,
      );
      impactSpark.current.rotation.z = time * 2.6;
      impactSpark.current.scale.setScalar(
        Math.max(0.001, spit ? 0 : reaction * 1.1),
      );
    }
  });

  return (
    <group ref={root} position={[0, -1.67, 0]}>
      {action === "hit" && (
        <group ref={mallet} position={[1.35, 3.14, 0.55]}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.065, 0.48, 12]} />
            <meshStandardMaterial color="#ffbd83" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.12, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <capsuleGeometry args={[0.16, 0.2, 6, 16]} />
            <meshStandardMaterial color="#8f7cf4" roughness={0.52} />
          </mesh>
          <mesh position={[0, 0.12, 0.12]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.055, 0.18, 4, 12]} />
            <meshBasicMaterial color="#c7bbff" />
          </mesh>
        </group>
      )}
      {action === "punch" && (
        <group ref={incomingFist} position={[1.65, 2.94, 0.82]}>
          <mesh scale={[0.25, 0.2, 0.19]} castShadow>
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color="#ee6b52" roughness={0.45} />
          </mesh>
          <mesh position={[0.2, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.105, 0.13, 0.18, 16]} />
            <meshStandardMaterial color="#f0bd83" roughness={0.7} />
          </mesh>
          <mesh position={[-0.06, -0.12, 0.11]} scale={[0.11, 0.08, 0.08]} castShadow>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color="#f28a69" roughness={0.45} />
          </mesh>
        </group>
      )}
      {action === "kick" && (
        <group ref={incomingFoot} position={[1.8, 1.52, 0.72]}>
          <mesh
            position={[0.16, 0.02, 0]}
            rotation={[0, 0, Math.PI / 2]}
            scale={[0.76, 1, 0.72]}
            castShadow
          >
            <capsuleGeometry args={[0.13, 0.34, 6, 14]} />
            <meshStandardMaterial color="#f0bd83" roughness={0.72} />
          </mesh>
          <mesh
            position={[-0.13, -0.04, 0.04]}
            rotation={[0, 0, Math.PI / 2]}
            scale={[0.75, 1.2, 0.62]}
            castShadow
          >
            <capsuleGeometry args={[0.13, 0.3, 6, 14]} />
            <meshStandardMaterial color="#f7ad49" roughness={0.58} />
          </mesh>
          <mesh position={[-0.3, -0.14, 0.05]} scale={[0.08, 0.045, 0.08]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color="#fff4e8" roughness={0.48} />
          </mesh>
        </group>
      )}

      {action !== "idle" && (
        <group ref={impactSpark} scale={0.001}>
          <mesh>
            <icosahedronGeometry args={[0.18, 0]} />
            <meshBasicMaterial color="#ffd36a" toneMapped={false} />
          </mesh>
          <mesh position={[0.24, 0.16, -0.03]} scale={0.48}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshBasicMaterial color="#ff966b" toneMapped={false} />
          </mesh>
          <mesh position={[-0.22, 0.2, -0.04]} scale={0.38}>
            <octahedronGeometry args={[0.18, 0]} />
            <meshBasicMaterial color="#a99bff" toneMapped={false} />
          </mesh>
        </group>
      )}
      {action === "spit" && (
        <group ref={spitDroplet}>
          {[0.038, 0.027, 0.019].map((radius) => (
            <group key={radius} visible={false}>
              <mesh scale={[radius * 1.45, radius * 0.82, radius]}>
                <sphereGeometry args={[1, 16, 12]} />
                <meshPhysicalMaterial
                  color="#e2f5ef"
                  transparent
                  opacity={0.78}
                  roughness={0.12}
                  clearcoat={0.9}
                  depthWrite={false}
                />
              </mesh>
              <mesh
                position={[-radius * 0.3, radius * 0.18, radius * 0.78]}
                scale={radius * 0.2}
              >
                <sphereGeometry args={[1, 10, 8]} />
                <meshBasicMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.72}
                  depthWrite={false}
                />
              </mesh>
            </group>
          ))}
        </group>
      )}

      <group ref={torso}>
        <mesh position={[0, 1.72, 0]} castShadow>
          <capsuleGeometry args={[0.43, 0.72, 8, 20]} />
          <meshStandardMaterial color="#ed7652" roughness={0.78} />
        </mesh>
        <mesh position={[0, 1.93, 0.405]} castShadow>
          <circleGeometry args={[0.13, 32]} />
          <meshStandardMaterial color="#ffbd83" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.13, 0]} castShadow>
          <sphereGeometry args={[0.43, 24, 20]} />
          <meshStandardMaterial color="#34334a" roughness={0.86} />
        </mesh>
      </group>

      <mesh position={[0, 2.31, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.22, 0.42, 20]} />
        <meshStandardMaterial color="#d99070" roughness={0.82} />
      </mesh>

      <group ref={leftArm} position={[-0.52, 2.08, 0]}>
        <mesh position={[-0.12, -0.39, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.47, 6, 16]} />
          <meshStandardMaterial color="#ed7652" roughness={0.78} />
        </mesh>
        <mesh position={[-0.19, -0.74, 0.02]} castShadow>
          <sphereGeometry args={[0.18, 20, 16]} />
          <meshStandardMaterial color="#d99070" roughness={0.82} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.52, 2.08, 0]}>
        <mesh position={[0.12, -0.39, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.47, 6, 16]} />
          <meshStandardMaterial color="#ed7652" roughness={0.78} />
        </mesh>
        <mesh position={[0.19, -0.74, 0.02]} castShadow>
          <sphereGeometry args={[0.18, 20, 16]} />
          <meshStandardMaterial color="#d99070" roughness={0.82} />
        </mesh>
      </group>

      <group ref={leftLeg} position={[-0.23, 1.02, 0]}>
        <mesh position={[0, -0.39, 0]} castShadow>
          <capsuleGeometry args={[0.19, 0.48, 6, 16]} />
          <meshStandardMaterial color="#34334a" roughness={0.86} />
        </mesh>
        <mesh position={[-0.01, -0.86, 0.12]} castShadow>
          <capsuleGeometry args={[0.17, 0.27, 5, 14]} />
          <meshStandardMaterial color="#f0a365" roughness={0.6} />
        </mesh>
      </group>
      <group ref={rightLeg} position={[0.23, 1.02, 0]}>
        <mesh position={[0, -0.39, 0]} castShadow>
          <capsuleGeometry args={[0.19, 0.48, 6, 16]} />
          <meshStandardMaterial color="#34334a" roughness={0.86} />
        </mesh>
        <mesh position={[0.01, -0.86, 0.12]} castShadow>
          <capsuleGeometry args={[0.17, 0.27, 5, 14]} />
          <meshStandardMaterial color="#f0a365" roughness={0.6} />
        </mesh>
      </group>

      <group ref={head} position={[0, 2.82, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.56, 40, 32]} />
          <meshStandardMaterial
            color="#d99070"
            roughness={0.78}
            metalness={0}
          />
        </mesh>
        <mesh position={[0, 0.49, 0.035]} scale={[0.88, 0.32, 0.82]} castShadow>
          <sphereGeometry args={[0.52, 32, 20]} />
          <meshStandardMaterial color="#443246" roughness={0.9} />
        </mesh>
        <mesh position={[-0.51, -0.02, 0.08]} scale={[0.2, 0.28, 0.12]} castShadow>
          <sphereGeometry args={[0.38, 20, 16]} />
          <meshStandardMaterial color="#d99070" roughness={0.82} />
        </mesh>
        <mesh position={[0.51, -0.02, 0.08]} scale={[0.2, 0.28, 0.12]} castShadow>
          <sphereGeometry args={[0.38, 20, 16]} />
          <meshStandardMaterial color="#d99070" roughness={0.82} />
        </mesh>

        {faceImageUrl ? (
          <FacePhoto imageUrl={faceImageUrl} onError={onPhotoTextureError} />
        ) : (
          <group>
            <mesh position={[-0.21, 0.06, 0.47]}>
              <sphereGeometry args={[0.07, 16, 12]} />
              <meshStandardMaterial color="#fff4e8" />
            </mesh>
            <mesh position={[0.21, 0.06, 0.47]}>
              <sphereGeometry args={[0.07, 16, 12]} />
              <meshStandardMaterial color="#fff4e8" />
            </mesh>
            <mesh position={[-0.21, 0.06, 0.525]}>
              <sphereGeometry args={[0.034, 12, 10]} />
              <meshStandardMaterial color="#382b35" />
            </mesh>
            <mesh position={[0.21, 0.06, 0.525]}>
              <sphereGeometry args={[0.034, 12, 10]} />
              <meshStandardMaterial color="#382b35" />
            </mesh>
            <mesh position={[0, -0.13, 0.53]}>
              <sphereGeometry args={[0.09, 16, 12]} />
              <meshStandardMaterial color="#c47a61" />
            </mesh>
            <mesh position={[0, -0.31, 0.48]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.17, 0.025, 8, 28, Math.PI]} />
              <meshStandardMaterial color="#713e44" />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}

function SceneContents({
  cameraReset,
  children,
}: {
  cameraReset: number;
  children: ReactNode;
}) {
  const orbit = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    orbit.current?.reset();
  }, [cameraReset]);

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[-4, 7, 6]} intensity={3} castShadow />
      <pointLight position={[4, 3, 2]} intensity={1.6} color="#ff7952" />
      <pointLight position={[-4, 1, -3]} intensity={1.6} color="#6658bd" />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.72, 0]}
        receiveShadow
      >
        <circleGeometry args={[5, 64]} />
        <meshStandardMaterial color="#19181d" roughness={0.88} />
      </mesh>
      {children}
      <ContactShadows
        position={[0, -1.7, 0]}
        opacity={0.48}
        scale={5}
        blur={2.2}
        far={2.4}
        resolution={256}
        color="#050507"
      />
      <OrbitControls
        ref={orbit}
        makeDefault
        target={[0, 0.08, 0]}
        enablePan={false}
        enableDamping
        dampingFactor={0.075}
        minDistance={4.5}
        maxDistance={9}
        minPolarAngle={Math.PI / 3.4}
        maxPolarAngle={Math.PI / 1.95}
        minAzimuthAngle={-Math.PI / 2.6}
        maxAzimuthAngle={Math.PI / 2.6}
      />
    </>
  );
}

export default function StressScene(props: SceneProps) {
  return (
    <div className="scene-canvas" role="img" aria-label="Interactive cartoon character preview">
      <Canvas
        shadows="percentage"
        dpr={[1, 1.6]}
        camera={{ position: [0, 1.45, 7.3], fov: 34, near: 0.1, far: 50 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      >
        <SceneContents cameraReset={props.cameraReset}>
          <CartoonCharacter {...props} />
        </SceneContents>
      </Canvas>
    </div>
  );
}

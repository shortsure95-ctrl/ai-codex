import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Upload, Trash2, Sparkles, CircleAlert, CheckCircle, HelpCircle } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";

// IndexedDB Helper Functions
const DB_NAME = "Myraa3DStorage";
const STORE_NAME = "models";
const MODEL_KEY = "active_model";

let inMemory3DModel: { fileData: ArrayBuffer; fileName: string; fileType: string } | null = null;

function initDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn("Myraa3DStorage IndexedDB failed to open. Using session memory.");
        resolve(null);
      };
    } catch (err) {
      console.warn("Myraa3DStorage IndexedDB is restricted/blocked in this sandboxed environment. Using session memory fallback.", err);
      resolve(null);
    }
  });
}

function saveModelToDB(fileData: ArrayBuffer, fileName: string, fileType: string): Promise<void> {
  inMemory3DModel = { fileData, fileName, fileType };
  try {
    localStorage.setItem(`myraa_3d_meta_${MODEL_KEY}`, JSON.stringify({ fileName, fileType }));
  } catch (e) {}

  return initDB().then((db) => {
    if (!db) return Promise.resolve();
    return new Promise<void>((resolve) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ fileData, fileName, fileType }, MODEL_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  });
}

function getSavedModelFromDB(): Promise<{ fileData: ArrayBuffer; fileName: string; fileType: string } | null> {
  return initDB().then((db) => {
    if (!db) {
      return inMemory3DModel;
    }
    return new Promise((resolve) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(MODEL_KEY);
        request.onsuccess = () => resolve(request.result || inMemory3DModel || null);
        request.onerror = () => resolve(inMemory3DModel || null);
      } catch (err) {
        resolve(inMemory3DModel || null);
      }
    });
  });
}

function deleteModelFromDB(): Promise<void> {
  inMemory3DModel = null;
  try {
    localStorage.removeItem(`myraa_3d_meta_${MODEL_KEY}`);
  } catch (e) {}
  return initDB().then((db) => {
    if (!db) return Promise.resolve();
    return new Promise<void>((resolve) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(MODEL_KEY);
        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      } catch (err) {
        resolve();
      }
    });
  });
}

interface Myraa3DModelProps {
  session: any | null;
  themeColor: string; // violet, crimson, emerald, celestial, gold, rose, charcoal
  characterState: "idle" | "thinking" | "talking";
}

export const Myraa3DModel: React.FC<Myraa3DModelProps> = ({
  session,
  themeColor,
  characterState,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  const handleContainerClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // File, DB, loading systems
  const [modelName, setModelName] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [modelType, setModelType] = useState<"glb" | "gltf" | "obj" | "vrm" | "procedural">("procedural");

  // Keep refs for live state to avoid re-triggering Three core context loop
  const currentThemeColorRef = useRef<string>(themeColor);
  const currentCharacterStateRef = useRef<"idle" | "thinking" | "talking">(characterState);
  const audioVolumeRef = useRef<number>(0);
  const activeModelBlobUrlRef = useRef<string | null>(null);

  // References for live model manipulation
  const currentSceneRef = useRef<THREE.Group | null>(null);
  const currentMixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentVrmRef = useRef<any | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // Handle live updates
  useEffect(() => {
    currentThemeColorRef.current = themeColor;
  }, [themeColor]);

  useEffect(() => {
    currentCharacterStateRef.current = characterState;
  }, [characterState]);

  // Audio analysis tracker
  useEffect(() => {
    let animFrame: number;
    const processAudio = () => {
      let level = 0;
      if (session) {
        let analyser = null;
        if (session.outputAnalyser && currentCharacterStateRef.current === "talking") {
          analyser = session.outputAnalyser;
        } else if (session.inputAnalyser && session.state === "listening") {
          analyser = session.inputAnalyser;
        }

        if (analyser) {
          const bufferLength = 32;
          const dataArray = new Uint8Array(bufferLength);
          try {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            level = sum / bufferLength; // 0 to 255
          } catch (e) {}
        }
      }
      // Ease/Interpolate volume
      audioVolumeRef.current += (level / 255 - audioVolumeRef.current) * 0.25;
      animFrame = requestAnimationFrame(processAudio);
    };

    processAudio();
    return () => cancelAnimationFrame(animFrame);
  }, [session]);

  // Translate theme name to THREE colors
  const getThemeHex = (colorName: string) => {
    switch (colorName) {
      case "violet": return 0xa855f7; // purple-500
      case "crimson": return 0xe11d48; // rose-600
      case "emerald": return 0x10b981; // emerald-500
      case "celestial": return 0x0ea5e9; // sky-500
      case "gold": return 0xeab308; // yellow-500
      case "rose": return 0xf43f5e; // rose-500
      default: return 0x06b6d4; // cyan-500
    }
  };

  // Main ThreeJS engine builder
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // 1. SCENE + CAMERA + RENDERER
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.015);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.5, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 2. CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Limit rotation below ground
    controls.minDistance = 2;
    controls.maxDistance = 15;

    // 3. LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(2, 5, 5);
    scene.add(mainLight);

    const glowLight = new THREE.PointLight(getThemeHex(currentThemeColorRef.current), 3, 10);
    glowLight.position.set(0, 0, 0);
    scene.add(glowLight);

    // Dynamic Rim Neon light from below
    const backRimLight = new THREE.DirectionalLight(getThemeHex(currentThemeColorRef.current), 2.2);
    backRimLight.position.set(-3, -2, -3);
    scene.add(backRimLight);

    // 4. FLOATING DATA GRID OR DECORATIONS (The Cyber holographic stage grid)
    const gridHelper = new THREE.GridHelper(20, 40, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    // 5. PROCEDURAL HOLOGRAM FALLBACK MODEL (Spinning Neural Node Synapse Ring)
    const proceduralGroup = new THREE.Group();
    
    // Core Glowing Sphere
    const coreGeo = new THREE.IcosahedronGeometry(1.1, 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: getThemeHex(currentThemeColorRef.current),
      wireframe: true,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    proceduralGroup.add(coreMesh);

    // Sine outer frequency rings
    const outerRings: THREE.Line[] = [];
    for (let r = 0; r < 4; r++) {
      const ringGeo = new THREE.RingGeometry(1.6 + r * 0.18, 1.62 + r * 0.18, 64);
      const ringMat = new THREE.LineBasicMaterial({
        color: getThemeHex(currentThemeColorRef.current),
        transparent: true,
        opacity: 0.25 - r * 0.05,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Line(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      ring.rotation.y = (Math.random() - 0.5) * 0.4;
      proceduralGroup.add(ring);
      outerRings.push(ring);
    }

    // Floating Stardust/Synapse particles
    const particleCount = 180;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      // Spherical coordinate placement
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 1.35 + Math.random() * 0.45;

      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      particlePositions[i * 3 + 2] = r * Math.cos(phi);

      particleSpeeds.push(0.3 + Math.random() * 1.5);
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    
    // Glowing texture using Canvas
    const canvas = document.createElement("canvas");
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.4)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
    }
    const dotTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      color: getThemeHex(currentThemeColorRef.current),
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      map: dotTexture,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const synapses = new THREE.Points(particleGeo, particleMat);
    proceduralGroup.add(synapses);
    scene.add(proceduralGroup);

    // Keep holds of loaded model representations
    let activeCustomModel: THREE.Object3D | null = null;

    // 6. LOAD MODEL FROM EXTERNALLY SUPPLIED BLOB URL
    const loadModelAsset = () => {
      const url = activeModelBlobUrlRef.current;
      if (!url) {
        proceduralGroup.visible = true;
        setModelType("procedural");
        return;
      }

      setIsParsing(true);
      setLoadingError(null);

      // Clean old active customized models
      if (activeCustomModel) {
        scene.remove(activeCustomModel);
        activeCustomModel = null;
      }
      if (currentMixerRef.current) {
        currentMixerRef.current.stopAllAction();
        currentMixerRef.current = null;
      }
      if (currentVrmRef.current) {
        currentVrmRef.current = null;
      }

      const isVRM = modelName.toLowerCase().endsWith(".vrm") || modelName.toLowerCase().endsWith(".vmr");
      const isGLTF = isVRM || modelName.toLowerCase().endsWith(".glb") || modelName.toLowerCase().endsWith(".gltf") || modelName.toLowerCase().endsWith(".vmr") || (url.startsWith("blob:") && modelName.toLowerCase().indexOf(".obj") === -1);

      if (isGLTF) {
        const loader = new GLTFLoader();
        if (isVRM) {
          loader.register((parser) => new VRMLoaderPlugin(parser));
        }

        loader.load(
          url,
          (gltf) => {
            let loadedObj = gltf.scene;

            if (isVRM && gltf.userData.vrm) {
              const vrm = gltf.userData.vrm;
              currentVrmRef.current = vrm;
              loadedObj = vrm.scene;
              
              // VRM models are facing -Z by default, rotate 180 degrees (Math.PI) to face user camera
              loadedObj.rotation.y = Math.PI;

              // Disable frustum culling so the model parts aren't dynamically clipped
              loadedObj.traverse((obj) => {
                obj.frustumCulled = false;
                if (obj instanceof THREE.Mesh) {
                  obj.castShadow = true;
                  obj.receiveShadow = true;
                }
              });

              proceduralGroup.visible = false;
              setModelType("vrm");
            } else {
              proceduralGroup.visible = false;
              setModelType("glb");
            }

            activeCustomModel = loadedObj;
            scene.add(loadedObj);

            // Auto-scale and perfectly center model
            const box = new THREE.Box3().setFromObject(loadedObj);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // Normalize size
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.4 / maxDim; // target size matching comfortable camera view
            loadedObj.scale.set(scale, scale, scale);
            
            // Adjust position slightly centered on grid platform
            // For VRMs, center.y might be near eye/body level depending on pivot. Adjust accordingly.
            loadedObj.position.x = -center.x * scale;
            if (isVRM) {
              // Align feet perfectly on our grid platform which sits at y = -1.5
              loadedObj.position.y = -1.5 - (box.min.y * scale);
            } else {
              loadedObj.position.y = -center.y * scale - 0.2;
            }
            loadedObj.position.z = -center.z * scale;

            // Apply glowing neon material styles over children for futuristic look if requested,
            // or preserve original high quality maps/texture assets of their file
            loadedObj.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                  // Ensure materials are responsive to point lighting setups
                  if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.envMapIntensity = 1.0;
                  }
                }
              }
            });

            // Initialize clips if clips exist inside `.glb`
            if (gltf.animations && gltf.animations.length > 0) {
              const mixer = new THREE.AnimationMixer(loadedObj);
              currentMixerRef.current = mixer;
              const primaryClip = gltf.animations[0];
              const action = mixer.clipAction(primaryClip);
              action.play();
            }

            setIsParsing(false);
          },
          undefined,
          (error) => {
            console.error("ThreeJS GLTF Parser Error:", error);
            setLoadingError("Unable to decode 3D GLTF structure. File may be corrupted or contains missing dependencies.");
            setIsParsing(false);
            proceduralGroup.visible = true;
            setModelType("procedural");
          }
        );
      } else {
        // OBJ format
        const loader = new OBJLoader();
        loader.load(
          url,
          (obj) => {
            activeCustomModel = obj;
            scene.add(obj);

            proceduralGroup.visible = false;
            setModelType("obj");

            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.4 / maxDim;
            obj.scale.set(scale, scale, scale);

            obj.position.x = -center.x * scale;
            obj.position.y = -center.y * scale - 0.2;
            obj.position.z = -center.z * scale;

            // Give OBJ a beautiful glowing ambient material so it looks highly holographic
            const colorThemeHex = getThemeHex(currentThemeColorRef.current);
            obj.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.material = new THREE.MeshPhongMaterial({
                  color: colorThemeHex,
                  shininess: 90,
                  wireframe: true,
                  transparent: true,
                  opacity: 0.65,
                  blending: THREE.AdditiveBlending,
                });
              }
            });

            setIsParsing(false);
          },
          undefined,
          (error) => {
            console.error("ThreeJS OBJ Parser Error:", error);
            setLoadingError("Unable to digest 3D OBJ structure. Ensure standard geometric components.");
            setIsParsing(false);
            proceduralGroup.visible = true;
            setModelType("procedural");
          }
        );
      }
    };

    // Load actual DB stored files or default assets
    getSavedModelFromDB().then((saved) => {
      if (saved) {
        setModelName(saved.fileName);
        const blob = new Blob([saved.fileData], { type: "application/octet-stream" });
        activeModelBlobUrlRef.current = URL.createObjectURL(blob);
        loadModelAsset();
      } else {
        // Load the uploaded VRM avatar by default so the user immediately gets a real 3D avatar
        setModelName("Moyna (User VRM)");
        activeModelBlobUrlRef.current = "/assets/5660672466363812436.vrm";
        loadModelAsset();
      }
    });

    // 7. ANIMATION TICK LOOP
    let blinkTimer = 0;
    let currentMouthOpen = 0;
    let smoothedTalkingAura = 0;

    const animate = () => {
      const dt = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      // Update VRM core mechanics if present
      if (currentVrmRef.current) {
        currentVrmRef.current.update(dt);

        // Position arms down (Aesthetic standing/talking pose to solve stiff T-pose)
        try {
          const humanoid = currentVrmRef.current.humanoid;
          if (humanoid) {
            const leftUpperArm = humanoid.getNormalizedBoneNode("leftUpperArm");
            const rightUpperArm = humanoid.getNormalizedBoneNode("rightUpperArm");
            const leftLowerArm = humanoid.getNormalizedBoneNode("leftLowerArm");
            const rightLowerArm = humanoid.getNormalizedBoneNode("rightLowerArm");
            const head = humanoid.getNormalizedBoneNode("head");
            const neck = humanoid.getNormalizedBoneNode("neck");
            const spine = humanoid.getNormalizedBoneNode("spine");

            const breathingSway = Math.sin(elapsed * 1.6) * 0.015;
            const targetTalkingAura = currentCharacterStateRef.current === "talking" ? Math.sin(elapsed * 5.0) * 0.03 : 0;
            // Smoothly interpolate talking aura to eliminate any visual snaps
            smoothedTalkingAura += (targetTalkingAura - smoothedTalkingAura) * 0.15;

            if (leftUpperArm) {
              // Rotate arm down (Z-rotation is standard bend for VRM)
              leftUpperArm.rotation.z = 1.25 + breathingSway;
              leftUpperArm.rotation.x = 0.15;
              leftUpperArm.rotation.y = 0.05;
            }
            if (rightUpperArm) {
              rightUpperArm.rotation.z = -1.25 - breathingSway;
              rightUpperArm.rotation.x = 0.15;
              rightUpperArm.rotation.y = -0.05;
            }
            if (leftLowerArm) {
              leftLowerArm.rotation.y = 0.3 + smoothedTalkingAura;
              leftLowerArm.rotation.x = 0.1;
            }
            if (rightLowerArm) {
              rightLowerArm.rotation.y = -0.3 - smoothedTalkingAura;
              rightLowerArm.rotation.x = 0.1;
            }
            if (neck) {
              neck.rotation.y = Math.sin(elapsed * 0.5) * 0.04;
              neck.rotation.x = 0.02 + Math.sin(elapsed * 1.0) * 0.015;
            }
            if (head) {
              head.rotation.y = Math.sin(elapsed * 0.5) * 0.015;
              head.rotation.x = Math.sin(elapsed * 1.0) * 0.01;
            }
            if (spine) {
              // Body sway
              spine.rotation.y = Math.sin(elapsed * 0.3) * 0.01;
              spine.rotation.x = Math.sin(elapsed * 1.6) * 0.008;
            }
          }
        } catch (poseError) {
          console.warn("Unable to posture VRM bones:", poseError);
        }

        // Apply audio levels and lip sync mapping
        if (currentVrmRef.current.expressionManager) {
          const isCurrentlyTalking = currentCharacterStateRef.current === "talking";
          const targetMouthOpen = isCurrentlyTalking ? Math.min(audioVolumeRef.current * 4.5, 1.0) : 0;
          // Smoothly interpolate mouth opening (aa expression) to avoid robotic snaps
          currentMouthOpen += (targetMouthOpen - currentMouthOpen) * 0.25;
          currentVrmRef.current.expressionManager.setValue("aa", currentMouthOpen);

          // Automatic natural eye blinking physics
          blinkTimer += dt;
          let blinkValue = 0;
          if (blinkTimer > 4.0) {
            if (blinkTimer < 4.15) {
              blinkValue = Math.sin((blinkTimer - 4.0) * Math.PI / 0.15);
            } else {
              blinkTimer = Math.random() * 2.0;
            }
          }
          currentVrmRef.current.expressionManager.setValue("blink", blinkValue);
        }
      }

      // Slow orbital rotate procedural sphere
      if (proceduralGroup.visible) {
        proceduralGroup.rotation.y = elapsed * 0.12;
        coreMesh.rotation.y = elapsed * -0.22;
        coreMesh.rotation.x = Math.sin(elapsed * 0.15) * 0.2;

        // Apply audio pulse to fallback sphere details
        const audioPulse = 1.0 + audioVolumeRef.current * 0.95;
        coreMesh.scale.set(audioPulse, audioPulse, audioPulse);

        // Slow hover oscillation
        proceduralGroup.position.y = Math.sin(elapsed * 1.5) * 0.08;

        // Deform rings sinusoidally
        outerRings.forEach((ring, idx) => {
          ring.rotation.z = elapsed * 0.05 * (idx + 1);
          ring.scale.set(1 + audioVolumeRef.current * 0.1, 1 + audioVolumeRef.current * 0.1, 1);
        });

        // Rotate particles inside
        synapses.rotation.y = elapsed * 0.02;
      }

      // Animate custom 3D model if it exists
      if (activeCustomModel && !isParsing) {
        // Apply ambient hovering animation
        const isCurrentlyTalking = currentCharacterStateRef.current === "talking";
        const cycleSpeed = isCurrentlyTalking ? 3.0 : 1.2;
        const amplitude = isCurrentlyTalking ? 0.14 : 0.04;
        
        activeCustomModel.position.y = -0.15 + Math.sin(elapsed * cycleSpeed) * amplitude;
        
        // Face tracking micro-sway towards orbit camera position gently
        // Only apply standard micro-sway if it is not a VRM, as VRM has its own rigging
        if (!currentVrmRef.current) {
          activeCustomModel.rotation.y = Math.sin(elapsed * 0.35) * 0.04;
        }

        // Apply audio pulse to lighting/glow intensity
        glowLight.intensity = 1.0 + audioVolumeRef.current * 5.0;

        // Feed mixer
        if (currentMixerRef.current) {
          // Accelerate mixers when talking for active visual response
          const playRate = isCurrentlyTalking ? 1.4 : 1.0;
          currentMixerRef.current.update(dt * playRate);
        }
      }

      // Sync lighting hues to conversational aura
      const activeThemeHex = getThemeHex(currentThemeColorRef.current);
      glowLight.color.setHex(activeThemeHex);
      backRimLight.color.setHex(activeThemeHex);

      controls.update();
      renderer.render(scene, camera);
      currentSceneRef.current = proceduralGroup; // hold fallback ref

      // Capture callback link for file loading trigger
      (window as any).__triggerModelReload = () => {
        loadModelAsset();
      };
    };

    renderer.setAnimationLoop(animate);

    // 8. CORRECTION ON COMPANION RESIZE
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Cleanup resources
    return () => {
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
      controls.dispose();
      
      delete (window as any).__triggerModelReload;
      
      if (activeModelBlobUrlRef.current) {
        URL.revokeObjectURL(activeModelBlobUrlRef.current);
      }
    };
  }, []);

  // Upload actions
  const processUploadedFile = async (file: File) => {
    setIsParsing(true);
    setLoadingError(null);
    const validEnds = [".glb", ".gltf", ".obj", ".vrm", ".vmr"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    
    if (!validEnds.includes(ext)) {
      setLoadingError("Unsupported 3D asset extension. Please select a valid .glb, .gltf, .obj, .vrm, or .vmr avatar.");
      setIsParsing(false);
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      // Store in Web IndexedDB local sandbox
      await saveModelToDB(arrayBuffer, file.name, ext);
      setModelName(file.name);

      // Trigger hot refresh inside Canvas context
      if (activeModelBlobUrlRef.current) {
        URL.revokeObjectURL(activeModelBlobUrlRef.current);
      }
      const newBlob = new Blob([arrayBuffer], { type: "application/octet-stream" });
      activeModelBlobUrlRef.current = URL.createObjectURL(newBlob);

      if (typeof (window as any).__triggerModelReload === "function") {
        (window as any).__triggerModelReload();
      }

      // Dispatch custom event to notify parent components to auto-switch to 3D View mode
      window.dispatchEvent(new CustomEvent("myraa-model-loaded"));
    } catch (err: any) {
      console.error("IndexedDB write failed:", err);
      setLoadingError("Unable to store model locally. Browser may have sandbox quotas allocated.");
      setIsParsing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  const handleClearModel = async () => {
    setIsParsing(true);
    try {
      await deleteModelFromDB();
      setModelName("");
      
      if (activeModelBlobUrlRef.current) {
        URL.revokeObjectURL(activeModelBlobUrlRef.current);
        activeModelBlobUrlRef.current = null;
      }
      
      if (typeof (window as any).__triggerModelReload === "function") {
        (window as any).__triggerModelReload();
      }
    } catch (err) {
      console.error("Failed to delete model:", err);
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#050510]/95 rounded-[2rem] select-none p-1 border border-white/5 shadow-2xl pointer-events-auto">
      {/* 3D Visualizer Canvas Canvas Element stage container */}
      <div 
        ref={mountRef} 
        className="relative flex-1 w-full rounded-[1.75rem] overflow-hidden" 
        onDragEnter={handleDrag} 
        onDragOver={handleDrag} 
        onDragLeave={handleDrag} 
        onDrop={handleDrop}
      >
        {/* Cinematic Matrix Grid Overlay Decoration (Styling) */}
        <div className="absolute top-4 left-4 z-40 pointer-events-none font-mono text-[9px] text-[#5cc4ff]/50 flex flex-col gap-0.5">
          <div>// MODEL_PROJECTOR: THREE_WEBGL_CORE</div>
          <div>// SHADER_AURA: {themeColor.toUpperCase()} ({characterState === "talking" ? "ACTIVE_STREAM" : "STANDBY"})</div>
          <div className="mt-1 flex items-center gap-1.5 text-cyan-300">
            <span className={`w-1.5 h-1.5 rounded-full ${characterState === "talking" ? "bg-pink-400 animate-ping" : "bg-emerald-400"}`} />
            <span>MESH_TYPE: {modelType.toUpperCase()}</span>
          </div>
          {modelName && (
            <div className="text-zinc-400 bg-white/5 border border-white/5 rounded-md px-2 py-1 mt-1 truncate max-w-[200px] pointer-events-auto flex items-center gap-1">
              <span className="truncate">{modelName}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleClearModel(); }}
                className="hover:text-rose-400 cursor-pointer text-zinc-500 transition-colors shrink-0" 
                title="Clear custom 3D model"
              >
                <Trash2 size={10} />
              </button>
            </div>
          )}
        </div>

        {/* Orbit instruction hint */}
        <div className="absolute top-4 right-4 z-40 pointer-events-none font-mono text-[9px] text-[#5cc4ff]/40 flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-white/5">
          <HelpCircle size={10} />
          <span>DRAG TO ORBIT // SCROLL ZOOM</span>
        </div>

        {/* Floating file upload helper over visualizer */}
        <AnimatePresence>
          {(!modelName && !isParsing && !loadingError) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-30 pointer-events-none">
              <div 
                onClick={handleContainerClick}
                className="pointer-events-auto flex flex-col items-center justify-center p-8 bg-slate-950/85 backdrop-blur-md rounded-3xl border border-cyan-500/20 shadow-2xl max-w-sm w-full text-center hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 cursor-pointer group active:scale-[0.98]"
              >
                <div className="p-4 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-4 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                  <Upload size={32} className="animate-bounce" />
                </div>
                
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-widest mb-2">
                  Upload Your 3D Avatar
                </h4>
                
                <p className="text-[11px] text-slate-300 mb-5 leading-relaxed">
                  Click here or drag-and-drop a <span className="text-cyan-400 font-semibold font-mono">.vrm</span>, <span className="text-cyan-400 font-semibold font-mono">.vmr</span>, <span className="text-cyan-400 font-semibold font-mono">.glb</span>, or <span className="text-cyan-400 font-semibold font-mono">.obj</span> file to customize Moyna.
                </p>

                <button 
                  type="button"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-mono text-[11px] font-bold tracking-widest uppercase shadow-lg shadow-cyan-950/50 hover:brightness-110 transition-all pointer-events-none cursor-pointer"
                >
                  Select File
                </button>

                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".glb,.gltf,.obj,.vrm,.vmr" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Drag active visual overlay */}
        <AnimatePresence>
          {dragActive && (
            <div className="absolute inset-0 bg-cyan-500/15 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-cyan-400 rounded-[1.75rem] pointer-events-none animate-fade-in">
              <div className="p-4 rounded-full bg-slate-950/80 border border-cyan-400 flex flex-col items-center gap-3 shadow-2xl">
                <Sparkles className="text-cyan-400 animate-spin" size={32} />
                <p className="text-xs font-mono font-bold tracking-widest text-[#9ecfff]">DROP 3D MODEL FILE TO LOAD</p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Parsing state loader */}
        {isParsing && (
          <div className="absolute inset-0 bg-[#050510]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[1.75rem]">
            <div className="flex flex-col items-center gap-3.5 max-w-xs text-center px-4">
              <div className="relative flex items-center justify-center w-12 h-12">
                <span className="absolute animate-ping h-8 w-8 rounded-full bg-cyan-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500"></span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-widest select-none font-bold">DIGESTING MESH POLYGONS</h4>
                <div className="w-40 h-1 bg-white/5 rounded-full mt-2.5 overflow-hidden">
                  <div className="w-1/2 h-full bg-cyan-400 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading error overlays */}
        {loadingError && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-rose-950/80 backdrop-blur-md rounded-2xl border border-rose-500/30 p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <CircleAlert className="text-rose-400 shrink-0" size={18} />
              <div className="flex-1 text-left">
                <h4 className="text-xs font-bold text-rose-200 font-mono text-bold uppercase">Parsing Matrix Disrupted</h4>
                <p className="text-[10px] text-rose-300 mt-1 leading-relaxed">{loadingError}</p>
                <div className="mt-3 flex gap-2">
                  <label className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-lg text-[9px] font-mono cursor-pointer transition-colors">
                    Try Another File
                    <input type="file" accept=".glb,.gltf,.obj,.vrm,.vmr" className="hidden" onChange={handleFileChange} />
                  </label>
                  <button 
                    onClick={() => setLoadingError(null)}
                    className="px-2 py-1 bg-rose-500/10 select-none border border-rose-400/20 rounded-lg text-rose-300 text-[9px] font-mono transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini informational bar */}
      {modelName && (
        <div className="px-5 py-2 border-t border-white/5 flex items-center justify-between text-[9px] text-[#5cc4ff]/50 font-mono tracking-wider">
          <div className="truncate max-w-[200px]">SAVED INTEGRAL: {modelName}</div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <CheckCircle size={10} />
            <span>STABILIZED DIRECT RENDERING</span>
          </div>
        </div>
      )}
    </div>
  );
};

// player-renderer-3d.js - Realistic Player Appearance & Celebration System
// FIFA-quality 3D player rendering

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

class PlayerRenderer3D {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.playerModels = new Map();
    this.animations = new Map();
    this.celebrationLibrary = this.initializeCelebrations();
  }

  // ========== PLAYER APPEARANCE GENERATION ==========
  
  async createPlayerModel(playerData) {
    /**
     * Creates a 3D player model based on real player data
     * Customizes: Height, build, skin tone, hair, facial features
     */
    
    const model = await this.loadBaseModel(playerData.position);
    
    // Customize physical appearance
    await this.applyPhysicalAttributes(model, playerData);
    await this.applyFacialFeatures(model, playerData);
    await this.applyHairStyle(model, playerData);
    await this.applyKitTexture(model, playerData.team);
    
    // Setup animations
    this.setupPlayerAnimations(model, playerData);
    
    // Cache model
    this.playerModels.set(playerData.id, model);
    
    return model;
  }

  async loadBaseModel(position) {
    /**
     * Loads base player model based on position
     * Different body types for GK, DEF, MID, FWD
     */
    
    const modelPaths = {
      'GK': '/models/players/goalkeeper.glb',
      'DEF': '/models/players/defender.glb',
      'MID': '/models/players/midfielder.glb',
      'FWD': '/models/players/forward.glb'
    };
    
    const path = modelPaths[position] || modelPaths['MID'];
    
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => resolve(gltf.scene),
        undefined,
        reject
      );
    });
  }

  async applyPhysicalAttributes(model, player) {
    /**
     * Applies height, build, and body proportions
     */
    
    // Height scaling
    const heightScale = player.height / 180; // Normalize to 180cm average
    model.scale.y = heightScale;
    
    // Build (slim, average, muscular)
    const build = this.determineBuildType(player);
    const buildScales = {
      slim: { x: 0.9, z: 0.9 },
      average: { x: 1.0, z: 1.0 },
      athletic: { x: 1.05, z: 1.05 },
      muscular: { x: 1.1, z: 1.1 }
    };
    
    const scale = buildScales[build];
    model.scale.x = scale.x;
    model.scale.z = scale.z;
    
    // Adjust muscle definition (shader-based)
    await this.adjustMuscleTone(model, player.stats.physical);
  }

  async applyFacialFeatures(model, player) {
    /**
     * Applies facial features based on player data or photo
     * Options:
     * 1. Use AI-generated face from photo
     * 2. Use generic face with customization
     * 3. Use licensed face scan (EA Sports style)
     */
    
    const head = model.getObjectByName('Head');
    if (!head) return;
    
    // Skin tone
    const skinTone = this.getSkinTone(player);
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: skinTone,
      roughness: 0.8,
      metalness: 0.1,
      map: await this.loadSkinTexture(skinTone)
    });
    
    head.traverse((child) => {
      if (child.isMesh && child.name.includes('skin')) {
        child.material = skinMaterial;
      }
    });
    
    // If we have a player photo, generate face texture
    if (player.appearance?.photoUrl) {
      const faceTexture = await this.generateFaceTexture(player.appearance.photoUrl);
      const faceMesh = head.getObjectByName('Face');
      if (faceMesh) {
        faceMesh.material.map = faceTexture;
      }
    }
  }

  async applyHairStyle(model, player) {
    /**
     * Applies player's hairstyle and color
     * Supports: Short, medium, long, bald, afro, dreads, etc.
     */
    
    const hair = model.getObjectByName('Hair');
    if (!hair) return;
    
    // Remove default hair
    hair.visible = false;
    
    // Load player's specific hairstyle
    const hairData = player.appearance?.hairStyle || 'short';
    const hairColor = player.appearance?.hairColor || '#000000';
    
    const hairModel = await this.loadHairModel(hairData);
    hairModel.material = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.9,
      metalness: 0.0
    });
    
    // Position hair on head
    const head = model.getObjectByName('Head');
    head.add(hairModel);
    
    // Facial hair if applicable
    if (player.appearance?.facialHair) {
      const beard = await this.loadFacialHair(player.appearance.facialHair);
      head.add(beard);
    }
  }

  async applyKitTexture(model, teamData) {
    /**
     * Applies team kit (jersey, shorts, socks) with real colors and patterns
     */
    
    const jersey = model.getObjectByName('Jersey');
    const shorts = model.getObjectByName('Shorts');
    const socks = model.getObjectByName('Socks');
    
    // Create kit materials
    const kitMaterial = await this.createKitMaterial(teamData.kits.home);
    
    if (jersey) {
      jersey.material = kitMaterial.jersey;
      // Add team badge
      await this.addTeamBadge(jersey, teamData.crest);
      // Add sponsor logos (if licensed)
      await this.addSponsors(jersey, teamData.sponsors);
    }
    
    if (shorts) shorts.material = kitMaterial.shorts;
    if (socks) socks.material = kitMaterial.socks;
  }

  async createKitMaterial(kitData) {
    /**
     * Creates realistic kit materials with:
     * - Team colors
     * - Patterns (stripes, hoops, solid, etc.)
     * - Fabric texture
     * - Sponsor logos
     */
    
    // Base fabric texture
    const fabricTexture = await this.loadTexture('/textures/fabric.jpg');
    fabricTexture.wrapS = THREE.RepeatWrapping;
    fabricTexture.wrapT = THREE.RepeatWrapping;
    fabricTexture.repeat.set(4, 4);
    
    // Create pattern based on kit design
    const patternTexture = await this.generateKitPattern(kitData);
    
    return {
      jersey: new THREE.MeshStandardMaterial({
        color: kitData.jersey,
        map: patternTexture,
        normalMap: fabricTexture,
        roughness: 0.7,
        metalness: 0.0
      }),
      
      shorts: new THREE.MeshStandardMaterial({
        color: kitData.shorts,
        map: fabricTexture,
        roughness: 0.7,
        metalness: 0.0
      }),
      
      socks: new THREE.MeshStandardMaterial({
        color: kitData.socks,
        map: fabricTexture,
        roughness: 0.8,
        metalness: 0.0
      })
    };
  }

  async generateKitPattern(kitData) {
    /**
     * Generates kit patterns:
     * - Solid
     * - Vertical stripes
     * - Horizontal hoops
     * - Diagonal
     * - Checkered
     * - Gradient
     */
    
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    switch (kitData.pattern) {
      case 'stripes':
        this.drawStripes(ctx, kitData.jersey, kitData.secondary, 'vertical');
        break;
      
      case 'hoops':
        this.drawStripes(ctx, kitData.jersey, kitData.secondary, 'horizontal');
        break;
      
      case 'solid':
        ctx.fillStyle = kitData.jersey;
        ctx.fillRect(0, 0, 512, 512);
        break;
      
      case 'gradient':
        const gradient = ctx.createLinearGradient(0, 0, 0, 512);
        gradient.addColorStop(0, kitData.jersey);
        gradient.addColorStop(1, kitData.secondary);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        break;
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  // ========== CELEBRATION SYSTEM ==========
  
  initializeCelebrations() {
    /**
     * Library of player celebrations with animations
     * Each celebration has:
     * - Animation sequence
     * - Duration
     * - Camera angles
     * - Sound effects
     */
    
    return {
      // Cristiano Ronaldo - Siu
      siu: {
        name: 'Siu',
        duration: 3000,
        animation: [
          { time: 0, action: 'run_forward', duration: 500 },
          { time: 500, action: 'jump', duration: 300 },
          { time: 800, action: 'spin_180', duration: 200 },
          { time: 1000, action: 'arms_down_pose', duration: 1500 },
          { time: 1000, action: 'shout', sound: 'siu.mp3' }
        ],
        camera: 'close_up_front',
        particles: ['energy_burst'],
        iconic: true
      },
      
      // Messi - Point to Sky
      point_to_sky: {
        name: 'Point to Sky',
        duration: 3000,
        animation: [
          { time: 0, action: 'slow_jog', duration: 800 },
          { time: 800, action: 'look_up', duration: 200 },
          { time: 1000, action: 'point_both_fingers_up', duration: 2000 }
        ],
        camera: 'mid_range_side',
        iconic: true
      },
      
      // Mbappé - Arms Crossed
      arms_crossed: {
        name: 'Arms Crossed',
        duration: 2500,
        animation: [
          { time: 0, action: 'walk_confident', duration: 1000 },
          { time: 1000, action: 'stand_still', duration: 200 },
          { time: 1200, action: 'cross_arms', duration: 1300 }
        ],
        camera: 'full_body_front',
        iconic: true
      },
      
      // Haaland - Meditation
      meditation: {
        name: 'Meditation',
        duration: 4000,
        animation: [
          { time: 0, action: 'run_to_spot', duration: 800 },
          { time: 800, action: 'sit_down', duration: 400 },
          { time: 1200, action: 'cross_legs', duration: 300 },
          { time: 1500, action: 'meditation_pose', duration: 2500 }
        ],
        camera: 'aerial_rotating',
        particles: ['zen_aura'],
        iconic: true
      },
      
      // Salah - Prayer
      prayer: {
        name: 'Prayer',
        duration: 3500,
        animation: [
          { time: 0, action: 'slide_on_knees', duration: 800 },
          { time: 800, action: 'prayer_position', duration: 1500 },
          { time: 2300, action: 'bow_forward', duration: 1200 }
        ],
        camera: 'side_respectful',
        iconic: true
      },
      
      // Viktor Gyökeres - Mask
      mask: {
        name: 'Mask',
        duration: 2800,
        animation: [
          { time: 0, action: 'run_to_camera', duration: 600 },
          { time: 600, action: 'stop_abrupt', duration: 200 },
          { time: 800, action: 'hands_to_face_mask', duration: 2000 }
        ],
        camera: 'close_up_front',
        particles: ['mask_effect'],
        iconic: true,
        custom: true
      },
      
      // Neymar - Dance
      dance: {
        name: 'Samba Dance',
        duration: 4000,
        animation: [
          { time: 0, action: 'samba_step_1', duration: 500 },
          { time: 500, action: 'samba_step_2', duration: 500 },
          { time: 1000, action: 'samba_spin', duration: 500 },
          { time: 1500, action: 'samba_step_3', duration: 500 },
          { time: 2000, action: 'samba_finish', duration: 2000 }
        ],
        camera: 'full_body_tracking',
        iconic: true
      },
      
      // Generic celebrations
      knee_slide: {
        name: 'Knee Slide',
        duration: 2000,
        animation: [
          { time: 0, action: 'run_fast', duration: 500 },
          { time: 500, action: 'slide_on_knees', duration: 1000 },
          { time: 1500, action: 'arms_out', duration: 500 }
        ],
        camera: 'side_tracking'
      },
      
      corner_flag: {
        name: 'Corner Flag',
        duration: 3000,
        animation: [
          { time: 0, action: 'run_to_corner', duration: 1000 },
          { time: 1000, action: 'grab_flag', duration: 500 },
          { time: 1500, action: 'wave_flag', duration: 1500 }
        ],
        camera: 'corner_angle'
      },
      
      team_huddle: {
        name: 'Team Huddle',
        duration: 4000,
        animation: [
          { time: 0, action: 'call_teammates', duration: 500 },
          { time: 500, action: 'wait_for_team', duration: 1000 },
          { time: 1500, action: 'group_celebration', duration: 2500 }
        ],
        camera: 'wide_angle',
        includesTeam: true
      }
    };
  }

  async playCelebration(player, celebrationType) {
    /**
     * Executes celebration animation for a player
     * Handles camera, particles, sounds, and teammate reactions
     */
    
    const celebration = this.celebrationLibrary[celebrationType];
    if (!celebration) {
      celebrationType = 'knee_slide'; // Default
    }
    
    const model = this.playerModels.get(player.id);
    if (!model) return;
    
    // Setup celebration camera
    this.setupCelebrationCamera(celebration.camera, model);
    
    // Play animation sequence
    for (const step of celebration.animation) {
      await this.delay(step.time);
      await this.playAnimationStep(model, step);
      
      // Play sound effects
      if (step.sound) {
        this.playSound(step.sound);
      }
    }
    
    // Add particle effects
    if (celebration.particles) {
      this.addCelebrationParticles(model, celebration.particles);
    }
    
    // Include teammates if needed
    if (celebration.includesTeam) {
      await this.animateTeammates(player.team, model.position);
    }
    
    // Return camera to game view
    await this.delay(celebration.duration);
    this.returnToGameCamera();
  }

  async playAnimationStep(model, step) {
    /**
     * Plays individual animation step
     * Uses Three.js animation mixer
     */
    
    const action = this.animations.get(step.action);
    if (!action) return;
    
    const mixer = new THREE.AnimationMixer(model);
    const clip = THREE.AnimationClip.findByName(model.animations, step.action);
    
    if (clip) {
      const actionClip = mixer.clipAction(clip);
      actionClip.reset();
      actionClip.setLoop(THREE.LoopOnce);
      actionClip.clampWhenFinished = true;
      actionClip.play();
      
      // Update mixer for duration
      const startTime = Date.now();
      const animate = () => {
        const delta = (Date.now() - startTime) / 1000;
        mixer.update(delta);
        
        if (delta < step.duration / 1000) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }
  }

  setupCelebrationCamera(cameraType, targetModel) {
    /**
     * Positions camera for celebration
     * Different angles for different celebrations
     */
    
    const camera = this.scene.camera;
    const position = targetModel.position;
    
    const cameraPositions = {
      'close_up_front': {
        position: new THREE.Vector3(position.x, position.y + 1.7, position.z + 2),
        lookAt: new THREE.Vector3(position.x, position.y + 1.5, position.z)
      },
      
      'full_body_front': {
        position: new THREE.Vector3(position.x, position.y + 1, position.z + 4),
        lookAt: new THREE.Vector3(position.x, position.y + 0.9, position.z)
      },
      
      'side_tracking': {
        position: new THREE.Vector3(position.x + 3, position.y + 1, position.z),
        lookAt: position,
        tracking: true
      },
      
      'aerial_rotating': {
        position: new THREE.Vector3(position.x, position.y + 5, position.z + 3),
        lookAt: position,
        rotate: true
      }
    };
    
    const config = cameraPositions[cameraType];
    if (config) {
      camera.position.copy(config.position);
      camera.lookAt(config.lookAt);
      
      // Smooth camera animation
      this.animateCamera(camera, config);
    }
  }

  addCelebrationParticles(model, particleTypes) {
    /**
     * Adds particle effects to celebration
     * - Energy bursts
     * - Confetti
     * - Light rays
     * - Custom effects
     */
    
    particleTypes.forEach(type => {
      const particles = this.createParticleEffect(type);
      particles.position.copy(model.position);
      this.scene.add(particles);
      
      // Animate and remove after duration
      setTimeout(() => {
        this.scene.remove(particles);
      }, 3000);
    });
  }

  // ========== HELPER FUNCTIONS ==========
  
  determineBuildType(player) {
    const bmi = player.weight / ((player.height / 100) ** 2);
    
    if (bmi < 20) return 'slim';
    if (bmi < 24) return 'average';
    if (bmi < 27) return 'athletic';
    return 'muscular';
  }

  getSkinTone(player) {
    // This would ideally use player photo analysis
    // For now, use a simple mapping or default
    const skinTones = {
      1: '#FFDFC4',
      2: '#F0D5BE',
      3: '#EECEB3',
      4: '#E1B899',
      5: '#C68642',
      6: '#8D5524',
      7: '#754422',
      8: '#4A2E1C'
    };
    
    return player.appearance?.skinTone || skinTones[4];
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default PlayerRenderer3D;

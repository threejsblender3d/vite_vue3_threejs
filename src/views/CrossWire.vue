<template>
    <div class="scenes" :style="{transform:`translate3d(0,${-index * 100}vh,0)`}">
    <div v-for="item in scenes" class="inner">
      <h1>{{ item.text }}</h1>
    </div>
  </div>
</template>
  <script setup>
  import * as THREE from 'three'
  import gsap from 'gsap'
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  import { ref, reactive, onMounted } from 'vue'
  import * as dat from 'dat.gui'

  import vertex from '../shader/vertex.glsl'
  import fragment from '../shader/fragment.glsl'

  import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
  import { SSRPass } from 'three/examples/jsm/postprocessing/SSRPass'
  import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
  import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'
   import { ReflectorForSSRPass } from 'three/examples/jsm/objects/ReflectorForSSRPass'
  
  //初始化场景
  const scene = new THREE.Scene()
  //初始化相机
  const camera = new THREE.PerspectiveCamera(
    25,
    window.innerWidth / window.innerHeight,
    1,
    100
  )
   camera.position.set(-3.962, 3.014, -10.911)

let frustumSize = 4
let aspect = window.innerWidth / window.innerHeight

// const camera = new THREE.OrthographicCamera( frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, -1000, 1000 )

// camera.position.set(8,12,16)
 // camera.updateProjectionMatrix()
  
  //渲染器
  const renderer = new THREE.WebGLRenderer({
    antialias: false
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)
  
  //设置色调映射
  renderer.outputEncoding = THREE.sRGBEncoding
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.7
  renderer.shadowMap.enabled = true
  renderer.physicallyCorrectLights = true
  //控制器
  const controls = new OrbitControls(camera,renderer.domElement)
  controls.enableDamping = true
  controls.target.set(-0.976, -0.369, 0.365)
  
  //loader
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath("./draco/")
  const gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)
  
  //环境纹理
  let rgbeLoader = new RGBELoader()
  rgbeLoader.load('./textures/sky.hdr', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping
    scene.background = texture
    // scene.environment = texture
  
  })
  
  //加载模型
//   gltfLoader.load("./model/scene.glb", (gltf) => {
//     const model = gltf.scene
//     model.scale.set(0.05, 0.05, 0.05)
//     model.traverse((child) => {
//       if(child.isMesh) {
//         child.castShadow = true
//         child.receiveShadow = true
//       }
//     })
//     scene.add(model)
//   })
  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: {
        time: { value: 0 },
        uMatcap: { value: new THREE.TextureLoader().load('./crosswire/sec1.png') },
        uScan: { value: new THREE.TextureLoader().load('./crosswire/scan.png')  },
        resolution: { value: new THREE.Vector4() }
    },
    vertexShader: vertex,
    fragmentShader: fragment
  })
  const geometry = new THREE.PlaneGeometry(10,10,10,10)

//   const plane = new THREE.Mesh(geometry,material)
//   scene.add(plane)

  let {scene: children} = await gltfLoader.loadAsync('./crosswire/ob1.glb')
  let geo1 = children.children[0].geometry

  let {scene: children1} = await gltfLoader.loadAsync('./crosswire/ob2.glb')
  let geo2 = children.children[0].geometry

  let {scene: children2} = await gltfLoader.loadAsync('./crosswire/ob3.glb')
  let geo3 = children.children[0].geometry
  console.log('geo1',geo1)  
  
  let mat = new THREE.MeshMatcapMaterial({
    matcap: new THREE.TextureLoader().load('./crosswire/sec1.png')
  });
  let rows = 10;
  let count = rows * rows
  let random = new Float32Array(count)
  const instanceMesh =  new THREE.InstancedMesh(geo1, material, count)
  
  //const plane = new THREE.Mesh(geometry,material)
  scene.add(instanceMesh)

  let dummy = new THREE.Object3D()
  let index2 = 0

  for(let i = 0; i < rows; i++ ){
    for(let j = 0; j < rows; j++ ){
        random[index2] = Math.random()
        // let x = (i / rows) * 2 -1
        // let y = (j / rows) * 2 -1

        dummy.position.set(i- rows/2, -10, j-rows/2)
        dummy.updateMatrix()
        instanceMesh.setMatrixAt(index2++, dummy.matrix)

    }
  }
  instanceMesh.instanceMatrix.needsUpdate = true

  instanceMesh.geometry.setAttribute('aRandom', new THREE.InstancedBufferAttribute(random,1))

  //添加环境光
  const ambi = new THREE.AmbientLight(0xeee,1)
 scene.add(ambi)
  

  
  
  let gui  =new dat.GUI()
  //调试
  function debug() {
  
          const cameraConfig = gui.addFolder(`camera config`)
          cameraConfig.open()
  
  
          cameraConfig
          .add(camera.position, `x`).name(`camera x`)
          .min(-100).max(100).step(0.001)
  
          cameraConfig
          .add(camera.position, `y`).name(`camera y`)
          .min(-100).max(100).step(0.001)
  
          cameraConfig
          .add(camera.position, `z`).name(`camera z`)
          .min(-100).max(100).step(0.001)
  
       
  
          cameraConfig
          .add(controls.target, `x`).name(`target point x`)
          .min(-20).max(20).step(0.001)
  
          cameraConfig
          .add(controls.target, `y`).name(`target point y`)
          .min(-20).max(20).step(0.001)
  
          cameraConfig
          .add(controls.target, `z`).name(`target point z`)
          .min(-20).max(20).step(0.001)
  }
  debug()
  
  window.addEventListener('resize',()=> {
    const width = window.innerWidth
    const height = window.innerHeight
    renderer.setSize(width,height)

    composer.setSize(width,height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  })  

  //postprocess
const composer = new EffectComposer(renderer)
const ssrPass = new SSRPass({
    renderer: renderer,
    scene: scene,
    camera: camera,
    width: window.innerWidth,
    height: window.innerHeight,
    groundReflector: null,
    selects: null
})
composer.addPass(ssrPass)
  
  //渲染
  function render() {
    requestAnimationFrame(render)
    renderer.render(scene, camera)
    controls.update()

    composer.render()

    material.uniforms.time.value += 0.01
  
    gui && gui.updateDisplay()
  }
  render()
  
  //定义相机移动位置
  let timeLine1 = gsap.timeline()
  let timeLine2 = gsap.timeline()
  function translateCamera(position, target) {
    timeLine1.to(camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration:1,
      ease: "power2.inOut"
    })
    timeLine2.to(controls.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration:1,
      ease: "power2.inOut"
    })
  }
  
  //文字
  let scenes = reactive([
    {
      text: "无休止的三体运动",
      callback: ()=> {
        translateCamera(
          new THREE.Vector3(-3.962, 3.014, -10.911),
          new THREE.Vector3(-0.976, -0.369, 0.365)
        )
      }
    },
    {
      text: "这是第二段",
      callback: ()=> {
        translateCamera(
          new THREE.Vector3(10.683,2.453,-2.144),
          new THREE.Vector3(-0.974,0.429,0.598)
        )
      }
    },
    {
      text: "元宇宙 ",
      callback: ()=> {
        translateCamera(
          new THREE.Vector3(9.32,4.303,4.736),
          new THREE.Vector3(-1.203,0.269,0.209)
        )
      }
    },
    {
      text: "文字4 ",
      callback: ()=> {
        translateCamera(
          new THREE.Vector3(-12.387,0.978,4.318),
          new THREE.Vector3(-0.976,-0.369,0.365)
        )
       // makeHeart()
      }
    },
  ])
  
  let index = ref(0)
  let isAnimate = false
  //滚轮事件
  window.addEventListener("wheel", (e)=>{
    if(isAnimate)  return
    isAnimate = true
    if(e.deltaY > 0) {
      index.value ++;
      if(index.value > scenes.length - 1) {
        index.value = 0
        //restoreHeart()
      }
    }
     scenes[index.value].callback()
    setTimeout(() => {
      isAnimate = false
    },1000)
  },false)
  
  
  
  
  </script>
  
  
  
  <style scoped>
  .scenes {
    position: fixed;
    left:0;
    top:0;
    z-index: 100002;
    pointer-events: none;
    transition: all 1s
  }
  .scenes .inner {
    width: 100vw;
    height: 100vh;
  }
  .scenes h1 {
    padding: 100px 50px;
    font-size: 50px;
    color: #fff
  }
  .start_play {
    position: fixed;
    right:20px;
    bottom:20px;
    z-index: 100002;
    color: #fff;
    font-size: 30px;
  }
  </style>
  
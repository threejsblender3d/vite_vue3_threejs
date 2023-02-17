<template>
    <div class="scenes" :style="{transform:`translate3d(0,${-index * 100}vh,0)`}">
      <div v-for="item in scenes" class="inner">
        <h1>{{ item.text }}</h1>
      </div>
    </div>
  
    <div class="start_play" @click="playAnim">
      播放星星动画
    </div>
  </template>
  <script setup>
  import * as THREE from 'three'
  import gsap from 'gsap'
  import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
  import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
  import { Water } from 'three/examples/jsm/objects/Water2'
  import { ref, reactive, onMounted } from 'vue'
  import * as dat from 'dat.gui'
  
  //初始化场景
  const scene = new THREE.Scene()
  //初始化相机
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    10000
  )
  camera.position.set(-3.083, 6.214, -10.048)
  camera.updateProjectionMatrix()
  
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
  controls.target.set(-0.396, 2.409, 1.168)
  
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

  const ktx2Loader = new KTX2Loader()
  ktx2Loader.setTranscoderPath('./decoder/')
  ktx2Loader.detectSupport(renderer)
  gltfLoader.setKTX2Loader(ktx2Loader)

  let mixer
  //加载模型
  gltfLoader.load("./train/train.glb", (gltf) => {
    const model = gltf.scene
    gltf.scene.position.y = 1
    model.scale.set(0.5, 0.5, 0.5)
    model.traverse((child) => {
      if(child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    mixer = new THREE.AnimationMixer(gltf.scene)
    mixer.clipAction(gltf.animations[0]).play()
    scene.add(model)
  })
  
  
  
  //创建水面
  const waterGeometry = new THREE.CircleGeometry(300, 32) 
  const water = new Water(waterGeometry, {
    textureWidth: 2048,
    textureHeight: 2048,
    color: 0xeeeeff,
    flowDirection: new THREE.Vector2(1,1),
    scale: 100,
    // waterNormals: new THREE.TextureLoader().load('./textures/water/Water_1_M_Normal.jpg',(texture) =>{
    //   texture.wrapS = texture.wrapT = THREE.RepeatWrapping}),
    alpha: 1.0
  })
  water.rotation.x = - Math.PI / 2
  // water.position.y = -0.4
  scene.add(water)
  
  //添加平行光
  const light = new THREE.DirectionalLight(0xffffff, 0.1)
  light.position.set(0, 50, 0)
  scene.add(light)
  
  //添加环境光
  const ambi = new THREE.AmbientLight(0xffffff,1)
  scene.add(ambi)
  
  //添加点光源
  const pointLight = new THREE.PointLight(0xffffff, 10)
  pointLight.position.set(0, 3, 0)
  pointLight.castShadow = true
  //scene.add(pointLight)
  
  //创建点光源的球
  const pointLightGroup = new THREE.Group()
  let pointLightArr = []
  let radius = 3
  for(let i = 0; i < 3; i++) {
  
    const sphereGeometry = new THREE.SphereGeometry(0.2, 32, 32)
    const sphereMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 10
    })
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
    pointLightArr.push(sphere)
    sphere.position.set(
      radius * Math.cos((i * 2 * Math.PI) / 3),
      Math.cos((i * 2 * Math.PI) / 3),
      radius * Math.sin((i * 2 * Math.PI) / 3)
    )
  
    let pointLight = new THREE.PointLight(0xffffff,20)
    // pointLight.position.set(
    //   Math.random() * 10 - 5,
    //   Math.random() * 10 + 2,
    //   Math.random() * 10 - 5,
    // )
    sphere.add(pointLight)
    // console.log(pointLight.position)
    // pointLight.castShadow = true
    // pointLightArr.push(pointLight)
    pointLightGroup.position.set(3, 3, -2)
    pointLightGroup.add(sphere)
  
  }
  scene.add(pointLightGroup)
  
  //三个灯球的动画
  let options = {
    angle: 0
  }
  gsap.to(options, {
    angle: Math.PI * 2,
    duration: 10,
    repeat: -1,
    ease: "linear",
    onUpdate:() => {
      pointLightGroup.rotation.y = options.angle
      pointLightArr.forEach((item, index) => {
        item.position.set(
          radius * Math.cos((index * 2 * Math.PI) / 3 ),
          Math.cos((index * 2 * Math.PI) / 3 +options.angle * 5),
          radius * Math.sin((index * 2 * Math.PI) / 3 )
        )
      })
    }
  })
  
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
  
  
  window.addEventListener('resize',()=> {
    const width = window.innerWidth
    const height = window.innerHeight
    renderer.setSize(width,height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  })  

  const clock = new THREE.Clock()
  
  //渲染
  function render() {
    requestAnimationFrame(render)
    renderer.render(scene, camera)
    controls.update()

    if(mixer){
        mixer.update(clock.getDelta())
    }
  
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
          new THREE.Vector3(-3.083, 6.214, -10.048),
          new THREE.Vector3(-0.396, 2.409, 1.168)
        )
      }
    },
    {
      text: "这是第二段",
      callback: ()=> {
        translateCamera(
          new THREE.Vector3(-11.456, 7.047, 3.07),
          new THREE.Vector3(-0.396, 2.409, 1.168)
        )
      }
    },
    {
      text: "元宇宙 ",
      callback: ()=> {
        translateCamera(
          new THREE.Vector3(-20.355, 3.304, 4.947),
          new THREE.Vector3(5, 2, 0)
        )
      }
    },
    {
      text: "文字4 ",
      callback: ()=> {
        translateCamera(
          new THREE.Vector3(-25.482, 10.786, -49.272),
          new THREE.Vector3(-6.148, 4.102, -33.44)
        )
        makeHeart()
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
        restoreHeart()
      }
    }
    scenes[index.value].callback()
    setTimeout(() => {
      isAnimate = false
    },1000)
  },false)
  
  //实例化创建满天的星星
  let startsInstance = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.1, 32, 32),
    new THREE.MeshStandardMaterial({
      color: 0xd88232,
      emissive: 0xd88232,
      emissiveIntensity: 10,
    }),
    // new THREE.MeshStandardMaterial({
    //   color: 0xffffff,
    //   emissive: 0xf8d96a,
    //   emissiveIntensity: 10,
    // }),
    100
  )
  //随机分布到天上
  let startArr = []
  let endArr = []
  for(let i = 0; i< 100; i++) {
    let x = Math.random() * 100 - 50
    let y = Math.random() * 100 - 50
    let z = Math.random() * 100 - 50
    startArr.push(new THREE.Vector3(x, y, z))
  
    let matrix = new THREE.Matrix4()
    matrix.setPosition(x,y,z)
    startsInstance.setMatrixAt(i,matrix)
  }
  scene.add(startsInstance)
  
  // 移动星星变爱心
  let heartShape = new THREE.Shape()
  //heartShape.moveTo(0,0)
  //heartShape.bezierCurveTo(-25,25,25,25,0,0)
  heartShape.moveTo(25, 25)
  heartShape.bezierCurveTo(25,25,20,0,0,0)
  heartShape.bezierCurveTo(-30,0,-30,35,-30,35)
  heartShape.bezierCurveTo(-30,55,-10,77,25,95)
  heartShape.bezierCurveTo(60,77,80,55,80,35)
  heartShape.bezierCurveTo(80,35,80,0,50,0)
  heartShape.bezierCurveTo(35,0,25,25,25,25)
  
  let rabbitShape = new THREE.Shape()
  // 定义兔子的身体
  // rabbitShape.moveTo(0, 40);
  // rabbitShape.bezierCurveTo(15, 80, 55, 80, 70, 40);
  // rabbitShape.bezierCurveTo(55, 0, 15, 0, 0, 40);
  
  // 定义兔子的头部
  rabbitShape.moveTo(0, 0);
  rabbitShape.bezierCurveTo(0, 20, 30, 35, 50, 30);
  rabbitShape.bezierCurveTo(80, 25, 80, -10, 50, -30);
  rabbitShape.bezierCurveTo(20, -50, 0, -30, 0, -10);
  var starShape = new THREE.Shape();
  
  // 定义五个顶点，绕着一个圆形轨迹
  // var x = 0, y = 0;
  // var outerRadius = 20, innerRadius = 10;
  // for (var i = 0; i < 5; i++) {
  //     var angle = i * Math.PI * 2 / 5;
  //     var outerX = x + Math.cos(angle) * outerRadius;
  //     var outerY = y + Math.sin(angle) * outerRadius;
  //     var innerAngle = angle + Math.PI / 5;
  //     var innerX = x + Math.cos(innerAngle) * innerRadius;
  //     var innerY = y + Math.sin(innerAngle) * innerRadius;
  //     if (i === 0) {
  //         starShape.moveTo(outerX, outerY);
  //     } else {
  //         starShape.lineTo(outerX, outerY);
  //     }
  //     starShape.lineTo(innerX, innerY);
  // }
  // var shape = new THREE.Shape();
  
  // var x = 0;
  // var y = Math.sin(x);
  // shape.moveTo(x, y);
  
  // for (var i = 1; i <= 100; i++) {
  //   var x = i / 10;
  //   var y = Math.sin(x);
  //   shape.quadraticCurveTo((i - 0.5) / 10, y, i / 10, y);
  // }
  
  // 创建贝塞尔曲线
  // const curve = new THREE.CubicBezierCurve3(
  //   new THREE.Vector3(-5, -5, 0),
  //   new THREE.Vector3(0, 10, 0),
  //   new THREE.Vector3(5, 5, 0),
  //   new THREE.Vector3(0, 0, 0)
  // );
  
  
  // gltfLoader.load("./model/rabbit.glb", (gltf) => {
  //   const model = gltf.scene
  //   console.log(model.children[0].geometry)
  //   const geometry = model.children[0].geometry
  //   // model.scale.set(0.05, 0.05, 0.05)
  //   // model.position.y = 2
  //   let center = new THREE.Vector3(0, 4, 10)
  //   for(let i =0;i < geometry.attributes.position.count; i++) {
  //     let point = geometry.getPoint(i / geometry.attributes.position.count)
  //     // endArr.push(new THREE.Vector3(point.x,point.y,point.z))
  //     endArr.push(
  //       new THREE.Vector3(
  //         point.x * 0.1 + center.x,
  //         point.y * 0.1 + center.y,
  //         center.z+ center.z
  //       )
  //     )
  //   }
  //   //scene.add(model)
  // })
  
  //根据爱心路径获取点
  let center = new THREE.Vector3(0, 4, 10)
  for(let i =0;i < 100; i++) {
    let point = heartShape.getPoint(i / 100)
    // endArr.push(new THREE.Vector3(point.x,point.y,point.z))
    endArr.push(
      new THREE.Vector3(
        point.x * 0.1 + center.x,
        point.y * 0.1 + center.y,
        center.z+ center.z
      )
    )
  }
  
  let isani = ref(true)
  
  //创建爱心动画
  function makeHeart() {
    let params = {
      time: 0
    }
    gsap.to(params,{
      time:1,
      duration:1,
      onUpdate:() => {
        for(let i=0; i< 100;i++){
          let x= startArr[i].x + (endArr[i].x - startArr[i].x) * params.time
          let y= startArr[i].y + (endArr[i].y - startArr[i].y) * params.time
          let z= startArr[i].z + (endArr[i].z - startArr[i].z) * params.time
          let matrix = new THREE.Matrix4()
            matrix.setPosition(x,y,z)
            startsInstance.setMatrixAt(i,matrix)
        }
        startsInstance.instanceMatrix.needsUpdate = true
      }
    })
  
    isani.value = false
  }
  
  function restoreHeart() {
    let params = {
      time: 0
    }
    gsap.to(params,{
      time:1,
      duration:1,
      onUpdate:() => {
        for(let i=0; i< 100;i++){
          let x= endArr[i].x + (startArr[i].x - endArr[i].x) * params.time
          let y= endArr[i].y + (startArr[i].y - endArr[i].y) * params.time
          let z= endArr[i].z + (startArr[i].z - endArr[i].z) * params.time
          let matrix = new THREE.Matrix4()
            matrix.setPosition(x,y,z)
            startsInstance.setMatrixAt(i,matrix)
        }
        startsInstance.instanceMatrix.needsUpdate = true
      }
    })
  
    isani.value = true
  }
  
  function playAnim() {
    if(isani.value) {
      makeHeart()
    }else {
      restoreHeart()
    }
  }
  
  onMounted(()=> {
    debug()
  })
  
  
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
  
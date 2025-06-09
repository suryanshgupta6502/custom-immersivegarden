import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { lerp } from 'three/src/math/MathUtils';



const canvas = document.querySelector("#canvas")
const sizes = {
    width: canvas.clientWidth,
    height: canvas.clientHeight
}
const scene = new three.Scene();
const camera = new three.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.z = 1;















const light = new three.AmbientLight("white", 1)
scene.add(light)

const directionalLight = new three.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 10, 10).normalize();
scene.add(directionalLight);


const normalMap = new three.TextureLoader().load('rock_wall_13_nor_gl_1k.png');

const gltfloader = new GLTFLoader()
// .load("reliefs_high_compressed.glb")


const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./draco/');
gltfloader.setDRACOLoader(dracoLoader)




const mouse = new three.Vector2();

// Update mouse on move
window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});



const shadermaterial = new three.ShaderMaterial({

    uniforms: {
        u_mouse: { value: new three.Vector3() },
        u_radius: { value: 2.0 }
    },
    vertexShader: `
    varying vec3 vPosition;
    varying vec2 vuv;

    void main() {
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    
      vuv=uv;
    }
  `,
    fragmentShader: `
    uniform vec3 u_mouse;
    uniform float u_radius;
    varying vec3 vPosition;
    varying vec2 vuv;

    void main() {

    //   float dist = distance(vPosition.xy, u_mouse.xy);  // Only XY distance

    //   float mask = smoothstep(u_radius, u_radius -2.0, dist);
    //   gl_FragColor = vec4(vec3(1.0), 1.0- mask ); // transparent outside
    


    // float dist = distance(vPosition.xy, u_mouse.xy);
    // // 1.0 = full white, 0.0 = transparent
    // float mask = smoothstep(u_radius - 1.5, u_radius, dist);

    // // White background
    // vec3 color = vec3(1.0);
    // gl_FragColor = vec4(color, mask);





//     float dist = distance(vPosition.xy, u_mouse.xy);

//   // Smooth transition over edge
//   float edge = 0.2;
//   float mask = smoothstep(u_radius - edge, u_radius, dist); // 0 inside → 1 outside

//   // Inside: red, Outside: white
//   vec3 innerColor = vec3(0.0);  // red
//   vec3 outerColor = vec3(1.0);           // white
//   vec3 finalColor = mix(innerColor, outerColor, mask);

//   gl_FragColor = vec4(finalColor, 1.0);  // fully opaque

    

//          float dist = distance(vPosition.xy, u_mouse.xy);

//   // Create a smooth alpha transition (anti-aliasing)
//   float edge =2.0;
//   float alpha = smoothstep(u_radius - edge, u_radius, dist); // 0 inside → 1 outside

//   // Color: always white
//   vec3 color = vec3(1.0);

//   gl_FragColor = vec4(color, alpha);  // alpha controls transparency




float dist = distance(vPosition.xy, u_mouse.xy);

  // Inside: 0, Edge: 0→1, Outside: 1
  float edge = 5.0;
  float mask = smoothstep(-1.0, 3.0, dist);

  // Final color
  vec3 innerColor = vec3(0.0);    // original stays black for now
  vec3 maskColor = vec3(1.0);     // white outside

  vec3 finalColor = mix(innerColor, maskColor, mask); // mask blends in only outside

  gl_FragColor = vec4(finalColor, 1.0);



    
    }
  `,
    transparent: true
});








const raycaster = new three.Raycaster();

let model
let originalZ
gltfloader.load("reliefs_high_compressed.glb", (e) => {
    // console.log(e.scene.children[0].geometry.attributes);

    const attributes = e.scene.children[0].geometry.attributes
    console.log(attributes.position, attributes.position.count);

    // Store original Z values
    originalZ = [];
    for (let i = 0; i < attributes.position.count; i++) {
        originalZ.push(attributes.position.getZ(i));
    }

    // console.log(originalZ);


    for (let i = 0; i < attributes.position.count; i++) {

        //     if (i < 15000) {
        //         attributes.position.setZ(i, 0);
        //     }
        attributes.position.setZ(i, 0);
        // console.log(attributes.position.getZ(i));
    }

    // attributes.position.needsUpdate = true;
    // e.scene.children[0].geometry.computeVertexNormals();

    // console.log(e.scene.children[0]);

    // e.scene.children[0].material.wireframe = true
    model = e.scene.children[0]
    // model.material = shadermaterial
    scene.add(model)


    // const intersects = raycaster.intersectObject(model);
    // const intersect = intersects[0];
    // console.log(intersect);



})



// const material = new three.MeshNormalMaterial()

const plane = new three.Mesh(
    new three.PlaneGeometry(2, 2),
    // new three.MeshNormalMaterial()
    new three.ShaderMaterial({
        uniforms: {
            u_mouse: { value: new three.Vector2() },
            u_radius: { value: 0.2 },
            resolution: { value: new three.Vector2(window.innerWidth, window.innerHeight) },
            u_time: { value: 0.0 }
        },
        vertexShader: `
      void main() {
        gl_Position = vec4(position, 1.0); // Fullscreen quad
      }
    `,
        fragmentShader: `
            uniform vec2 u_mouse;
        uniform float u_radius;
        uniform vec2 resolution;
        uniform float u_time;

        float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
        vec2 uv = gl_FragCoord.xy / resolution;
        float dist = distance(uv, u_mouse);

        // Add noise to the edge
        float n = noise(uv * 10.0 + u_time * 0.5); // animate
        float distortedRadius = u_radius + (n - 0.5) * 0.05;

        float edge = 0.02;
        float alpha = smoothstep(distortedRadius - edge, distortedRadius, dist);

        vec3 color = vec3(1.0); // white mask
        gl_FragColor = vec4(color, alpha);
        }

    `,
        transparent: true
    })
);

plane.position.z = 2
// scene.add(plane);


window.addEventListener('mousemove', (e) => {
    plane.material.uniforms.u_mouse.value.set(
        e.clientX / window.innerWidth,
        1.0 - e.clientY / window.innerHeight // flip Y
    );
});


const overlay_onmesh = new three.Mesh(new three.PlaneGeometry(), new three.MeshNormalMaterial())
overlay_onmesh.position.z = .1
overlay_onmesh.scale.set(20, 20, 20)
overlay_onmesh.material.transparent = true
overlay_onmesh.material.opacity = .9

// scene.add(overlay_onmesh)





new OrbitControls(camera, canvas)
const renderer = new three.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);



function animate() {
    renderer.render(scene, camera);

    plane.material.uniforms.u_time.value = performance.now() / 1000;


    raycaster.setFromCamera(mouse, camera)
    // console.log(originalZ);

    // if (originalZ) {
    // for (let index = 0; index < originalZ.length; index++) {
    //     model.geometry.attributes.position.setZ(index, 0)
    //     // const element = originalZ[index];

    // }
    // }


    if (model) {

        const intersects = raycaster.intersectObject(model);
        // console.log(intersects);
        // console.log(intersects[0]);

        // if (intersects[0]) {


        //     const index1 = intersects[0].face.a
        //     const index2 = intersects[0].face.b
        //     const index3 = intersects[0].face.c

        //     model.geometry.attributes.position.setZ(index1, 10)
        //     model.geometry.attributes.position.setZ(index2, 10)
        //     model.geometry.attributes.position.setZ(index3, 10)
        //     // model.geometry.position
        //     console.log(index1);



        // }


        // model.geometry.attributes.position.needsUpdate = true;



        if (intersects[0]) {

            // shadermaterial.uniforms.u_mouse.value.copy(intersects[0].point);
            shadermaterial.uniforms.u_mouse.value.lerp(intersects[0].point, 0.1);

            const hitPoint = intersects[0].point;
            const radius = 2; // 👈 Increase this to grow the effect area

            const posAttr = model.geometry.attributes.position;
            const vertex = new three.Vector3();
            const worldVertex = new three.Vector3();

            // console.log(posAttr);


            for (let i = 0; i < posAttr.count; i++) {
                vertex.fromBufferAttribute(posAttr, i);
                // console.log( vertex.fromBufferAttribute(posAttr, i))

                worldVertex.copy(vertex).applyMatrix4(model.matrixWorld);
                // console.log(worldVertex, vertex);


                const dist = worldVertex.distanceTo(hitPoint);

                if (dist < radius) {
                    const intensity = Math.pow(1 - dist / radius, 2);
                    // const newZ = lerp(0, originalZ[i], 1) + intensity * .5;
                    const newZ = originalZ[i] * intensity;
                    posAttr.setZ(i, newZ);


                    // const intensity = Math.max(0, 1 - dist / radius);
                    // const newZ = originalZ[i] + intensity * .5;
                    // posAttr.setZ(i, originalZ[i] + 1); // Push up only within the radius
                    // posAttr.setZ(i, originalZ[i] + 1);
                }
                else {
                    const currentZ = posAttr.getZ(i);
                    const targetZ = 0
                    const restoredZ = three.MathUtils.lerp(currentZ, targetZ, .5); // slow restore
                    posAttr.setZ(i, restoredZ);
                }
            }

            posAttr.needsUpdate = true;
        }






    }





    window.requestAnimationFrame(animate)
}
animate()


// setTimeout(() => {
//     let intensity = 0.0;  // Start from no bumpiness

//     // Use setInterval to increase bump intensity smoothly over time
//     const interval = setInterval(() => {
//         intensity += 0.05;  // Increase bump intensity gradually
//         material.uniforms.bumpIntensity.value = intensity;

//         // Stop when the bump intensity reaches a certain level
//         if (intensity >= 2.0) {
//             clearInterval(interval);  // Stop increasing once it reaches 2.0
//         }
//     }, 50);  // Increase every 50ms

//     console.log('Normal map effect gradually applied after 2 seconds');
// }, 2000); 
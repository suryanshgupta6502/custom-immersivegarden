import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';



const canvas = document.querySelector("#canvas")
const sizes = {
    width: canvas.clientWidth,
    height: canvas.clientHeight
}
const scene = new three.Scene();
const camera = new three.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000);
camera.position.z = 1;

















// const uniforms = {
//     uTime: { value: 0 },
//     uNormalMap: { value: yourNormalTexture }, // must be a loaded normal map
// };

// const material = new three.ShaderMaterial({
//     uniforms,
//     vertexShader: `
//     varying vec2 vUv;
//     void main() {
//       vUv = uv;
//       gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//     }
//   `,
//     fragmentShader: `
//     uniform float uTime;
//     uniform sampler2D uNormalMap;
//     varying vec2 vUv;

//     void main() {
//       vec3 normalColor = texture2D(uNormalMap, vUv).rgb;
//       float t = smoothstep(10.0, 11.0, uTime); // fades in between 10–11 sec
//       vec3 displayColor = mix(vec3(0.0, 0.0, 1.0), normalColor, t);
//       gl_FragColor = vec4(displayColor, 1.0);
//     }
//   `
// });




const light = new three.AmbientLight("white", 1)
scene.add(light)

const directionalLight = new three.DirectionalLight(0xffffff, 2);
directionalLight.position.set(10, 10, 10).normalize();
scene.add(directionalLight);


const normalMap = new three.TextureLoader().load('rock_wall_13_nor_gl_1k.png');
// console.log(normalMap);

// const normalMap = new three.TextureLoader().load('rock_wall_13_nor_gl_1k.png', () => {
//     console.log('Normal map loaded successfully');
// }, undefined, (error) => {
//     console.error('Error loading normal map:', error);
// });

// Create a material and apply the normal map
// const material1 = new three.MeshStandardMaterial({
//     color: 0x888888,  // Base color of the lane (adjust as needed)
//     // normalMap: normalMap,  // The normal map
//     roughness: 0.5,  // Optional: Adjust roughness of the surface
//     metalness: 0.0,  // Optional: Adjust metalness of the surface (not relevant for lane),
//     // normalScale:new three.Vector2(3,3),
//     side:three.DoubleSide
// });
// material1.normalScale.set(2, 2); 



const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment shader with normal map and bumpiness control
const fragmentShader = `
  uniform sampler2D normalMap;
  uniform float bumpIntensity;  // Control bumpiness intensity
    // float bumpIntensity=2.0;
  varying vec2 vUv;
  varying vec3 vNormal;

  uniform vec2 circleCenter;

  void main() {
    // // Sample the normal map
    // vec3 normalTex = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    
    // // Adjust normal map effect based on bumpIntensity
    // if(vUv.x>0.5){
    //     normalTex *= 1.0;
    // }

    // // Lighting calculation (basic Lambertian diffuse shading)
    // vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));  // Directional light
    // float diff = max(dot(normalTex, lightDir), 0.0);

    // // Set final color based on lighting and normal map effect
    // vec3 color = vec3(0.8, 0.6, 0.2);  // Base color
    // gl_FragColor = vec4(color * diff, 1.0);


    // half side logic
    // vec3 normalTex;
    // if (vUv.x < 0.5) {
    //     // Use normal map on left half
    //     normalTex = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;
    //     normalTex *= 2.0;
    // } else {
    //     // Use flat normal on right half (facing up)
    //     normalTex = vec3(0.0, 0.0, 1.0);  // flat surface
    // }

    // // Basic lighting
    // vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    // float diff = max(dot(normalTex, lightDir), 0.0);

    // vec3 color = vec3(0.8, 0.6, 0.2);  // your base color
    // gl_FragColor = vec4(color * diff, 1.0);



    // circle logic

    
    // Compute distance from UV center
    float dist = distance(vUv, circleCenter);  // center of plane is (0.5, 0.5)
    float radius = 0.3;  // radius of bump circle

    // Create a mask: 1.0 inside the circle, 0.0 outside
    // float mask = step(dist, radius);
    float mask = 1.0 - smoothstep(radius * 0.01, radius, dist);


    // Sample normal map and scale
    vec3 normalTex = texture2D(normalMap, vUv).xyz * 2.0 - 1.0;

    // Flat normal (facing up)
    vec3 flatNormal = vec3(0.0, 0.0, 1.0);

    // Mix between bump and flat based on mask
    vec3 finalNormal = mix(flatNormal, normalTex * bumpIntensity, mask);

    // Lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    float diff = max(dot(finalNormal, lightDir), 0.0);

    vec3 color = vec3(0.8, 0.6, 0.2);  // base color
    gl_FragColor = vec4(color * diff, 1.0);

  }
`;

// Create the material with custom shader
const material = new three.ShaderMaterial({
    uniforms: {
        normalMap: { type: 't', value: normalMap },
        bumpIntensity: { type: 'f', value: 2.0 },  // Start with no bumpiness
        circleCenter: { value: new three.Vector2(0.5, 0.5) },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader
});




const plane = new three.Mesh(new three.PlaneGeometry(1, 1, 50, 50), material)
scene.add(plane)



new OrbitControls(camera, canvas)


const renderer = new three.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);

let t = 0
let previousCenter = new three.Vector2(0.5, 0.5);
let currentIntensity = 0;

function animate() {
    renderer.render(scene, camera);

    t += 0.01;
    const x = 0.5 + 0.2 * Math.cos(t);
    const y = 0.5 + 0.2 * Math.sin(t);
    const newCenter = new three.Vector2(x, y);

    // Calculate distance from previous center to detect movement
    const moveDist = previousCenter.distanceTo(newCenter);

    // If movement is significant, boost the bump intensity slightly
    if (moveDist > 0.001) {
        currentIntensity = 1.5;  // temporary "bump" when moving
    }

    // Ease out the intensity gradually
    currentIntensity *= 0.95;  // decay factor

    // Apply values to uniforms
    material.uniforms.circleCenter.value.set(x, y);
    material.uniforms.bumpIntensity.value = currentIntensity;

    // Update the previous position
    previousCenter.copy(newCenter);



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
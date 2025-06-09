import * as three from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';



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
    scene.add(model)


    // const intersects = raycaster.intersectObject(model);
    // const intersect = intersects[0];
    // console.log(intersect);



})



const material = new three.MeshNormalMaterial()
const plane = new three.Mesh(new three.PlaneGeometry(1, 1, 50, 50), material)
scene.add(plane)









new OrbitControls(camera, canvas)
const renderer = new three.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);



function animate() {
    renderer.render(scene, camera);


    raycaster.setFromCamera(mouse, camera)
    // console.log(originalZ);

    if (originalZ) {
        for (let index = 0; index < originalZ.length; index++) {
            model.geometry.attributes.position.setZ(index, 0)
            // const element = originalZ[index];

        }
    }


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
                    const intensity = 1 - dist / radius;
                    const newZ = originalZ[i] + intensity * .5;
                    posAttr.setZ(i, newZ);
                    // posAttr.setZ(i, originalZ[i] + 1); // Push up only within the radius
                    // posAttr.setZ(i, originalZ[i] + 1);
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
import { vec3, vec4, mat4 } from "gl-matrix";
const Stats = require("stats-js");
import * as DAT from "dat.gui";
import Icosphere from "./geometry/Icosphere";
import Square from "./geometry/Square";
import OpenGLRenderer from "./rendering/gl/OpenGLRenderer";
import Camera from "./Camera";
import { PI, readTextFile, setGL, suzanne_str } from "./globals";
import ShaderProgram, { Shader } from "./rendering/gl/ShaderProgram";
import Cube from "./geometry/Cube";
import Mesh from "./geometry/Mesh";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  shader: 0,
  light_rotation: 0,
  "Reload Scene": loadScene, // A function pointer, essentially
};
var palette = {
  main_color: [255 * 0.42, 255 * 0.2, 255 * 0.14, 255],
};
let lightPos: vec3 = vec3.fromValues(0, 0, 5);
let lightPos4: vec4 = vec4.fromValues(0, 0, 5, 1);
let prevLightAngle: number = 0;
let prevColor: vec4 = vec4.fromValues(1.0, 0.0, 0.0, 0.0);
let prevShader: number = -1;
let suzanne: Mesh = new Mesh(suzanne_str, vec3.fromValues(0, 0, 0));

function loadScene() {
  suzanne = new Mesh(suzanne_str, vec3.fromValues(0, 0, 0));
  suzanne.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  gui.add(controls, "shader", {
    normals: -1,
    lambert: 0,
    one_dimensional_toon: 1,
  });
  gui.addColor(palette, "main_color");
  gui.add(controls, "light_rotation", 0, 360).step(1);
  gui.add(controls, "Reload Scene");

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2 not supported!");
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(20.0 / 255.0, 7.0 / 255.0, 61.0 / 255.0, 1);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/lambert-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/lambert-frag.glsl")),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    if (controls.shader != prevShader) {
      prevShader = controls.shader;
    }

    let currColor: vec4 = vec4.fromValues(
      palette.main_color[0] / 255,
      palette.main_color[1] / 255,
      palette.main_color[2] / 255.0,
      1
    );
    if (currColor != prevColor) {
      prevColor = currColor;
    }

    if (controls.light_rotation != prevLightAngle) {
      let change_radians: number = (controls.light_rotation - prevLightAngle) * PI / 180;
      let rot1: mat4 = mat4.create();
      let rot2: mat4 = mat4.create();
      rot1 = mat4.rotateX(rot1, rot1, change_radians);
      rot2 = mat4.rotateY(rot2, rot2, change_radians);
      let currLightPos = vec3.transformMat4(
        lightPos,
        lightPos,
        mat4.multiply(mat4.create(), rot1, rot2)
      );
      lightPos4 = vec4.fromValues(
        currLightPos[0],
        currLightPos[1],
        currLightPos[2],
        1.0
      );
      prevLightAngle = controls.light_rotation;
    }

    lambert.draw(suzanne);

    renderer.render(camera, lambert, controls.shader, currColor, lightPos4, [
      suzanne,
    ]);

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener(
    "resize",
    function () {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.setAspectRatio(window.innerWidth / window.innerHeight);
      camera.updateProjectionMatrix();
    },
    false
  );

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();

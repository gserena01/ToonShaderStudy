import { vec2, vec3, mat4, vec4 } from "gl-matrix";
import * as Stats from "stats-js";
import * as DAT from "dat-gui";
import ScreenQuad from "./geometry/ScreenQuad";
import OpenGLRenderer from "./rendering/gl/OpenGLRenderer";
import Camera from "./Camera";
import { gl, PI, setGL } from "./globals";
import ShaderProgram, { Shader } from "./rendering/gl/ShaderProgram";
import Mesh from "./geometry/Mesh";
import { readTextFile } from "../src/globals";
import FrameBuffer from "./rendering/gl/FrameBuffer";

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  shader: 0,
  shininess: 0.5,
  r: 2.5,
  magnitude: 0.5,
  z_min: 8.0,
  delete_num: 4,
  mesh: 0,
  light_rotation: 0,
  "Reload Scene": loadScene, // A function pointer, essentially
};
var palette = {
  main_color: [255 * 0.42, 255 * 0.2, 255 * 0.14, 255],
};

let clearColor: vec4 = vec4.fromValues(0.08, 0.03, 0.24, 1);
let lightPos: vec3 = vec3.fromValues(0, 0, 5);
let lightPos4: vec4 = vec4.fromValues(0, 0, 5, 1);
let prevLightAngle: number = 0;
let prevColor: vec4 = vec4.fromValues(1.0, 0.0, 0.0, 0.0);
let prevShader: number = -1;
let prevMesh: number = 0;
let suzanne: Mesh = new Mesh(
  readTextFile("resources/suzanne.obj"),
  vec3.fromValues(0, 0, 0)
);
let renderMesh: Mesh = suzanne;
let screenQuad: ScreenQuad;

function isMappingShader() {
  return controls.shader == 2 || controls.shader == 3 || controls.shader == 7 || controls.shader == 8 || controls.shader == 9;
}

function loadScene() {
  renderMesh.create();

  screenQuad = new ScreenQuad();
  screenQuad.create();
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
    shiny_spec_highlights1: 2,
    shiny_spec_highlights2: 3,
    detail_mapping: 7,
    near_silhouette_1: 8,
    near_silhouette_2: 9,
    bit_deletion: 10,
    outlines: 4,
    mesh_lines: 5,
    cluster_dot: 11,
    obra_dinn: 6,
  });
  let color_folder = gui.addFolder("Color");
  color_folder.addColor(palette, "main_color");
  let shininess_folder = gui.addFolder("Shininess");
  shininess_folder.add(controls, "shininess", 0, 1).step(0.01);
  let detail_folder = gui.addFolder("Detail Mapping");
  detail_folder.add(controls, "r", 1.0, 10.0).step(0.01);
  detail_folder.add(controls, "z_min", 0.0, 10.0).step(0.01);
  let silhouette_folder = gui.addFolder("Near-Silhouette");
  silhouette_folder.add(controls, "magnitude", 0, 5).step(0.01);
  let bit_folder = gui.addFolder("Bit Deletion");
  bit_folder.add(controls, "delete_num", 0, 8).step(1);
  gui.add(controls, "mesh", {
    monkey: 0,
    t_rex: 1,
    armadillo: 2,
    bunny: 3,
  });
  gui.add(controls, "light_rotation", 0, 360).step(1);
  gui.add(controls, "Reload Scene");

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
  if (!gl) {
    alert("WebGL 2 not supported!");
  }

  const texWidth = window.innerWidth;
  const texHeight = window.innerHeight;
  let frameBuffer: FrameBuffer;
  frameBuffer = new FrameBuffer(
    gl,
    texWidth,
    texHeight,
    window.devicePixelRatio
  );
  frameBuffer.create();
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(
    clearColor[0],
    clearColor[1],
    clearColor[2],
    clearColor[3]
  );
  gl.enable(gl.DEPTH_TEST);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/lambert-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/lambert-frag.glsl")),
  ]);

  const mappingShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/lambert-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/mappings-frag.glsl")),
  ]);

  const postShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/post/noOp-vert.glsl")),
    new Shader(
      gl.FRAGMENT_SHADER,
      require("./shaders/post/transition-frag.glsl")
    ),
  ]);

  postShader.setWindowSize(vec2.fromValues(texWidth, texHeight));

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();

    if (controls.shader != prevShader) {
      prevShader = controls.shader;
    }

    if (isMappingShader()) {
      const img = new Image();
      img.onload = function () {
        gl.activeTexture(gl.TEXTURE2);
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        const texLoc = gl.getUniformLocation(mappingShader.prog, "u_SamplerTexture");
        gl.uniform1i(texLoc, 2);

        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4); // draw over the entire viewport
      };
      if (controls.shader == 2) {
        img.src = "/resources/texture2.png";
        shininess_folder.open();
        detail_folder.close();
        silhouette_folder.close();
        mappingShader.setShininess(controls.shininess);
      } else if (controls.shader == 3) {
        img.src = "/resources/texture3.png";
        shininess_folder.open();
        detail_folder.close();
        silhouette_folder.close();
        mappingShader.setShininess(controls.shininess);
      } else if (controls.shader == 7) {
        img.src = "/resources/texture4.png";
        mappingShader.setR(controls.r);
        mappingShader.setZMin(controls.z_min);
        detail_folder.open();
        shininess_folder.close();
        silhouette_folder.close();
      } else if (controls.shader == 8) {
        img.src = "/resources/texture5.png";
        detail_folder.close();
        shininess_folder.close();
        silhouette_folder.open();
        mappingShader.setR(controls.magnitude);
      } else if (controls.shader == 9) {
        img.src = "/resources/texture6.png";
        detail_folder.close();
        shininess_folder.close();
        silhouette_folder.open();
        mappingShader.setR(controls.magnitude);
      }
    } else {
      shininess_folder.close();
      detail_folder.close();
      silhouette_folder.close();
    }

    if (controls.shader == 0 || controls.shader == 1 || controls.shader == 11) {
      color_folder.open();
    } else {
      color_folder.close();
    }

    if (controls.shader == 10) {
      bit_folder.open();
      lambert.setShift(controls.delete_num);
    } else {
      bit_folder.close();
    }

    if (controls.mesh != prevMesh) {
      prevMesh = controls.mesh;
      if (controls.mesh == 0) {
        renderMesh = new Mesh(
          readTextFile("resources/suzanne.obj"),
          vec3.fromValues(0, 0, 0)
        );
      } else if (controls.mesh == 1) {
        renderMesh = new Mesh(
          readTextFile("resources/tyra.obj"),
          vec3.fromValues(0, 0, 0)
        );
      } else if (controls.mesh == 2) {
        renderMesh = new Mesh(
          readTextFile("resources/armadillo.obj"),
          vec3.fromValues(0, 0, 0)
        );
      } else if (controls.mesh == 3) {
        renderMesh = new Mesh(
          readTextFile("resources/bunny.obj"),
          vec3.fromValues(0, 0, 0)
        );
      }
      loadScene();
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
      let change_radians: number =
        ((controls.light_rotation - prevLightAngle) * PI) / 180;
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

    if (
      controls.shader == 4 ||
      controls.shader == 5 ||
      controls.shader == 6 ||
      controls.shader == 11
    ) {
      // post-processing, adapted from: https://learnopengl.com/Advanced-OpenGL/Framebuffers

      // 1. Render the scene as usual with the new framebuffer bound as the active framebuffer.
      // first pass
      frameBuffer.bindFrameBuffer();
      gl.clearColor(clearColor[0], clearColor[1], clearColor[2], 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // we're not using the stencil buffer now
      gl.enable(gl.DEPTH_TEST);
      renderer.render(camera, lambert, controls.shader, currColor, lightPos4, [
        renderMesh,
      ]);
      // nothing should appear bc we are rendering to the buffer

      // 2. Bind to the default framebuffer.
      // second pass
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); // back to default
      gl.clearColor(0.1, 0.1, 0.1, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // we're not using the stencil buffer now

      // 3. Draw a quad that spans the entire screen with the new framebuffer's color buffer as its texture.
      gl.disable(gl.DEPTH_TEST);
      frameBuffer.bindToTextureSlot(1);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      postShader.setTexture1(1); // accepts the int ID of the tex slot you want the unif to bind to
      renderer.render(
        camera,
        postShader,
        controls.shader,
        currColor,
        lightPos4,
        [screenQuad]
      );
    } else {
      // render without post-processing effects
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.enable(gl.DEPTH_TEST);
      if (isMappingShader()) {
        renderer.render(camera, mappingShader, controls.shader, currColor, lightPos4, [renderMesh]);
      } else {
        renderer.render(
          camera,
          lambert,
          controls.shader,
          currColor,
          lightPos4,
          [renderMesh]
        );
      }
    }

    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  // EVENT LISTENERS------------------------------------------------------------
  window.addEventListener(
    "resize",
    function () {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.setAspectRatio(window.innerWidth / window.innerHeight);
      camera.updateProjectionMatrix();
      frameBuffer.resize(
        window.innerWidth,
        window.innerHeight,
        window.devicePixelRatio
      );
      frameBuffer.destroy();
      frameBuffer.create();
      postShader.setWindowSize(
        vec2.fromValues(window.innerWidth, window.innerHeight)
      );
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

#version 300 es
precision highp float;
// transition.frag.glsl:
// A fragment shader used for post-processing that simply reads the
// image produced in the first render pass by the surface shader

// blur adapted from: https://learnopengl.com/Advanced-OpenGL/Framebuffers
in vec2 fs_UV;
uniform vec2 u_WindowSize;
uniform vec4 u_LightPos;
uniform int u_Shader;

out vec4 out_Col;
uniform sampler2D u_Texture1;

const int clust_dot[64] = int[](24, 10, 12, 26, 35, 47, 49, 37, 8, 0, 2, 14, 45, 59, 61, 51, 22, 6, 4, 16, 43, 57, 63, 53, 30, 20, 18, 28, 33, 41, 55, 39, 34, 46, 48, 36, 25, 11, 13, 27, 44, 58, 60, 50, 9, 1, 3, 15, 42, 56, 62, 52, 23, 7, 5, 17, 32, 40, 54, 38, 31, 21, 19, 29);

float isDepthEdge() {
  float val = 0.0;
  float x_step = 1.0 / u_WindowSize.x;
  float y_step = 1.0 / u_WindowSize.y;
  vec3 currCol = texture(u_Texture1, fs_UV).rgb;
  vec3 upCol = texture(u_Texture1, vec2(fs_UV.x, fs_UV.y + y_step)).rgb;
  vec3 downCol = texture(u_Texture1, vec2(fs_UV.x, fs_UV.y - y_step)).rgb;
  vec3 leftCol = texture(u_Texture1, vec2(fs_UV.x - x_step, fs_UV.y)).rgb;
  vec3 rightCol = texture(u_Texture1, vec2(fs_UV.x + x_step, fs_UV.y)).rgb;
  val += float((currCol != upCol) || (currCol != downCol) || (currCol != leftCol) || (currCol != rightCol));
  return val;
}

void main() {
  out_Col = vec4(vec3(isDepthEdge()), 1.0);

  if(u_Shader == 6) { // obra dinn
    vec3 nor = texture(u_Texture1, fs_UV).rgb;
    float diffuseTerm = dot(nor, u_LightPos.xyz);
    if(diffuseTerm > 0.0) {
      out_Col = vec4(vec3(1.0) - out_Col.rgb, 1.0);
    }
  } else if(u_Shader == 11) {
    // to find corresponding mask index
    int i = int(fs_UV.x * u_WindowSize.x);
    int j = int(fs_UV.y * u_WindowSize.y);
    int maskIndex = i % 8 + (j % 8) * 8;
    vec4 tex_col = texture(u_Texture1, fs_UV);
    float compare_val = float(clust_dot[maskIndex]) * 4.0 / 255.0;
    if(tex_col.r > compare_val) {
      out_Col.r = 1.0;
    } else {
      out_Col.r = 0.0;
    }
    if(tex_col.g > (compare_val)) {
      out_Col.g = 1.0;
    } else {
      out_Col.g = 0.0;
    }
    if(tex_col.b > compare_val) {
      out_Col.b = 1.0;
    } else {
      out_Col.b = 0.0;
    }

    out_Col.a = 1.0;

  }
  // out_Col = vec4(1.0, 1.0, .0, 1.0);
}
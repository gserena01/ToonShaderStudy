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
uniform sampler2D u_RenderedTexture;
const float PI = 3.141592653589;
const float offset = 1.0 / 300.0;
const vec2 offsets[9] = vec2[](vec2(-offset, offset), // top-left
vec2(0.0f, offset), // top-center
vec2(offset, offset), // top-right
vec2(-offset, 0.0f),   // center-left
vec2(0.0f, 0.0f),   // center-center
vec2(offset, 0.0f),   // center-right
vec2(-offset, -offset), // bottom-left
vec2(0.0f, -offset), // bottom-center
vec2(offset, -offset)  // bottom-right    
);

float isDepthEdge(vec2 uv) {
  float val = 0.0;
  float x_step = 1.0 / u_WindowSize.x;
  float y_step = 1.0 / u_WindowSize.y;
  vec3 currCol = texture(u_RenderedTexture, fs_UV).rgb;
  vec3 upCol = texture(u_RenderedTexture, vec2(fs_UV.x, fs_UV.y + y_step)).rgb;
  vec3 downCol = texture(u_RenderedTexture, vec2(fs_UV.x, fs_UV.y - y_step)).rgb;
  vec3 leftCol = texture(u_RenderedTexture, vec2(fs_UV.x - x_step, fs_UV.y)).rgb;
  vec3 rightCol = texture(u_RenderedTexture, vec2(fs_UV.x + x_step, fs_UV.y)).rgb;
  val += float((currCol != upCol) || (currCol != downCol) || (currCol != leftCol) || (currCol != rightCol));
  return val;
}

void main() {
  out_Col = vec4(vec3(isDepthEdge(fs_UV)), 1.0);

  if(u_Shader == 6) { // obra dinn
    vec3 nor = texture(u_RenderedTexture, fs_UV).rgb;
    float diffuseTerm = dot(nor, u_LightPos.xyz);
    if(diffuseTerm > 0.0) {
      out_Col = vec4(vec3(1.0) - out_Col.rgb, 1.0);
    }
  }
}
#version 300 es

precision highp float;

uniform int u_Shader;
uniform vec4 u_CameraEye;
uniform vec4 u_LightPos;
uniform sampler2D u_SamplerTexture;
uniform float u_Shininess;
uniform float u_R;
uniform float u_ZMin;

in vec4 fs_Nor;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

void main() {
    vec3 n = normalize(fs_Nor.xyz);
    vec3 l = normalize(u_LightPos.xyz);
    float nl = dot(n, l);
    vec3 v = normalize(u_CameraEye.xyz);
    if(u_Shader == 2 || u_Shader == 3) { // shininess-based highlights
        vec3 r = l - 2.0 * dot(l, n) * n;
        float s = u_Shininess;
        float D = pow(abs(dot(v, r)), s);
        out_Col = vec4(texture(u_SamplerTexture, vec2(nl, D)).rgb, 1.0);
    } else if(u_Shader == 7) { // detail mapping
        float z = distance(u_CameraEye, fs_Pos);
        float zmin = u_ZMin;
        float r = u_R;
        float zmax = r * zmin;
        float D = 1.0 - (log(z / zmin) / log(zmax / zmin));
        out_Col = vec4(texture(u_SamplerTexture, vec2(nl, D)));
    } else if(u_Shader == 8 || u_Shader == 9) { // near-silhouette
        float r = u_R;
        float D = pow(abs(dot(n, v)), r);
        out_Col = vec4(texture(u_SamplerTexture, vec2(nl, D)));
    } else { // normals (catches u_Shader == 5 and 6)
        out_Col = vec4(abs(normalize(fs_Nor.xyz)), 1.0);
    }
}

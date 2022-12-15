#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color; // The color with which to render this instance of geometry.
uniform int u_Shader;
uniform vec4 u_CameraEye;
uniform vec4 u_LightPos;
uniform sampler2D u_Texture;
uniform sampler2D u_SamplerTexture;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;
in vec4 fs_Pos;

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

int shiftleft(int x, int n) {
    return int(float(x) * pow(2.0, float(n)));
}

// bitwise shift x to the right n spaces (bitwise >>)
// x is int to shift
// n is number of "shifts" or spaces to shift right
int shiftright(int x, int n) {
    return int(floor(float(x) / pow(2.0, float(n))));
}

void main() {
    if(u_Shader == 0) {
    // Material base color (before shading)
        vec4 diffuseColor = u_Color;

        // Calculate the diffuse term for Lambert shading
        float diffuseTerm = dot(normalize(fs_Nor.xyz), normalize(u_LightPos.xyz));
        // Avoid negative lighting values
        diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);

        float ambientTerm = 0.2;

        float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
        out_Col = vec4(diffuseColor.rgb * lightIntensity, 1.0);
    //out_Col = vec4((normalize(fs_Nor.xyz) + vec3(1.)) * 0.5, 1.);
    } else if(u_Shader == 1) { // one-dimensional texture shading
        float nl = dot(vec3(fs_Nor), vec3(u_LightPos));
        if(nl > 0.5) {
            out_Col = vec4(1.45 * u_Color.xyz, 1.0);
        } else if(nl > 0.0) {
            out_Col = u_Color;
        } else {
            out_Col = vec4(0.35 * u_Color.xyz, 1.0);
        }
    } else if(u_Shader == 2) { // shininess-based highlights
        vec3 n = normalize(fs_Nor.xyz);
        vec3 v = normalize(u_CameraEye.xyz);
        vec3 l = normalize(fs_LightVec.xyz);
        vec3 r = l - 2.0 * dot(l, n) * n;
        float s = 0.5;
        float D = pow(abs(dot(v, r)), s);
        float nl = dot(n, l);
        out_Col = vec4(texture(u_SamplerTexture, vec2(nl, D)).rgb, 1.0); // replace with texture sample

    } else if(u_Shader == 3) {
        mediump vec2 coord = vec2(gl_FragCoord.x / 512.0, 1.0 - (gl_FragCoord.y / 512.0));
        mediump vec4 samp = texture(u_SamplerTexture, coord);
        out_Col = vec4(samp.r, samp.g, samp.b, 1.0);
    } else if(u_Shader == 4) {
      out_Col = vec4(1.0);
    } else { // normals (catches u_Shader == 5)
        out_Col = vec4(abs(normalize(fs_Nor.xyz)), 1.0);
    }
}

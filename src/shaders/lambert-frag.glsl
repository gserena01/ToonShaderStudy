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
    if (true) {
    // Material base color (before shading)
    vec4 diffuseColor = vec4(0.42, 0.2, 0.14, 1);

        // Calculate the diffuse term for Lambert shading
    float diffuseTerm = dot(normalize(fs_Nor.xyz), normalize(fs_LightVec.xyz));
        // Avoid negative lighting values
    diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);

    float ambientTerm = 0.2;

    float lightIntensity = diffuseTerm + ambientTerm;   //Add a small float value to the color multiplier
                                                            //to simulate ambient lighting. This ensures that faces that are not
                                                            //lit by our point light are not completely black.

        // Compute final shaded color
    out_Col = vec4(diffuseColor.rgb * lightIntensity, diffuseColor.a);
    //out_Col = vec4((normalize(fs_Nor.xyz) + vec3(1.)) * 0.5, 1.);
    }
    if (false) { // one-dimensional texture shading
        float nl = dot(vec3(fs_Nor), vec3(fs_LightVec));
        if(nl > 0.5) {
            out_Col = vec4(1.0, 1.0, 1.0, 1.0);
        } else if(nl > 0.0) {
            out_Col = vec4(0.33, 0.33, 0.33, 1.0);
        } else {
            out_Col = vec4(0.0, 0.0, 0.0, 1.0);
        }
    }
}
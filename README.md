# Toon Shader Experimentation | Serena Gandhi (serenagandhi1@gmail.com)
## Link: https://gserena01.github.io/ToonShaderStudy/ (may not work well on some devices :(   )

This project currently contains my explorations in toon shading! I have implemented several existing toon shaders, dithering algorithms, and creative shading techniques to explore levels of abstraction, depth, and lighting in toonstyle rendering.

# To Run:

If the link is not working, please download the source code. Using npm, run "npm install", then "npm start". Go to [localhost:2023](http://localhost:2023/) in your browser, and play around with a variety of shaders, models, and lighting scenarios!

# Shaders Implemented:

There are a variety of shaders included within this project. The below sections discuss the implementation and results of each one.

## Lambertian Shading:

![image](https://user-images.githubusercontent.com/60444726/208586734-1dcae63c-bf68-4b2e-b583-e3a3e1438c74.png)

This appears on the landing page of the program, primarily as a point of comparison to other shaders included in the program.

## Normals:

![image](https://user-images.githubusercontent.com/60444726/208586840-d3d249a8-96f7-4cc0-a736-6c92128dada2.png)

This shader simply renders out the normals of the mesh as a visualization for the viewer.

## One-Dimensional Toon Shading

![image](https://user-images.githubusercontent.com/60444726/208587054-1a6b03bf-6e55-49b7-abdb-360843d7d923.png)

![image](https://user-images.githubusercontent.com/60444726/208587127-d863915d-7ffc-480a-ac5e-46533d84c2d0.png)

Now things are getting interesting! One-Dimensional Toon Shading is the most primitive toon shading technique. It produces promising results that are visible on both lo- and hi-poly mesh. 

This shader acheives this affect by determining how the light interacts with the surface normal. If the dot product of the light direction and the surface normal reaches certain threshold values, the shade used to color the mesh changes accordingly.

## Shininess-Based Specular Highlights

![image](https://user-images.githubusercontent.com/60444726/208587651-ff87a5f2-98d2-460d-ad6b-5d553f4d6e82.png)

![texture2](https://user-images.githubusercontent.com/60444726/208588083-40738f26-465a-4cdb-947d-6777470756fe.png)

![image](https://user-images.githubusercontent.com/60444726/208587694-8dee8d4a-8f3c-4a73-b10f-ceb56dafd7fb.png)

![texture1](https://user-images.githubusercontent.com/60444726/208588105-2bc39c73-64b9-49a5-a6ff-bf1de9ed776a.png)

This shader samples from a texture using the dot product of the surface normal and the light direction, the interaction between the camera and the light, as well as a shininess factor. Together, this produces a toonstyle shader that interacts intensely with changes in lighting.

## Detail Mapping

![image](https://user-images.githubusercontent.com/60444726/208588607-68ddcae5-de20-4471-a685-7b3f8ef012ee.png)

![texture4](https://user-images.githubusercontent.com/60444726/208588629-e2e5edfb-ce3d-4feb-b084-790f660be8c5.png)

This shader provides levels of abstraction based on the distance from the camera eye. Polygons further away from the mesh are shaded in a more solid, dark gray-ish color, while features closer to camera are rendered with more detail. This is acheived by sampling from a texture using depth as a parameter.

## Bit Deletion

![image](https://user-images.githubusercontent.com/60444726/208588992-f73f16bf-1fb2-496c-a09c-a956992541cf.png)

### Before

![image](https://user-images.githubusercontent.com/60444726/208588926-57d4b2c2-cef8-45b9-9271-25c9fea92db5.png)

### After

This surprisingly simple, original technique simply removes bits from the color data before rendering. The number of bits removed can be adjusted by the user. The removal of bits from the color data provides levels of abstraction based on the number of bits removed and can produce a range of stylized results.

# External Resources:

Barla, P., Thollot, J., and Markosian, L. 2006. X8Toon: An Extended Toon Shader. In International
Symposium on Non8Photorealistic Animation and Rendering.

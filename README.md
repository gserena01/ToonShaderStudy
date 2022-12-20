# Toon Shader Experimentation | Serena Gandhi (serenagandhi1@gmail.com)
## Link: https://gserena01.github.io/ToonShaderStudy/ (may not work well on some devices :(   )

This project currently contains my explorations in toon shading! I have implemented several existing toon shaders, dithering algorithms, and creative shading techniques to explore levels of abstraction, depth, and lighting in toonstyle rendering.

# To Run:

If the link is not working, please download the source code. Using npm, run "npm install", then "npm start". Go to localhost:2023 in your browser, and play around with a variety of shaders, models, and lighting scenarios!

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

![image](https://user-images.githubusercontent.com/60444726/208587986-43f1cd06-9c3a-4a68-a741-be1766a6031f.png)

![image](https://user-images.githubusercontent.com/60444726/208587694-8dee8d4a-8f3c-4a73-b10f-ceb56dafd7fb.png)

![image](https://user-images.githubusercontent.com/60444726/208588001-39b1550b-8c89-48b6-ba51-71d5d58455fc.png)


This shader samples from a texture using the dot product of the surface normal and the light direction, the interaction between the camera and the light, as well as a shininess factor. Together, this produces a toonstyle shader that interacts intensely with changes in lighting.


# External Resources:

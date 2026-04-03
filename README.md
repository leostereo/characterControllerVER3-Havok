# Babylon.js 8 + Vite 6 Typescript Template with Havok Physics

### Dev Environment

`npm i`

`npm run dev`

### Production Environment

`npm run build`

`npm run preview`

## Features

- Freshiest Babylon.js, Vite, Typescript and all other dependencies
- WebGPU engine by default, WebGL2 supported as well
- Havok Physics already set up and included in the demo scene
- FPS Counter in the right top corner
- Inspector - press Ctrl+Alt+Shift+I
- Axes Viewer
- Default Rendering Pipeline with FXAA and MSAA enabled
- All `console.log` messages are cleared in the production build
- Easy to disable not needed functions (Havok, Axes Viewer, Pipeline etc)
- Tree-shaking to reduce bundle size
- Inspector's import only for DEV mode to reduce bundle size

Based on old good https://github.com/minibao/babylon-vite

**Made by https://babylonpress.org/**


Esquema 1.1
En el esquema 1.1 definimos los siguientes actores.
Controllers:
Se ubican en la carpeta controllers.
Se encargan de leer desde un input (maquinas de estado)
Procesan y generan o no un ouput, es decir cambio en una maquina de estado.
Se pueden diferenciar:
    physicController: Responsable de la fisica del personaje.
    inputController: Responsable de la lectura de teclado para direccionar el personaje.
    AnimationController: Responsable de las animaciones del modelo que representa el personaje
    effectsController: Responsable de los efectos de sonido u otros del personaje. 
    cameraController: Responsable del control de la camara.

Maquinas de estado:
    Sus tareas son:
    Guaradar un estado.
    Setear un estado.
    Devolver un estado.
Para esta version tenemos 3 maquinas de estado:

    physicState: Mantiene el estado de soporte, velocidad y otros relativos a la fisica
    AnimationState: Mantiene el estado de accion del personaje, por ejemplo cayendo , caminando , saltando , comenzando_salto,etc.
    InputState


# BabylonJS Project — Copilot Context

## Stack
- **Engine**: BabylonJS 8.x
- **Physics**: Havok (`@babylonjs/havok`) via `PhysicsCharacterController`
- **Language**: TypeScript (strict mode)
- **Bundler**: Vite 5
- **Deploy**: GitHub Pages via GitHub Actions

## Project Structure
```
src/
  scene/       → SceneManager (engine, camera, lights)
  physics/     → PhysicsManager (Havok init)
  player/      → PlayerController (PhysicsCharacterController)
  utils/       → helpers, constants
```

## Key Conventions
- Siempre llamar `.dispose()` en meshes, materials y texturas al destruir objetos
- `deltaTime` siempre en segundos: `getDeltaTime() / 1000`
- Física con masa 0 = objetos estáticos (suelo, paredes)
- `PhysicsCharacterController` usa `checkSupport()` para detectar suelo, NO depende de eventos de colisión nativos

## BabylonJS imports
Siempre importar desde `@babylonjs/core`:
```ts
import { Scene, Vector3, MeshBuilder } from "@babylonjs/core";
```

## Linting
- ESLint v9 flat config
- No usar `any`, siempre tipar explícitamente
- No usar `!` (non-null assertion) sin justificación

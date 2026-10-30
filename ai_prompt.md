# MASTER PROMPT — Interactive 3D Hit & Kick Studio

## ROLE

You are a senior full-stack engineer, Three.js specialist, React Three Fiber developer, UI/UX designer, and autonomous coding agent.

Your mission is to build a complete, polished, functional 3D web application called **3D Hit Studio**.

You must work directly inside the current project workspace. Inspect the existing files, implement the application, run available checks, diagnose problems, and fix issues wherever possible.

Do not merely explain how to build the application. Actually implement it.

Do not stop after creating a visual mockup, writing a single incomplete component, or listing instructions.

---

## PHASE 1 — INSPECT THE PROJECT

Before writing code:

1. Inspect the existing project structure.
2. Read `package.json`, the Next.js configuration, Tailwind configuration, and existing application components.
3. Determine whether the project uses JavaScript or TypeScript and follow the existing convention.
4. Identify the package manager from the lockfile.
5. Inspect the `public` directory for available 3D models, textures, and audio files.
6. Determine whether the supplied GLB file contains the required meshes, materials, and animations using available tools or code when possible.
7. Identify missing assets and dependencies before implementing features that depend on them.

Preserve working configurations and unrelated user code.

Do not recreate the project unnecessarily.

If the workspace is empty, initialize a suitable Next.js App Router project.

Create a short implementation checklist and follow it through completion.

## PHASE 2 — TECHNOLOGY STACK

Use:

* Next.js App Router
* React
* Tailwind CSS
* Three.js
* @react-three/fiber
* @react-three/drei

Use JavaScript JSX by default, unless the existing project uses TypeScript.

Use compatible versions of the dependencies already installed whenever possible.

Install only missing dependencies.

Use `"use client"` for components that depend on React Three Fiber, browser APIs, file uploads, audio, or interactive state.

Keep the implementation modular, maintainable, and easy for a beginner to understand.

Do not introduce a backend, database, authentication system, or external AI API. The core application must run locally in the browser.

## PHASE 3 — APPLICATION DESIGN

Build a modern, immersive dark-mode application called **3D Hit Studio**.

### Visual direction

Create a premium game-like interface with:

* A near-black background.
* Subtle gradients and atmospheric lighting.
* A large central 3D character viewport.
* A compact image-upload panel near the top.
* A clear image preview after upload.
* Fixed action controls near the bottom.
* A red-accented Hit button.
* An orange-accented Kick button.
* Smooth hover, pressed, loading, and disabled states.
* Responsive layouts for desktop, tablets, and mobile devices.
* Accessible labels and visible keyboard focus indicators.

Use Tailwind CSS for the interface.

Keep the character as the primary visual focus. Do not let the upload panel or action buttons obstruct the character's face or body.

Add restrained motion and transitions without compromising performance.

Avoid unnecessary dashboards, navigation menus, and unrelated features.

### Main screen

The screen should contain:

1. Application title and a small status indicator.
2. Image upload and preview panel.
3. Interactive 3D character scene.
4. Optional camera-reset control.
5. Hit and Kick buttons.
6. A small mute/unmute control if appropriate.
7. Loading, error, and asset-status messages.

The application must remain usable on small screens.

## PHASE 4 — 3D SCENE

Load the model from:

`/character.glb`

Use `useGLTF` from `@react-three/drei`.

Create a reusable character component and a separate scene component.

Configure:

* PerspectiveCamera or the Canvas camera configuration.
* Ambient and directional lighting.
* Appropriate character scale and positioning.
* Shadows when supported and useful.
* OrbitControls for rotation and zoom.
* Camera limits to prevent unusable viewing angles.
* A loading indicator while the model is loading.

The model should be framed properly when the page first opens.

### Model inspection

Inspect the model's available meshes, materials, and animations.

Log useful asset information in development mode, including:

* Mesh names.
* Material names.
* Animation clip names.
* Whether a candidate face mesh exists.

Do not expose unnecessary technical logs in the production UI.

Search for likely face meshes using configurable names such as:

`Head`, `Face`, `head`, `face`, `HeadMesh`, and `FaceMesh`.

Do not assume that a name match guarantees that the mesh is the correct target.

Allow the face mesh and material to be configured explicitly when automatic detection is ambiguous.

Do not apply the uploaded image to every mesh associated with the head. Preserve eyes, hair, teeth, clothing, and other materials unless the model specifically requires a different approach.

If the intended mesh cannot be identified, show a useful development warning and explain how to configure it.

### Safe model handling

GLTF scenes may be cached by the loader.

Avoid destructive mutations of shared scene data.

Clone materials or the relevant model hierarchy when required, and manage cloned resources carefully.

Avoid disposing of shared geometry, textures, or materials still used by the original cached model.

Do not claim the character is ready if loading failed.

## PHASE 5 — IMAGE UPLOAD AND FACE TEXTURE

Allow the user to upload a photo from their device.

Support JPEG, PNG, and WebP.

### Upload requirements

* Provide a clickable file input and drag-and-drop support if practical.
* Display the selected filename and image preview.
* Validate MIME type and file size.
* Set a reasonable default maximum size of 10 MB.
* Display understandable error messages.
* Allow the user to replace or remove the image.
* Keep the original image local to the browser.
* Do not upload it to a server.

Create an object URL with:

`URL.createObjectURL(file)`

Load the image into a Three.js texture using an appropriate browser-compatible texture-loading approach.

Configure the texture appropriately, including:

* `THREE.SRGBColorSpace` for the image color space where appropriate.
* Correct texture orientation.
* `material.map`.
* `material.needsUpdate` when required.
* Appropriate texture filtering and UV settings.

### Texture lifecycle

Implement proper cleanup:

* Revoke obsolete object URLs.
* Dispose of replaced textures when safe.
* Clean up resources when the component unmounts.
* Avoid stale asynchronous image-loading results overwriting newer uploads.
* Handle decoding errors and invalid images.

### Face mapping requirements

A normal photograph cannot automatically become a correctly aligned 3D face just by assigning it to a material.

Inspect the model's UV mapping and existing material setup.

Preserve existing material properties wherever possible, including color, roughness, metalness, and transparency.

Make texture transforms configurable when useful:

* Offset.
* Repeat.
* Rotation.
* Texture scale.

If the model has a separate face mesh, apply the texture only to the correct face material.

If it uses a combined head mesh, determine whether the UV layout supports face-only replacement.

Do not distort or replace the entire head material when the UV layout cannot support the intended effect.

If the supplied model cannot produce a convincing result, explain the limitation and implement the best valid fallback without pretending it is accurate.

Do not claim to perform AI face reconstruction, facial recognition, or automatic 3D head generation.

The feature is image texture mapping, not facial reconstruction.

## PHASE 6 — CHARACTER ANIMATION

Use `useAnimations` from `@react-three/drei`.

The intended animation states are:

* `Idle`
* `HitReaction`
* `Kick`

### Animation initialization

When the character loads:

1. Inspect available animation clips.
2. Identify the expected clips by name.
3. Start Idle if available.
4. Keep the character in a sensible static pose if Idle is missing.
5. Display missing animation information in development mode.

Do not assume that the GLB contains all three animations.

### Hit behavior

When the user clicks Hit:

1. Check that the character is loaded and the action is available.
2. Trigger `HitReaction`.
3. Play `/hit-sound.mp3`.
4. Play the reaction animation once.
5. Detect the end of the animation.
6. Crossfade back to Idle if available.
7. Restore the normal button state.

### Kick behavior

When the user clicks Kick:

1. Trigger `Kick`.
2. Play `/kick-sound.mp3` if the optional asset exists.
3. Play the animation once.
4. Return to Idle when it finishes.

### Animation correctness

Use animation action events or the animation mixer to detect completion.

Use appropriate `LoopOnce`, clamping, and crossfades.

Remove event listeners during cleanup.

Prevent rapid clicks from creating overlapping or broken animation states.

Do not restart Idle while a one-shot animation is playing.

Do not leave the character stuck in an action state when an animation is missing or fails.

If a requested animation is unavailable, disable or clearly mark that action and explain which asset is missing.

A procedural fallback is acceptable only if it produces a real, visible reaction and is documented as a fallback.

Never claim that a missing animation clip has played.

## PHASE 7 — AUDIO

Use the standard browser Audio API or HTMLAudioElement.

Required asset:

`/hit-sound.mp3`

Optional asset:

`/kick-sound.mp3`

Requirements:

* Play the hit sound in response to the Hit button.
* Play the kick sound if the optional file exists.
* Handle rejected playback promises.
* Avoid uncontrolled overlapping playback.
* Support mute/unmute.
* Clean up audio resources where appropriate.
* Do not create audio instances repeatedly during every render.
* Ensure sound playback is initiated by a user interaction where required by browser autoplay policies.

Missing audio files must not crash the application.

Display a small, non-blocking warning when a sound asset is unavailable.

Keep animation and audio logic coordinated but independent enough that an audio failure does not prevent the animation from working.

## PHASE 8 — INTERACTION STATE MANAGEMENT

Implement a clear state model for:

* Asset loading.
* Character readiness.
* Image upload and texture loading.
* Current animation.
* Action-button availability.
* Audio mute state.
* Recoverable errors.

Expected behavior:

* The page initially displays the character in Idle when the necessary assets are available.
* Uploading a photo updates the character's face texture.
* Replacing a photo releases obsolete resources safely.
* Hit triggers HitReaction and the hit sound.
* Kick triggers Kick and the optional kick sound.
* Completed actions return to Idle.
* The camera can be reset to its initial position.
* Missing assets do not cause a blank page or unhandled crash.

Keep React state minimal and avoid unnecessary re-renders of the 3D scene.

Do not create fake progress indicators that never reflect actual work.

## PHASE 9 — RECOMMENDED PROJECT STRUCTURE

Adapt the existing project rather than forcing an unnecessary rewrite.

A reasonable structure is:

* `app/page.jsx`
  Main application and UI state.

* `app/layout.jsx`
  Root layout and metadata.

* `app/globals.css`
  Global styling and any required custom CSS.

* `components/Scene.jsx`
  Canvas, lighting, camera, and OrbitControls.

* `components/Character.jsx`
  GLB loading, face texture application, and animation management.

* `components/ImageUploader.jsx`
  File input, drag-and-drop, validation, and preview.

* `components/ActionControls.jsx`
  Hit, Kick, and mute controls.

* `public/character.glb`
  Required 3D model.

* `public/hit-sound.mp3`
  Required hit sound.

* `public/kick-sound.mp3`
  Optional kick sound.

Create additional utilities only when they improve maintainability.

Keep components small enough to debug independently.

Do not put all the application logic into one enormous component unless the existing project specifically requires a single-file implementation.

## PHASE 10 — ERROR HANDLING

Handle at least these cases:

* Missing GLB file.
* Invalid or unsupported image.
* Oversized image.
* Image decoding failure.
* Missing face mesh.
* Missing animation clip.
* Missing audio file.
* Audio playback rejection.
* Model-loading failure.
* Repeated action clicks.
* Component unmounting during asynchronous work.

Provide useful, human-readable error messages.

Do not display raw stack traces to users.

Use development logs for debugging where appropriate.

Avoid swallowing errors silently.

## PHASE 11 — IMPLEMENTATION AND TESTING WORKFLOW

Execute the work in this order:

1. Inspect the project and its assets.
2. Write a concise checklist of implementation tasks.
3. Verify the installed dependencies and available asset files.
4. Implement the main interface.
5. Implement the 3D scene and model loading.
6. Implement the image-upload workflow.
7. Implement texture mapping and cleanup.
8. Implement Idle, HitReaction, and Kick handling.
9. Implement sound effects and controls.
10. Add responsive styling and accessible interactions.
11. Run linting or the project's available static checks.
12. Run a production build.
13. Fix errors introduced by the implementation.
14. Start the development server if the environment permits.
15. Test the main workflows using available browser or testing tools.
16. Review the console for relevant errors and warnings.
17. Update the implementation checklist based on actual results.

Do not claim a test passed unless you actually ran it.

If a check cannot be executed, state why and provide the exact command the user can run.

Do not delete existing files or overwrite unrelated user work without a clear reason.

## PHASE 12 — ASSET REQUIREMENTS

The application expects:

`public/character.glb`

`public/hit-sound.mp3`

Optional:

`public/kick-sound.mp3`

The GLB model should contain:

* A visible character mesh.
* A suitable face mesh or usable head UV layout.
* An Idle animation, if available.
* A HitReaction animation, if available.
* A Kick animation, if available.

Inspect the model instead of assuming these features exist.

If assets are missing:

1. Clearly list the missing files.
2. Explain the expected model and animation requirements.
3. Implement the application so missing assets are handled gracefully.
4. Use a fallback character or procedural preview only if it can be implemented reliably.
5. Do not invent fake asset files or claim that a fallback is the supplied character model.

Keep asset URLs configurable so that assets can be replaced later without rewriting the application.

## PHASE 13 — COMPLETION REPORT

When implementation is complete, provide a concise report containing:

1. What was implemented.
2. Which files were created or modified.
3. Which dependencies were installed.
4. Which assets are still required.
5. How to start the project.
6. Which tests and build commands were actually executed.
7. Any remaining limitations or known issues.
8. Any manual steps needed to achieve correct face texture mapping.

Use the project's actual package manager when providing commands.

Do not claim that the application is fully functional if essential assets are missing or critical workflows have not been verified.

## FINAL INSTRUCTION

Prioritize a working, maintainable application over an impressive-looking but nonfunctional mockup.

Inspect first. Implement carefully. Test honestly. Fix what you can. Report what remains.

Begin by inspecting the current workspace and proceed through the implementation workflow without waiting for approval at every routine coding step. Ask for clarification only when an essential decision cannot be made safely from the existing project and requirements.

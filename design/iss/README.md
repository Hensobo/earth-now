# ISS 3D model

`web/models/iss.glb` is NASA's official *International Space Station (ISS) (D) (IGOAL)* model from
[nasa/NASA-3D-Resources](https://github.com/nasa/NASA-3D-Resources) (NASA media, no copyright –
see NASA's [usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/)),
reduced for use as a desktop background:

- tiny detail parts (handrails, connectors, small payloads) removed – 412 of 555 parts
- only base colour textures, resized to 512 px (WebP)
- meshopt compression

96 MB / 5.6 M vertices → 6 MB / 0.47 M vertices. The solar array joints (`*_ALPHA_ROT`,
`*_BETA_ROT_*`) are kept, so the arrays can track the sun like the real ones.

Re-create it:

```bash
curl -L -o iss-d.glb "https://raw.githubusercontent.com/nasa/NASA-3D-Resources/master/3D%20Models/International%20Space%20Station%20(ISS)%20(D)%20(IGOAL)/International%20Space%20Station%20(ISS).glb"
npm install @gltf-transform/core@4 @gltf-transform/extensions@4 @gltf-transform/functions@4 meshoptimizer draco3dgltf sharp
node design/iss/optimize.mjs iss-d.glb web/models/iss.glb 0.5 0.002 512
```

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress, meshopt, flatten, join, resample } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';

const [inp, out, ratio = '0.04', error = '0.004', size = '512'] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
});
const doc = await io.read(inp);
// drop tiny detail parts (handrails, connectors, small payloads) – invisible at desktop distance
const DROP = /Details|Handrail|Connector|GITAI|Payload_|STP|ESP\d|ORU|Ikarus|Workstation|CRPCM|Lettering|Antenna|m-NLP|EMIT|i-SEEP/i;
let dropped = 0;
for (const n of doc.getRoot().listNodes()) if (DROP.test(n.getName())) { n.dispose(); dropped++; }
console.log('dropped nodes', dropped);
// keep only base colour: normal / metallic-roughness / occlusion maps are invisible at desktop distance
for (const m of doc.getRoot().listMaterials()) {
  m.setNormalTexture(null); m.setMetallicRoughnessTexture(null); m.setOcclusionTexture(null); m.setEmissiveTexture(null);
}
await MeshoptSimplifier.ready; await MeshoptEncoder.ready;
await doc.transform(
  prune(), dedup(), weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: +ratio, error: +error }),
  prune(),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [+size, +size], quality: 80 }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
await io.write(out, doc);
let v = 0; for (const mesh of doc.getRoot().listMeshes()) for (const p of mesh.listPrimitives()) v += p.getAttribute('POSITION')?.getCount() || 0;
console.log('vertices', v, 'textures', doc.getRoot().listTextures().length, 'meshes', doc.getRoot().listMeshes().length);

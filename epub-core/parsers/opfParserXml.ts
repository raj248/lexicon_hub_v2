import { XMLParser } from 'fast-xml-parser';
import { Metadata, OPFData, Spine } from '../types';

/**
 * @param opfXml The content of the OPF file
 * @param opfPath The full path of the OPF file inside the EPUB
 */
export async function parseOPF(opfXml: string, opfPath: string): Promise<OPFData> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const parsed = parser.parse(opfXml);
  const pkg = parsed.package;
  const metadataXml = pkg.metadata || {};
  const manifestXml = pkg.manifest?.item || [];
  const spineXml = pkg.spine?.itemref || [];

  // Helper to extract text from strings, objects, or arrays
  const extractText = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(extractText).join(', ');
    if (typeof value === 'object' && '#text' in value) return value['#text'];
    return '';
  };

  const extractedMetadata: Metadata = {
    title: extractText(metadataXml['dc:title']),
    language: extractText(metadataXml['dc:language']),
    date: extractText(metadataXml['dc:date']),
    author: extractText(metadataXml['dc:creator']),
    identifier: extractText(metadataXml['dc:identifier']),
    contributor: extractText(metadataXml['dc:contributor']),
    coverImage: undefined,
  };

  // Convert manifest to array and lookup map
  const manifestArray = Array.isArray(manifestXml) ? manifestXml : [manifestXml];
  const manifestMap: Record<string, any> = {};
  manifestArray.forEach((item: any) => {
    if (item.id && item.href) manifestMap[item.id] = item;
  });

  const isValidImage = (href?: string) => href?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  // Convert relative href to absolute path inside EPUB based on OPF location
  // Replace path.dirname + path.join
  const resolveHref = (opfPath: string, href?: string): string | undefined => {
    if (!href) return undefined;

    // Extract OPF folder
    const lastSlashIndex = opfPath.lastIndexOf('/');
    const opfDir = lastSlashIndex >= 0 ? opfPath.slice(0, lastSlashIndex) : '';

    // Combine folder + href
    const combined = opfDir ? `${opfDir}/${href}` : href;

    // Normalize double slashes
    return combined.replace(/\/+/g, '/');
  };

  // 1️⃣ Try <meta name="cover">
  let coverHref: string | undefined;

  // 1️⃣ Try <meta name="cover">
  const metaArray = Array.isArray(metadataXml.meta)
    ? metadataXml.meta
    : metadataXml.meta
      ? [metadataXml.meta]
      : [];
  const coverMeta = metaArray.find((m: any) => m?.name === 'cover');

  if (coverMeta?.content) {
    // Try lookup by ID first (old way)
    if (manifestMap[coverMeta.content]?.href) {
      coverHref = manifestMap[coverMeta.content].href;
    } else {
      // Fallback: treat it as a relative href path directly
      coverHref = coverMeta.content;
    }
  }

  // 2️⃣ Fallback to common IDs
  if (!isValidImage(coverHref)) {
    for (const id of ['cover', 'cover-image']) {
      if (manifestMap[id]?.href && isValidImage(manifestMap[id].href)) {
        coverHref = manifestMap[id].href;
        break;
      }
    }
  }

  // 3️⃣ Fallback to properties="cover-image"
  if (!isValidImage(coverHref)) {
    const coverItem = manifestArray.find((item: any) => item.properties === 'cover-image');
    if (coverItem?.href && isValidImage(coverItem.href)) coverHref = coverItem.href;
  }

  // 4️⃣ Fallback: find item in manifest whose ID looks like an image file
  if (!isValidImage(coverHref)) {
    const coverById = manifestArray.find(
      (item: any) => typeof item.id === 'string' && isValidImage(item.id)
    );
    if (coverById?.href) coverHref = coverById.href;
  }

  // 5️⃣ Fallback: first image in manifest
  if (!isValidImage(coverHref)) {
    const firstImage = manifestArray.find((item: any) => isValidImage(item.href));
    if (firstImage?.href) coverHref = firstImage.href;
  }

  if (isValidImage(coverHref)) extractedMetadata.coverImage = resolveHref(opfPath, coverHref);

  // Build spine
  const spineArray = Array.isArray(spineXml) ? spineXml : [spineXml];
  const spine: Spine[] = spineArray
    .map((itemref: any) =>
      itemref.idref && manifestMap[itemref.idref]
        ? {
            ...manifestMap[itemref.idref],
            href: resolveHref(opfPath, manifestMap[itemref.idref].href),
          }
        : null
    )
    .filter(Boolean);

  return { metadata: extractedMetadata, spine };
}

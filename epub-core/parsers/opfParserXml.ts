import { XMLParser } from 'fast-xml-parser';
import { Metadata, OPFData, Spine } from '../types';

export async function parseOPF(opfXml: string): Promise<OPFData> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const parsed = parser.parse(opfXml);
  const pkg = parsed.package;
  const metadataXml = pkg.metadata || {};
  const manifestXml = pkg.manifest?.item || [];
  const spineXml = pkg.spine?.itemref || [];

  // Extract metadata
  const extractedMetadata: Metadata = {
    title: metadataXml['dc:title'] || '',
    language: metadataXml['dc:language'] || '',
    date: metadataXml['dc:date'] || '',
    author: metadataXml['dc:creator'] || '',
    identifier: metadataXml['dc:identifier'] || '',
    contributor: metadataXml['dc:contributor'] || undefined,
    coverImage: undefined,
  };

  // Helper functions
  const isValidImage = (filePath?: string) =>
    filePath ? /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath) : false;

  const formatCoverPath = (filePath?: string): string | undefined => {
    if (!filePath) return undefined;
    const fileName = filePath.split('/').pop();
    return fileName ? `OEBPS/Images/${fileName}` : undefined;
  };

  // Convert manifest to a lookup map
  const manifestArray = Array.isArray(manifestXml) ? manifestXml : [manifestXml];
  const manifestMap: Record<string, { id: string; href: string; properties?: string }> = {};
  manifestArray.forEach((item: any) => {
    if (item.id && item.href) {
      manifestMap[item.id] = item;
    }
  });

  // Cover detection
  let coverHref: string | undefined;

  // Step 1: <meta name="cover">
  const metaArray = Array.isArray(metadataXml.meta) ? metadataXml.meta : [metadataXml.meta];
  const coverMeta = metaArray.find((m: any) => m?.name === 'cover');
  if (coverMeta && coverMeta.content) {
    coverHref = manifestMap[coverMeta.content]?.href;
  }

  // Step 2–4: fallback options
  const fallbackIds = ['cover', 'cover-image'];
  if (!isValidImage(coverHref)) {
    for (const id of fallbackIds) {
      if (manifestMap[id]?.href && isValidImage(manifestMap[id].href)) {
        coverHref = manifestMap[id].href;
        break;
      }
    }
  }

  // Step 5: check properties="cover-image"
  if (!isValidImage(coverHref)) {
    const coverProp = manifestArray.find((item: any) => item.properties === 'cover-image');
    if (coverProp && isValidImage(coverProp.href)) {
      coverHref = coverProp.href;
    }
  }

  if (isValidImage(coverHref)) {
    extractedMetadata.coverImage = formatCoverPath(coverHref);
  }

  // Build spine
  const spineArray = Array.isArray(spineXml) ? spineXml : [spineXml];
  const spine: Spine[] =
    spineArray ??
    []
      .map((itemref: any) => {
        const idref = itemref.idref;
        return idref && manifestMap[idref] ? manifestMap[idref] : null;
      })
      .filter((chapter: any) => chapter !== null);

  return { metadata: extractedMetadata, spine };
}

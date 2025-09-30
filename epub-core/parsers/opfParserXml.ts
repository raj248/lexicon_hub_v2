import { XMLParser } from 'fast-xml-parser';
import { Metadata, OPFData, Spine } from '../types';

export async function parseOPF(opfXml: string, opfPath: string): Promise<OPFData> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const parsed = parser.parse(opfXml);
  const pkg = parsed.package;

  const metadataXml = pkg.metadata || {};
  const manifestXml = pkg.manifest?.item || [];
  const spineXml = pkg.spine?.itemref || [];

  // --- Extract metadata ---
  const extractText = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object') return value['#text'] ?? '';
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

  // --- Get unique-identifier ---
  let uniqueIdentifier: string | undefined;
  const uidAttr = pkg['unique-identifier'];
  if (uidAttr) {
    // uidAttr is the id of the identifier element, e.g., "BookId"
    const idMap = metadataXml['dc:identifier'];
    if (Array.isArray(idMap)) {
      // multiple <dc:identifier> elements
      const uidElement = idMap.find((el: any) => el?.id === uidAttr);
      uniqueIdentifier = extractText(uidElement);
    } else if (idMap && idMap.id === uidAttr) {
      uniqueIdentifier = extractText(idMap);
    }
  }

  extractedMetadata.identifier = uniqueIdentifier || extractedMetadata.identifier;

  const manifestArray = [].concat(manifestXml || []);
  const metaArray = [].concat(metadataXml.meta || []);
  const spineArray = [].concat(spineXml || []);

  const isValidImage = (href?: string) => href?.match(/\.(jpg|jpeg|png|gif|webp)$/i);

  const resolveHref = (href?: string) => {
    if (!href) return undefined;
    const lastSlash = opfPath.lastIndexOf('/');
    const opfDir = lastSlash >= 0 ? opfPath.slice(0, lastSlash) : '';
    return (opfDir ? `${opfDir}/${href}` : href).replace(/\/+/g, '/');
  };

  // --- Build manifest map with absolute hrefs ---
  const manifestMap: Record<string, any> = {};
  manifestArray.forEach((item: any) => {
    if (item.id && item.href) {
      manifestMap[item.id] = { ...item, absoluteHref: resolveHref(item.href) };
    }
  });

  // --- Cover selection ---
  // --- Cover selection ---
  let coverHref: string | undefined;
  const coverMeta = metaArray.find((m: any) => m?.name === 'cover');

  if ((coverMeta as any)?.content) {
    // 1️⃣ If content is an ID in manifest
    if (manifestMap[(coverMeta as any).content]?.absoluteHref) {
      coverHref = manifestMap[(coverMeta as any).content].absoluteHref;
    }
    // 2️⃣ Fallback: treat content as relative href
    else if (isValidImage((coverMeta as any).content)) {
      coverHref = resolveHref((coverMeta as any).content);
    }
  }

  // --- Other fallbacks if coverHref not found ---
  if (!isValidImage(coverHref)) {
    const candidates = [
      manifestMap['cover'],
      manifestMap['cover-image'],
      manifestArray.find((item: any) => item.properties === 'cover-image'),
      manifestArray.find((item: any) => typeof item.id === 'string' && isValidImage(item.id)),
    ].filter(Boolean);

    if (candidates.length > 0) {
      coverHref = candidates[0].absoluteHref ?? candidates[0].href;
    }
  }

  // --- LAST fallback: first image in manifest ---
  if (!isValidImage(coverHref)) {
    const firstImage = manifestArray.find((item: any) => isValidImage(item.href));
    if ((firstImage as any)?.href) {
      coverHref = resolveHref((firstImage as any).href);
    }
  }

  if (isValidImage(coverHref)) extractedMetadata.coverImage = coverHref;

  // --- Build spine ---
  const spine: Spine[] = spineArray
    .map((itemref: any) => {
      const idref = itemref.idref;
      if (idref && manifestMap[idref]?.absoluteHref) {
        return { id: idref, href: manifestMap[idref].absoluteHref };
      }
      return null;
    })
    .filter(Boolean) as Spine[];

  return { metadata: extractedMetadata, spine };
}

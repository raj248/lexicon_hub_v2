import { XMLParser } from 'fast-xml-parser';
import { TocEntry } from '../types';

export async function parseTOC(tocXml: string): Promise<TocEntry[]> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
  });

  const parsed = parser.parse(tocXml);

  // Ensure navMap.navPoint is always an array
  const navPointsRaw = parsed?.ncx?.navMap?.navPoint;
  const navPoints = Array.isArray(navPointsRaw) ? navPointsRaw : navPointsRaw ? [navPointsRaw] : [];

  const chapters: TocEntry[] = navPoints.map((navPoint: any) => {
    const id = navPoint.id || '';
    const title = navPoint.navLabel?.text?.trim() || '';
    const href = navPoint.content?.src || '';

    return { id, title, href };
  });

  return chapters;
}

import cheerio from 'react-native-cheerio';
import { TocEntry } from '../types';

export async function parseTOC(tocXml: string): Promise<TocEntry[]> {
  const $ = cheerio.load(tocXml, { xmlMode: true });

  const chapters = $('navMap > navPoint')
    .map((_: any, el: any) => {
      const id = $(el).attr('id') || '';
      const title = $(el).find('navLabel > text').text().trim();
      const href = $(el).find('content').attr('src') || '';

      return { id, title, href };
    })
    .get();

  return chapters;
}

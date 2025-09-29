import cheerio from "react-native-cheerio";
import { Metadata, OPFData, Spine } from "../types"

export async function parseOPF(opfXml: string): Promise<OPFData> {
  const $ = cheerio.load(opfXml, { xmlMode: true });

  // Extract metadata
  const extractedMetadata: Metadata = {
    title: $("metadata > dc\\:title").text() || "",
    language: $("metadata > dc\\:language").text() || "",
    date: $("metadata > dc\\:date").text() || "",
    author: $("metadata > dc\\:creator").text() || "",
    identifier: $("metadata > dc\\:identifier").text() || "",
    contributor: $("metadata > dc\\:contributor").text() || undefined,
    coverImage: undefined,

  };
  // Helper function to check if a file is an image
  function isValidImage(filePath?: string): boolean {
    return filePath ? /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath) : false;
  }
  function formatCoverPath(filePath?: string): string | undefined {
    if (!filePath) return undefined;
    const fileName = filePath.split("/").pop(); // Extracts filename from path
    return fileName ? `OEBPS/Images/${fileName}` : undefined;
  }

  // Step 1: Try <meta name="cover">
  let coverId = $("metadata > meta[name='cover']").attr("content");
  let coverHref = coverId ? $(`manifest > item[id='${coverId}']`).attr("href") : undefined;

  // Step 2: If not found or invalid, check id="cover"
  if (!isValidImage(coverHref)) {
    coverHref = $("manifest > item[id='cover']").attr("href");
  }

  // Step 3: If still not valid, check id="cover-image"
  if (!isValidImage(coverHref)) {
    coverHref = $("manifest > item[id='cover-image']").attr("href");
  }

  // Step 4: If still not valid, check properties="cover-image"
  if (!isValidImage(coverHref)) {
    coverHref = $("manifest > item[properties='cover-image']").attr("href");
  }

  // Step 5: Assign cover image if a valid image was found
  if (isValidImage(coverHref)) {
    extractedMetadata.coverImage = formatCoverPath(coverHref);
  }

  // Convert manifest to a lookup table
  const manifestMap: Record<string, { id: string; href: string }> = {};
  $("manifest > item").each((_: any, el: any) => {
    const id = $(el).attr("id");
    const href = $(el).attr("href");
    if (id && href) {
      manifestMap[id] = { id, href };
    }
  });

  // Extract chapters in the order defined by <spine>
  const spine: Spine[] = $("spine > itemref")
    .map((_: any, el: any) => {
      const idref = $(el).attr("idref") || "";
      return manifestMap[idref] || null;
    })
    .get()
    .filter((chapter: any) => chapter !== null);


  return { metadata: extractedMetadata, spine };
}

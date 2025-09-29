import { readFileFromZip } from "~/modules/FileUtil";
/**
 * Extracts the OPF file path from an EPUB file.
 * @param epubPath The path to the EPUB file.
 * @returns The OPF file path inside the EPUB ZIP.
 */
export async function findOpfPath(zipPath: string): Promise<string | null> {
  try {
    const containerXml = await readFileFromZip(zipPath, "META-INF/container.xml");
    if (!containerXml) {
      throw new Error("META-INF/container.xml not found");
    }

    // Extract OPF path using regex
    const match = containerXml.match(/full-path="([^"]+)"/);
    if (match && match[1]) {
      return match[1]; // Found the OPF file path
    } else {
      throw new Error("OPF file path not found in container.xml");
    }
  } catch (error) {
    console.error("Error finding OPF path:", error);
    return null;
  }
}
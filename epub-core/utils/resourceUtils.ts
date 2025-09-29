import { readFileFromZip } from '~/modules/FileUtil';
import * as FileSystem from 'expo-file-system';
import { SaveFormat, ImageManipulator } from 'expo-image-manipulator';

const CACHE_DIR = `${FileSystem.cacheDirectory}epub_resources/`;

import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export async function extractAndRewriteImages(
  htmlContent: string,
  resources: Record<string, string>
): Promise<string> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseTagValue: false,
    parseAttributeValue: false,
  });

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    format: true,
  });

  const parsed = parser.parse(`<root>${htmlContent}</root>`); // wrap to ensure single root

  // Recursive function to traverse and rewrite
  function traverse(node: any): any {
    if (!node || typeof node !== 'object') return node;

    // If this node is svg, replace with <img> if possible
    if (node.svg) {
      const svgNode = node.svg;
      const imageNode = svgNode.image || svgNode['xlink:image'];
      let src: string | undefined;

      if (imageNode) {
        src = imageNode.href || imageNode['xlink:href'];
      }

      if (src) {
        const extension = src.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType =
          extension === 'png'
            ? 'image/png'
            : extension === 'jpg' || extension === 'jpeg'
              ? 'image/jpeg'
              : 'application/octet-stream';

        const base64 = resources[src] || '';
        const imgTag = {
          img: {
            '@_src': `data:${mimeType};base64,${base64}`,
            '@_style': 'width: 100%; display: block;',
          },
        };
        return imgTag; // replace svg node with img
      }
    }

    // If this node is img, replace src if in resources
    if (node.img) {
      const src = node.img['@_src'];
      if (src && resources[src]) {
        const extension = src.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType =
          extension === 'png'
            ? 'image/png'
            : extension === 'jpg' || extension === 'jpeg'
              ? 'image/jpeg'
              : 'application/octet-stream';

        node.img['@_src'] = `data:${mimeType};base64,${resources[src]}`;
      }
    }

    // Recurse for all child nodes
    for (const key of Object.keys(node)) {
      if (Array.isArray(node[key])) {
        node[key] = node[key].map(traverse);
      } else if (typeof node[key] === 'object') {
        node[key] = traverse(node[key]);
      }
    }

    return node;
  }

  const rewritten = traverse(parsed);

  // Build HTML and strip the artificial <root> wrapper
  let htmlOutput = builder.build(rewritten);
  htmlOutput = htmlOutput.replace(/^<root>/, '').replace(/<\/root>$/, '');

  return htmlOutput;
}

export async function extractResourceBase64(
  zipPath: string,
  content: string,
  basePath: string
): Promise<Record<string, string>> {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    parseTagValue: false,
    parseAttributeValue: false,
  });

  const parsed = parser.parse(`<root>${content}</root>`); // wrap for single root

  const resourcePaths: Set<string> = new Set();

  // Recursive function to traverse the node tree
  function traverse(node: any) {
    if (!node || typeof node !== 'object') return;

    for (const key of Object.keys(node)) {
      const child = node[key];

      if (Array.isArray(child)) {
        child.forEach(traverse);
      } else if (typeof child === 'object') {
        // Extract relevant attributes
        const attrs = child['@_src'] || child['@_href'] || child['@_xlink:href'];
        if (attrs && typeof attrs === 'string' && attrs.trim().length > 0) {
          resourcePaths.add(attrs);
        }

        traverse(child);
      }
    }
  }

  traverse(parsed);

  console.log('Resource paths:', Array.from(resourcePaths));

  const resourceBase64Map: Record<string, string> = {};

  // Read each resource from the ZIP
  for (const path of resourcePaths) {
    const pathsToTry = [path.replace('..', 'OEBPS'), path, `OEBPS/${path}`, basePath + path].filter(
      (p) => p.trim().length > 0
    );

    for (const tryPath of pathsToTry) {
      try {
        console.log('Trying path:', tryPath);
        const base64Data = await readFileFromZip(zipPath, tryPath, 'base64');
        if (base64Data) {
          resourceBase64Map[path] = base64Data;
          break; // stop trying once successful
        }
      } catch (error) {
        console.warn(`Failed to read: ${tryPath}, trying next...`);
      }
    }
  }

  return resourceBase64Map;
}

export async function clearCacheFolder(folderPath: string) {
  const files = await FileSystem.readDirectoryAsync(folderPath);
  for (const file of files) {
    await FileSystem.deleteAsync(`${folderPath}${file}`);
  }
}

package expo.modules.fileutil

import android.Manifest
import android.os.Build
import android.os.Environment
import android.content.pm.PackageManager
import android.provider.Settings
import android.net.Uri
import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import android.util.Log
import java.net.URL
import java.io.*
import java.util.zip.ZipEntry
import java.util.zip.ZipFile
import android.util.Base64
import java.io.ByteArrayOutputStream
import org.jsoup.Jsoup

import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.FileOutputStream


class FileUtilModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FileUtil")

    AsyncFunction("RequestStoragePermission") { promise: Promise ->
      val activity = appContext.currentActivity ?: run {
        promise.reject("E_NO_ACTIVITY", "No current activity", null)
        return@AsyncFunction
      }

      when {
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.R -> {
          if (Environment.isExternalStorageManager()) {
            promise.resolve(true)
          } else {
            val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION).apply {
              data = Uri.parse("package:${activity.packageName}")
            }
            activity.startActivityForResult(intent, 1)
            promise.resolve(false)
          }
        }
        ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED -> {
          promise.resolve(true)
        }
        else -> {
          activity.requestPermissions(arrayOf(Manifest.permission.READ_EXTERNAL_STORAGE), 1)
          promise.resolve(false)
        }
      }
    }

    AsyncFunction("ScanFiles") { promise: Promise ->
      val storageDir = Environment.getExternalStorageDirectory()
      val epubFiles = mutableListOf<String>()

      fun scanDirectory(directory: File) {
        directory.listFiles()?.forEach { file ->
          if (file.isDirectory) {
            scanDirectory(file)
          } else if (file.extension.equals("epub", ignoreCase = true)) {
            epubFiles.add(file.absolutePath)
          }
        }
      }

      scanDirectory(storageDir)
      promise.resolve(epubFiles)
    }

    AsyncFunction("readFileFromZip") { zipPath: String, filePathInZip: String, type: String, promise: Promise ->
      try {
          val zipFile = ZipFile(zipPath)
          val entry: ZipEntry? = zipFile.getEntry(filePathInZip)

          if (entry == null) {
              promise.reject("E_FILE_NOT_FOUND", "File $filePathInZip not found in ZIP.", null)
              zipFile.close()
              return@AsyncFunction
          }

          val inputStream = zipFile.getInputStream(entry)

          val result: String = if (type == "base64") {
              // Read as binary and convert to Base64
              val outputStream = ByteArrayOutputStream()
              inputStream.copyTo(outputStream)
              val byteArray = outputStream.toByteArray()
              Base64.encodeToString(byteArray, Base64.NO_WRAP)
          } else {
              // Read as plain text
              inputStream.bufferedReader().use { it.readText() }
          }

          zipFile.close()
          promise.resolve(result)
      } catch (e: Exception) {
          promise.reject("E_READ_FAILED", "Failed to read file from ZIP: ${e.message}", e)
      }
    }

    AsyncFunction("readChapterFromZip") {zipPath: String, filePathInZip: String, promise: Promise ->
      try {
          val zipFile = ZipFile(zipPath)
          val entry: ZipEntry? = zipFile.getEntry(filePathInZip)

          if (entry == null) {
              promise.reject("E_FILE_NOT_FOUND", "File $filePathInZip not found in ZIP.", null)
              zipFile.close()
              return@AsyncFunction
          }

          val inputStream = zipFile.getInputStream(entry)
          val html = inputStream.bufferedReader().use { it.readText() }
          zipFile.close()

          // Extract only <body> using Jsoup
          val document = Jsoup.parse(html)
          val body = document.body().html()

          // Minify HTML (removes newlines, extra spaces)
          val minifiedBody = body.replace(Regex("\\s+"), " ").trim()

          promise.resolve(minifiedBody)
      } catch (e: Exception) {
        promise.reject("E_READ_FAILED", "Failed to read chapter from ZIP: ${e.message}", e)
      }
    }

    AsyncFunction("parseOPFFromBook") { epubPath: String, promise: Promise ->
      try {
        val zipFile = ZipFile(epubPath)

        // --- Step 1: Find OPF ---
        val containerEntry = zipFile.getEntry("META-INF/container.xml")
          ?: run { zipFile.close(); promise.reject("E_NO_CONTAINER", "META-INF/container.xml not found", null); return@AsyncFunction }

        val containerXml = zipFile.getInputStream(containerEntry).bufferedReader().use { it.readText() }
        val opfPathRegex = """full-path="([^"]+)""".toRegex()
        val opfPath = opfPathRegex.find(containerXml)?.groups?.get(1)?.value

        if (opfPath == null) { zipFile.close(); promise.reject("E_NO_OPF", "OPF path not found", null); return@AsyncFunction }

        val opfEntry = zipFile.getEntry(opfPath)
          ?: run { zipFile.close(); promise.reject("E_OPF_NOT_FOUND", "OPF file not found", null); return@AsyncFunction }

        val opfXml = zipFile.getInputStream(opfEntry).bufferedReader().use { it.readText() }

        val lastSlash = opfPath.lastIndexOf('/')
        val opfDir = if (lastSlash >= 0) opfPath.substring(0, lastSlash) else ""

        // --- Step 2: Parse OPF ---
        val factory = XmlPullParserFactory.newInstance()
        val parser = factory.newPullParser()
        parser.setInput(opfXml.reader())

        var eventType = parser.eventType
        var currentTag: String? = null

        var metadataTitle: String? = null
        var metadataAuthor: String? = null
        var metadataLanguage: String? = null
        var metadataDate: String? = null
        var metadataIdentifier: String? = null
        var metadataContributor: String? = null
        var coverHref: String? = null
        var uniqueIdentifierId: String? = null
        var tocHref: String? = null

        data class ManifestItem(
          val id: String?,
          val href: String?,
          val properties: String?,
          val absoluteHref: String
        )

        val manifestList = mutableListOf<ManifestItem>()
        val metaList = mutableListOf<Pair<String, String>>() // name -> content
        val manifestMap = mutableMapOf<String, ManifestItem>()
        val spineList = mutableListOf<Map<String, String>>()
        val textBuffer = StringBuilder()
        var inSpine = false

        // Store all identifiers by id
        val identifierMap = mutableMapOf<String, String>()
        var currentIdentifierId: String? = null

        while (eventType != XmlPullParser.END_DOCUMENT) {
          when (eventType) {
            XmlPullParser.START_TAG -> {
              currentTag = parser.name
              textBuffer.clear()
              when (currentTag) {
                "package" -> {
                  uniqueIdentifierId = parser.getAttributeValue(null, "unique-identifier")
                  // Log.d("FileUtil", "uniqueIdentifierId: $uniqueIdentifierId")
                }
                "item" -> {
                  val id = parser.getAttributeValue(null, "id")
                  val href = parser.getAttributeValue(null, "href")
                  val properties = parser.getAttributeValue(null, "properties")
                  if (href != null) {
                    val absoluteHref = if (opfDir.isNotEmpty()) "$opfDir/$href" else href
                    val item = ManifestItem(id, href, properties, absoluteHref.replace(Regex("/+"), "/"))
                    manifestList.add(item)
                    if (id != null) manifestMap[id] = item
                  }
                }
                "itemref" -> {
                  if (inSpine) {
                    val idref = parser.getAttributeValue(null, "idref")
                    if (idref != null) {
                      spineList.add(
                        mapOf(
                          "id" to idref,
                          "href" to (manifestMap[idref]?.absoluteHref ?: idref)
                        )
                      )
                    }
                  }
                }
                "spine" -> { inSpine = true }
                "meta" -> {
                  val nameAttr = parser.getAttributeValue(null, "name")
                  val contentAttr = parser.getAttributeValue(null, "content")
                  if (nameAttr != null && contentAttr != null) {
                    metaList.add(nameAttr to contentAttr)
                  }
                }
                "dc:identifier" -> {
                  currentIdentifierId = parser.getAttributeValue(null, "id")
                }
              }
            }
            XmlPullParser.TEXT -> textBuffer.append(parser.text)
            XmlPullParser.END_TAG -> {
              when (parser.name) {
                "dc:title" -> metadataTitle = textBuffer.toString().trim()
                "dc:creator" -> metadataAuthor = textBuffer.toString().trim()
                "dc:language" -> metadataLanguage = textBuffer.toString().trim()
                "dc:date" -> metadataDate = textBuffer.toString().trim()
                "dc:identifier" -> {
                    val value = textBuffer.toString().trim()
                    // Log.d("FileUtil", "identifier value: $value and id: $currentIdentifierId")
                    if (currentIdentifierId != null && value.isNotEmpty()) {
                        identifierMap[currentIdentifierId!!] = value
                    } else if (value.isNotEmpty()) {
                        // fallback for identifiers without id
                        identifierMap["__no_id__${identifierMap.size}"] = value
                    }
                    currentIdentifierId = null // reset tracking id
                }
                "dc:contributor" -> metadataContributor = textBuffer.toString().trim()
              }
              textBuffer.clear()
              currentTag = null
            }
          }
          eventType = parser.next()
        }

        // Pick identifier using unique-identifier attribute if available
        metadataIdentifier = if (uniqueIdentifierId != null) {
            identifierMap[uniqueIdentifierId] ?: identifierMap.values.firstOrNull()
        } else {
            identifierMap.values.firstOrNull()
        }

        // Step 2b: Find TOC href
        // tocHref = manifestList.find { it.properties?.contains("nav") == true }?.absoluteHref
        //     ?: manifestList.find { it.href?.endsWith(".ncx", ignoreCase = true) == true }?.absoluteHref

        tocHref = manifestList.find { it.href?.endsWith(".ncx", ignoreCase = true) == true }?.absoluteHref
            ?: manifestList.find { it.properties?.contains("nav") == true }?.absoluteHref


        // Log.d("FileUtil", "uniqueIdentifierId value: $metadataIdentifier")
        // --- Step 3: Resolve cover image with JS-style fallbacks ---
        fun isValidImage(href: String?) = href?.matches(Regex(""".*\.(jpg|jpeg|png|gif|webp)$""", RegexOption.IGNORE_CASE)) == true

        // 1️⃣ meta[name=cover]
        val coverMeta = metaList.find { it.first == "cover" }
        coverHref = coverMeta?.let { (_, content) ->
          manifestMap[content]?.absoluteHref ?: if (isValidImage(content)) "$opfDir/$content" else null
        }

        // 2️⃣ fallback candidates
        if (!isValidImage(coverHref)) {
          val candidates = listOfNotNull(
            manifestMap["cover"]?.absoluteHref,
            manifestMap["cover-image"]?.absoluteHref,
            manifestList.find { it.properties == "cover-image" }?.absoluteHref,
            manifestList.find { it.id?.let { isValidImage(it) } == true }?.absoluteHref
          )
          if (candidates.isNotEmpty()) coverHref = candidates[0]
        }

        // 2️⃣b additional fallback: id = "Cover.[ext]"
        if (!isValidImage(coverHref)) {
          val coverIdItem = manifestList.find {
            it.id?.matches(Regex("""Cover\.(jpg|jpeg|png|gif|webp)""", RegexOption.IGNORE_CASE)) == true
          }
          if (coverIdItem != null) coverHref = coverIdItem.absoluteHref
        }

        // 3️⃣ last fallback: first image in manifest
        if (!isValidImage(coverHref)) {
          coverHref = manifestList.find { isValidImage(it.href) }?.absoluteHref
        }
        val bookFileName = epubPath.substringAfterLast("/").substringBeforeLast(".")
        val baseDir = "/data/user/0/com.hub.lexicon/cache/$bookFileName"

        val opfData = mapOf(
          "metadata" to mapOf(
            "title" to (metadataTitle ?: ""),
            "author" to (metadataAuthor ?: ""),
            "language" to (metadataLanguage ?: ""),
            "date" to (metadataDate ?: ""),
            "identifier" to (metadataIdentifier ?: ""),
            "contributor" to (metadataContributor ?: ""),
            "coverImage" to (coverHref ?: ""),
            "toc" to (tocHref ?: "")
          ),
          "spine" to spineList,
          "baseDir" to baseDir
        )

        promise.resolve(opfData)
        zipFile.close()
      } catch (e: Exception) {
        promise.reject("E_OPF_PARSE_FAILED", "Failed to parse OPF: ${e.message}", e)
      }
    }
    
    AsyncFunction("optimizeCoverImage") { epubPath: String, coverPathInZip: String, promise: Promise ->
      try {
        val zipFile = ZipFile(epubPath)
        val entry: ZipEntry? = zipFile.getEntry(coverPathInZip)

        if (entry == null) {
          zipFile.close()
          promise.reject("E_COVER_NOT_FOUND", "Cover image not found in EPUB.", null)
          return@AsyncFunction
        }

        val inputStream = zipFile.getInputStream(entry)

        // Decode image
        val originalBitmap = BitmapFactory.decodeStream(inputStream)
        inputStream.close()
        zipFile.close()

        if (originalBitmap == null) {
          promise.reject("E_DECODE_FAILED", "Failed to decode cover image.", null)
          return@AsyncFunction
        }

        // Resize (keep aspect ratio, max width 512px for example)
        val maxWidth = 512
        val scale = if (originalBitmap.width > maxWidth) {
          maxWidth.toFloat() / originalBitmap.width.toFloat()
        } else 1f

        val targetWidth = (originalBitmap.width * scale).toInt()
        val targetHeight = (originalBitmap.height * scale).toInt()
        val resizedBitmap = Bitmap.createScaledBitmap(originalBitmap, targetWidth, targetHeight, true)

        // Save to cache dir
        val cacheDir = appContext.cacheDirectory ?: throw Exception("No cache directory available")

        // Extract just the filename (without directories)
        val originalName = epubPath.substringAfterLast("/")
        // Remove extension
        val baseName = originalName.substringBeforeLast(".")
        // Sanitize
        val safeBaseName = baseName.replace(Regex("[^A-Za-z0-9._-]"), "_")

        // Final filename: cover_[filename].jpg
        val outFile = File(cacheDir, "cover_${safeBaseName}.jpg")

        FileOutputStream(outFile).use { out ->
          resizedBitmap.compress(Bitmap.CompressFormat.JPEG, 80, out) // compress at 80% quality
        }

        resizedBitmap.recycle()
        if (resizedBitmap != originalBitmap) originalBitmap.recycle()

        // Return path
        promise.resolve(outFile.absolutePath)

      } catch (e: Exception) {
        promise.reject("E_OPTIMIZE_FAILED", "Failed to optimize cover image: ${e.message}", e)
      }
    }

    AsyncFunction("prepareChapter") { epubPath: String, chapterHref: String, promise: Promise ->
        try {
            // Create cache dir based on EPUB filename (without extension)
            val cacheDir = File(
                appContext.cacheDirectory,
                epubPath.substringAfterLast("/").substringBeforeLast(".")
            )
            if (!cacheDir.exists()) cacheDir.mkdirs()

            // Cached chapter file path
            val cachedChapterFile = File(cacheDir, chapterHref)

            // ✅ Early return if chapter is already cached
            if (cachedChapterFile.exists()) {
                Log.d("FileUtil", "Chapter is already cached: ${cachedChapterFile.absolutePath}")
                promise.resolve(cachedChapterFile.absolutePath)
                return@AsyncFunction
            }

            // Otherwise, extract from zip
            val zipFile = ZipFile(epubPath)
            val entry: ZipEntry? = zipFile.getEntry(chapterHref)

            if (entry == null) {
                zipFile.close()
                promise.reject("E_CHAPTER_NOT_FOUND", "Chapter $chapterHref not found in EPUB.", null)
                return@AsyncFunction
            }

            val chapterHtml = zipFile.getInputStream(entry).bufferedReader().use { it.readText() }
            val doc = Jsoup.parse(chapterHtml)

            // --- Handle images ---
            doc.select("img").forEach { img ->
                val src = img.attr("src")
                if (src.isNotEmpty()) {
                    val chapterDir = File(chapterHref).parentFile
                    val resourcePath = File(chapterDir, src).normalize().path
                    val resourceEntry = zipFile.getEntry(resourcePath)

                    if (resourceEntry != null) {
                        val resourceBytes = zipFile.getInputStream(resourceEntry).readBytes()
                        val targetFile = File(cacheDir, resourcePath)
                        targetFile.parentFile?.mkdirs()
                        targetFile.writeBytes(resourceBytes)
                        img.attr("src", "file://${targetFile.absolutePath}")
                    }
                }
            }

            // --- Handle CSS ---
            doc.select("link[rel=stylesheet]").forEach { link ->
                val href = link.attr("href")
                if (href.isNotEmpty()) {
                    val resourceZipPath = File(chapterHref).parent + "/" + href
                    val resourceEntry = zipFile.getEntry(resourceZipPath)
                    if (resourceEntry != null) {
                        val resourceBytes = zipFile.getInputStream(resourceEntry).readBytes()
                        val targetFile = File(cacheDir, resourceZipPath)
                        targetFile.parentFile?.mkdirs()
                        targetFile.writeBytes(resourceBytes)
                        link.attr("href", "file://${targetFile.absolutePath}")
                    }
                }
            }

            // --- Handle JS (if any) ---
            doc.select("script[src]").forEach { script ->
                val src = script.attr("src")
                if (src.isNotEmpty()) {
                    val resourceZipPath = File(chapterHref).parent + "/" + src
                    val resourceEntry = zipFile.getEntry(resourceZipPath)
                    if (resourceEntry != null) {
                        val resourceBytes = zipFile.getInputStream(resourceEntry).readBytes()
                        val targetFile = File(cacheDir, resourceZipPath)
                        targetFile.parentFile?.mkdirs()
                        targetFile.writeBytes(resourceBytes)
                        script.attr("src", "file://${targetFile.absolutePath}")
                    }
                }
            }

            // --- Save rewritten chapter to cache ---
            cachedChapterFile.parentFile?.mkdirs()
            cachedChapterFile.writeText(doc.outerHtml())

            zipFile.close()
            promise.resolve(cachedChapterFile.absolutePath)

        } catch (e: Exception) {
            promise.reject("E_PREPARE_CHAPTER_FAILED", "Failed to prepare chapter: ${e.message}", e)
        }
    }

    AsyncFunction("parseTOC") { epubPath: String, tocHref: String, promise: Promise ->
        val zipFile = ZipFile(epubPath)

      // --- Step 1: Find OPF ---
        val containerEntry = zipFile.getEntry("META-INF/container.xml")
          ?: run { zipFile.close(); promise.reject("E_NO_CONTAINER", "META-INF/container.xml not found", null); return@AsyncFunction }

        val containerXml = zipFile.getInputStream(containerEntry).bufferedReader().use { it.readText() }
        val opfPathRegex = """full-path="([^"]+)""".toRegex()
        val opfPath = opfPathRegex.find(containerXml)?.groups?.get(1)?.value
        Log.d("FileUtil", "opfPath: $opfPath")

        if (opfPath == null) { zipFile.close(); promise.reject("E_NO_OPF", "OPF path not found", null); return@AsyncFunction }

        val lastSlash = opfPath.lastIndexOf('/')
        val opfDir = if (lastSlash >= 0) opfPath.substring(0, lastSlash) else ""

        try {
            val chapters = if (tocHref.lowercase().endsWith(".ncx")) {
                parseNCX(epubPath, tocHref)
            } else {
                parseNavXHTML(epubPath, tocHref, opfDir)
            }
            promise.resolve(chapters) // chapters is List<Map<String,String>>
        } catch (e: Exception) {
            promise.reject("E_TOC_PARSE_FAILED", "Failed to parse TOC: ${e.message}", e)
        }
    }

    View(FileUtilView::class) {
      // Defines a setter for the `url` prop.
      Prop("url") { view: FileUtilView, url: URL ->
        view.webView.loadUrl(url.toString())
      }
      // Defines an event that the view can send to JavaScript.
      Events("onLoad")
    }

  }

  // --- Top-level function to parse TOC ---
  fun parseTOCFromEPUB(epubPath: String, tocHref: String, opfDir: String): List<Map<String, String>> {
      return if (tocHref.endsWith(".ncx", ignoreCase = true)) {
          parseNCX(epubPath, tocHref)
      } else {
          parseNavXHTML(epubPath, tocHref, opfDir)
      }
  }

  // --- NCX parser ---
  fun parseNCX(epubPath: String, ncxHref: String): List<Map<String, String>> {
      val zipFile = ZipFile(epubPath)
      val ncxEntry = zipFile.getEntry(ncxHref) ?: run {
          Log.d("FileUtil", "ncxEntry is null")
          zipFile.close()
          return emptyList()
      }

      val parserFactory = XmlPullParserFactory.newInstance()
      val parser = parserFactory.newPullParser()
      parser.setInput(zipFile.getInputStream(ncxEntry).reader())

      val chapters = mutableListOf<Map<String, String>>()
      var eventType = parser.eventType
      var currentTag: String? = null
      var navLabel: String? = null
      var contentSrc: String? = null
      val ncxBasePath = ncxHref.substringBeforeLast('/', "")

      Log.d("FileUtil", "ncxHref: $ncxHref")
      while (eventType != XmlPullParser.END_DOCUMENT) {
          when (eventType) {
              XmlPullParser.START_TAG -> {
                  currentTag = parser.name
                  if (currentTag == "navPoint") {
                      navLabel = null
                      contentSrc = null
                  }
                  if (currentTag == "content") {
                    val rawSrc = parser.getAttributeValue(null, "src")?.trim()
                    if (!rawSrc.isNullOrEmpty()) {
                        // Resolve relative to NCX folder
                        contentSrc = if (rawSrc.contains("://")) {
                            rawSrc // absolute URL, rare but possible
                        } else if (ncxBasePath.isNotEmpty()) {
                            // Normalize to handle "../" etc.
                            File(ncxBasePath, rawSrc).invariantSeparatorsPath
                        } else {
                            rawSrc
                        }
                    }
                }
                
              }
              XmlPullParser.TEXT -> {
                  if (currentTag == "text") navLabel = parser.text.trim()
              }
              XmlPullParser.END_TAG -> {
                  if (parser.name == "navPoint") {
                      Log.d("FileUtil", "navLabel: $navLabel, contentSrc: $contentSrc")
                      if (!contentSrc.isNullOrEmpty() && !navLabel.isNullOrEmpty()) {
                          chapters.add(
                              mapOf(
                                  "title" to navLabel,
                                  "href" to contentSrc
                              )
                          )
                      }
                  }
                  currentTag = null
              }
          }
          eventType = parser.next()
      }

      zipFile.close()
      return chapters
  }

  // ----------------- NAV XHTML parser -----------------
  fun parseNavXHTML(epubPath: String, navHref: String, opfDir: String): List<Map<String, String>> {
      val zipFile = ZipFile(epubPath)
      val navEntry = zipFile.getEntry(navHref) ?: run {
          Log.d("FileUtil", "navEntry is null")
          zipFile.close()
          return emptyList()
      }

      val parserFactory = XmlPullParserFactory.newInstance()
      parserFactory.isNamespaceAware = true
      val parser = parserFactory.newPullParser()
      parser.setInput(zipFile.getInputStream(navEntry).reader())

      val chapters = mutableListOf<Map<String, String>>()
      var eventType = parser.eventType
      var insideNav = false
      var insideAnchor = false
      var currentTitle: String? = null
      var currentHref: String? = null
      Log.d("FileUtil", "navHref: $navHref")

      val tocDir = navHref.substringBeforeLast("/")
      Log.d("FileUtil", "tocDir: $tocDir")

      while (eventType != XmlPullParser.END_DOCUMENT) {
          when (eventType) {
              XmlPullParser.START_TAG -> {
                  when (parser.name.lowercase()) {
                      "nav" -> {
                          val typeAttr = parser.getAttributeValue(null, "type")
                          if (typeAttr?.contains("toc") == true) insideNav = true
                      }
                      "a" -> if (insideNav) {
                          currentHref = parser.getAttributeValue(null, "href")?.trim()
                          Log.d("FileUtil", "currentHref: $currentHref")
                          insideAnchor = true
                      }
                  }
              }
              XmlPullParser.TEXT -> {
                  if (insideAnchor) {
                      currentTitle = parser.text.trim()
                  }
              }
              XmlPullParser.END_TAG -> {
                  when (parser.name.lowercase()) {
                      "a" -> {
                          if (insideAnchor && !currentHref.isNullOrEmpty() && !currentTitle.isNullOrEmpty()) {
                              if(tocDir.isNotEmpty()) {
                                val chapterPath = File(tocDir, currentHref).normalize().path
                                chapters.add(mapOf("title" to currentTitle, "href" to chapterPath))
                              }
                          }
                          insideAnchor = false
                          currentTitle = null
                          currentHref = null
                      }
                      "nav" -> insideNav = false
                  }
              }
          }
          eventType = parser.next()
      }

      zipFile.close()
      return chapters
  }
}

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

            // Base directory for resolving relative hrefs
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

            data class ManifestItem(
                val id: String?,
                val href: String?,
                val properties: String?,
                val absoluteHref: String
            )
              
            val manifestList = mutableListOf<ManifestItem>()
            val metaList = mutableListOf<Pair<String, String>>() // name -> content

            val manifestMap = mutableMapOf<String, String>()
            val spineList = mutableListOf<Map<String, String>>()

            var currentId: String? = null
            var currentHref: String? = null
            var inSpine = false

            val textBuffer = StringBuilder()

            while (eventType != XmlPullParser.END_DOCUMENT) {
                when (eventType) {
                    XmlPullParser.START_TAG -> {
                        currentTag = parser.name
                        textBuffer.clear()
                        when (currentTag) {
                            "item" -> {
                                currentId = parser.getAttributeValue(null, "id")
                                currentHref = parser.getAttributeValue(null, "href")
                                if (currentId != null && currentHref != null) {
                                    // Resolve relative hrefs
                                    val absoluteHref = if (opfDir.isNotEmpty()) "$opfDir/$currentHref" else currentHref
                                    manifestMap[currentId] = absoluteHref.replace(Regex("/+"), "/")
                                }
                            }
                            "itemref" -> {
                                if (inSpine) {
                                    val idref = parser.getAttributeValue(null, "idref")
                                    if (idref != null) {
                                        spineList.add(
                                            mapOf(
                                                "id" to idref,
                                                "href" to (manifestMap[idref] ?: idref)
                                            )
                                        )
                                    }
                                }
                            }
                            "spine" -> { inSpine = true }
                            "meta" -> {
                                val nameAttr = parser.getAttributeValue(null, "name")
                                val contentAttr = parser.getAttributeValue(null, "content")
                                if (nameAttr == "cover" && contentAttr != null) {
                                    coverHref = manifestMap[contentAttr] ?: contentAttr
                                }
                            }
                        }
                    }
                    XmlPullParser.TEXT -> {
                        val text = parser.text
                        textBuffer.append(parser.text)

                    }
                    XmlPullParser.END_TAG -> {
                        when (parser.name) {
                            "dc:title" -> metadataTitle = textBuffer.toString().trim()
                            "dc:creator" -> metadataAuthor = textBuffer.toString().trim()
                            "dc:language" -> metadataLanguage = textBuffer.toString().trim()
                            "dc:date" -> metadataDate = textBuffer.toString().trim()
                            "dc:identifier" -> metadataIdentifier = textBuffer.toString().trim()
                            "dc:contributor" -> metadataContributor = textBuffer.toString().trim()
                        }
                        textBuffer.clear()
                        currentTag = null

                    }
                }
                eventType = parser.next()
            }

            // --- Step 3: Fallbacks for cover ---
            if (coverHref != null && !Regex("""\.(jpg|jpeg|png|gif|webp)$""", RegexOption.IGNORE_CASE).matches(coverHref)) {
                // pick first image from manifest if cover invalid
                val firstImage = manifestMap.values.find { it.matches(Regex(""".*\.(jpg|jpeg|png|gif|webp)$""", RegexOption.IGNORE_CASE)) }
                if (firstImage != null) coverHref = firstImage
            }

            val opfData = mapOf(
                "metadata" to mapOf(
                    "title" to (metadataTitle ?: ""),
                    "author" to (metadataAuthor ?: ""),
                    "language" to (metadataLanguage ?: ""),
                    "date" to (metadataDate ?: ""),
                    "identifier" to (metadataIdentifier ?: ""),
                    "contributor" to (metadataContributor ?: ""),
                    "coverImage" to coverHref
                ),
                "spine" to spineList
            )

            promise.resolve(opfData)
            zipFile.close()
        } catch (e: Exception) {
            promise.reject("E_OPF_PARSE_FAILED", "Failed to parse OPF: ${e.message}", e)
        }
    }


  }
}

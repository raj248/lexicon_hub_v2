package expo.modules.epubkit

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
import java.io.File
import android.util.Log
import java.util.zip.ZipFile
import org.jsoup.Jsoup
import android.util.Base64
import com.google.gson.Gson

class EpubKitModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("EpubKit")

    AsyncFunction("requestStoragePermission") { promise: Promise ->
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

    AsyncFunction("scanFiles") { promise: Promise ->
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

    AsyncFunction("extractMetadata") { filePath: String, promise: Promise ->
      try {
        val file = File(filePath)
        if (!file.exists() || !file.canRead()) {
          promise.reject("E_FILE_ERROR", "Cannot access file: $filePath", null)
          return@AsyncFunction
        }

        val zipFile = ZipFile(filePath)
        val opfPath = extractOpfPath(zipFile)
        val metadata = parseOpfFile(zipFile, opfPath)
        val spinePaths = extractSpine(zipFile, opfPath)
        val chapters = extractChapters(zipFile, spinePaths)

        metadata["chapters"] = Gson().toJson(chapters)
        zipFile.close()
        promise.resolve(metadata)
      } catch (e: Exception) {
        promise.reject("E_PARSING_ERROR", e.localizedMessage, e)
      }
    }

    AsyncFunction("getChapter") { epubFilePath: String, chapterPath: String, promise: Promise ->
      try {
        ZipFile(epubFilePath).use { zipFile ->
          val chapterEntry = zipFile.getEntry(chapterPath) ?: run {
            promise.reject("E_CHAPTER_NOT_FOUND", "Chapter not found.", null)
            return@AsyncFunction
          }

          val chapterContent = zipFile.getInputStream(chapterEntry).bufferedReader().use { it.readText() }
          val resources = extractResources(zipFile, extractResourcePaths(chapterContent))

          promise.resolve(mapOf(
            "content" to chapterContent,
            "resources" to resources.mapValues { Base64.encodeToString(it.value, Base64.DEFAULT) }
          ))
        }
      } catch (e: Exception) {
        promise.reject("E_EXTRACTING_ERROR", e.localizedMessage, e)
      }
    }
  }
}

private fun extractOpfPath(zipFile: ZipFile): String {
  val containerEntry = zipFile.getEntry("META-INF/container.xml") ?: throw Exception("container.xml not found")
  val document = Jsoup.parse(zipFile.getInputStream(containerEntry).bufferedReader().use { it.readText() })
  return document.select("rootfile").attr("full-path")
}

private fun parseOpfFile(zipFile: ZipFile, opfPath: String): MutableMap<String, String> {
  val opfEntry = zipFile.getEntry(opfPath) ?: throw Exception("content.opf not found")
  val document = Jsoup.parse(zipFile.getInputStream(opfEntry).bufferedReader().use { it.readText() })
  return mutableMapOf(
    "title" to (document.select("metadata title").text() ?: "Unknown Title"),
    "author" to (document.select("metadata creator").text() ?: "Unknown Author")
  )
}

private fun extractSpine(zipFile: ZipFile, opfPath: String): List<String> {
  val opfEntry = zipFile.getEntry(opfPath) ?: throw Exception("content.opf not found")
  val document = Jsoup.parse(zipFile.getInputStream(opfEntry).bufferedReader().use { it.readText() })

  val manifest = document.select("manifest item").associate { it.attr("id") to it.attr("href") }
  return document.select("spine itemref").mapNotNull { manifest[it.attr("idref")] }
}

private fun extractChapters(zipFile: ZipFile, spinePaths: List<String>): List<Map<String, String>> {
  val chapters = mutableListOf<Map<String, String>>()

  for (path in spinePaths) {
    val entry = zipFile.getEntry(path) ?: continue
    val document = Jsoup.parse(zipFile.getInputStream(entry).bufferedReader().use { it.readText() })
    val title = document.selectFirst("h1")?.text() ?: document.selectFirst("title")?.text() ?: "Untitled Chapter"
    chapters.add(mapOf("title" to title, "path" to path))
  }
  return chapters
}

private fun extractResourcePaths(content: String): List<String> {
  val document = Jsoup.parse(content)
  return document.select("img, link, script").mapNotNull {
    it.attr("src").takeIf { src -> src.isNotEmpty() } ?: it.attr("href").takeIf { href -> href.isNotEmpty() }
  }
}

private fun extractResources(zipFile: ZipFile, resourcePaths: List<String>): Map<String, ByteArray> {
  return resourcePaths.associateWith { path ->
    zipFile.getEntry(path)?.let { zipFile.getInputStream(it).readBytes() } ?: ByteArray(0)
  }
}

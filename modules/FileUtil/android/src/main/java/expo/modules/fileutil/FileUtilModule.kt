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
  }
}

package expo.modules.fileutil
import kotlinx.parcelize.Parcelize
import android.os.Parcelable

// A simple data class to hold chapter information.
// Using String for id is safer when receiving data from JavaScript.
@Parcelize
data class ChapterLink(
    val id: String,
    val href: String,
    val title: String,
    val isSelected: Boolean = false // <-- New property for DiffUtil
) : Parcelable

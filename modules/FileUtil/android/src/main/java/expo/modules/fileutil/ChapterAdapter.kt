package expo.modules.fileutil

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import android.util.Log

// The adapter connects your data to the RecyclerView.
// It accepts a lambda function `onItemClicked` to handle item presses.
class ChaptersAdapter(
    private val onItemClicked: (ChapterLink) -> Unit
) : ListAdapter<ChapterLink, ChaptersAdapter.ChapterViewHolder>(ChapterDiffCallback()) {

    private var selectedChapterId: String? = null

    fun selectChapter(chapterId: String) {
        val oldIndex = currentList.indexOfFirst { it.id == selectedChapterId }
        val newIndex = currentList.indexOfFirst { it.id == chapterId }

        selectedChapterId = chapterId
        Log.d("FileUtil", "selectChapter: $chapterId")
        if (oldIndex != -1) notifyItemChanged(oldIndex)
        if (newIndex != -1) notifyItemChanged(newIndex)
    }

    class ChapterViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val titleTextView: TextView = itemView.findViewById(R.id.chapterTitleTextView)

        fun bind(chapter: ChapterLink,  onItemClicked: (ChapterLink) -> Unit) {
            titleTextView.text = chapter.title
            updateSelection(chapter.isSelected)
            itemView.setOnClickListener { onItemClicked(chapter) }
        }

        fun updateSelection(isSelected: Boolean) {
            Log.d("FileUtil", "updateSelection: $isSelected")
            itemView.setBackgroundResource(
                if (isSelected) android.R.color.holo_blue_light
                else android.R.color.transparent
            )
        }

    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChapterViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_chapter, parent, false)
        return ChapterViewHolder(view)
    }

    override fun onBindViewHolder(holder: ChapterViewHolder, position: Int) {
        val chapter = getItem(position)
        val isSelected = chapter.id == selectedChapterId
        holder.bind(chapter.copy(isSelected = isSelected), onItemClicked)
    }

}

// DiffUtil provides a huge performance boost by calculating the minimal changes
// needed to update the list, avoiding a full redraw.
class ChapterDiffCallback : DiffUtil.ItemCallback<ChapterLink>() {
    override fun areItemsTheSame(oldItem: ChapterLink, newItem: ChapterLink): Boolean {
        Log.d("FileUtil", "areItemsTheSame: ${oldItem.id} == ${newItem.id}")
        return oldItem.id == newItem.id
    }

    override fun areContentsTheSame(oldItem: ChapterLink, newItem: ChapterLink): Boolean {
        return oldItem == newItem
    }
}

package expo.modules.fileutil

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView

// The adapter connects your data to the RecyclerView.
// It accepts a lambda function `onItemClicked` to handle item presses.
class ChaptersAdapter(
    private val onItemClicked: (ChapterLink) -> Unit
) : ListAdapter<ChapterLink, ChaptersAdapter.ChapterViewHolder>(ChapterDiffCallback()) {

    private var selectedChapterId: String? = null

    fun selectChapter(chapterId: String) {
        val oldSelected = selectedChapterId
        selectedChapterId = chapterId

        oldSelected?.let { oldId ->
            val oldIndex = currentList.indexOfFirst { it.id == oldId }
            if (oldIndex != -1) notifyItemChanged(oldIndex, "selection")
        }

        val newIndex = currentList.indexOfFirst { it.id == chapterId }
        if (newIndex != -1) notifyItemChanged(newIndex, "selection")
    }

    class ChapterViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val titleTextView: TextView = itemView.findViewById(R.id.chapterTitleTextView)

        fun bind(chapter: ChapterLink, isSelected: Boolean, onItemClicked: (ChapterLink) -> Unit) {
            titleTextView.text = chapter.title
            updateSelection(isSelected)
            itemView.setOnClickListener { onItemClicked(chapter) }
        }

        fun updateSelection(isSelected: Boolean) {
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

    // ✅ Must override this one
    override fun onBindViewHolder(holder: ChapterViewHolder, position: Int) {
        val chapter = getItem(position)
        val isSelected = chapter.id == selectedChapterId
        holder.bind(chapter, isSelected, onItemClicked)
    }

    // ✅ This is optional, for payload-based updates
    override fun onBindViewHolder(
        holder: ChapterViewHolder,
        position: Int,
        payloads: MutableList<Any>
    ) {
        if (payloads.isEmpty()) {
            onBindViewHolder(holder, position) // call default full bind
        } else {
            val chapter = getItem(position)
            val isSelected = chapter.id == selectedChapterId
            holder.updateSelection(isSelected)
        }
    }
}

// DiffUtil provides a huge performance boost by calculating the minimal changes
// needed to update the list, avoiding a full redraw.
class ChapterDiffCallback : DiffUtil.ItemCallback<ChapterLink>() {
    override fun areItemsTheSame(oldItem: ChapterLink, newItem: ChapterLink): Boolean {
        return oldItem.id == newItem.id 
    }

    override fun areContentsTheSame(oldItem: ChapterLink, newItem: ChapterLink): Boolean {
        return oldItem == newItem
    }
}

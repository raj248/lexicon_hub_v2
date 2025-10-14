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

    // ViewHolder holds the views for a single item.
    class ChapterViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val titleTextView: TextView = itemView.findViewById(R.id.chapterTitleTextView)

        fun bind(chapter: ChapterLink, onItemClicked: (ChapterLink) -> Unit) {
            titleTextView.text = chapter.title
            itemView.setOnClickListener {
                onItemClicked(chapter)
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ChapterViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_chapter, parent, false)
        return ChapterViewHolder(view)
    }

    override fun onBindViewHolder(holder: ChapterViewHolder, position: Int) {
        holder.bind(getItem(position), onItemClicked)
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

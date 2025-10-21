package expo.modules.fileutil

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import android.util.Log
import java.lang.ref.WeakReference // Add this import

// The adapter connects your data to the RecyclerView.
// It accepts a lambda function `onItemClicked` to handle item presses.
class ChaptersAdapter(
    private val onItemClicked: (ChapterLink) -> Unit,
    private var titleColor: Int = android.graphics.Color.BLACK
) : ListAdapter<ChapterLink, ChaptersAdapter.ChapterViewHolder>(ChapterDiffCallback()) {

    // Weak reference to the attached RecyclerView
    private var recyclerViewRef: WeakReference<RecyclerView>? = null
    private val recyclerView: RecyclerView? get() = recyclerViewRef?.get()

    override fun onAttachedToRecyclerView(recyclerView: RecyclerView) {
        super.onAttachedToRecyclerView(recyclerView)
        recyclerViewRef = WeakReference(recyclerView)
    }

    override fun onDetachedFromRecyclerView(recyclerView: RecyclerView) {
        super.onDetachedFromRecyclerView(recyclerView)
        recyclerViewRef?.clear()
    }

    fun setTitleColor(colorInt: Int) {
        recyclerView?.post {
            recyclerView?.scrollBy(0, 1)
            recyclerView?.scrollBy(0, -1)
        }
        Log.d("FileUtil", "setTitleColor: $colorInt")
        this.titleColor = colorInt
    }

    private var selectedChapterId: String? = null

    fun selectChapter(chapterId: String) {
        val oldIndex = currentList.indexOfFirst { it.id == selectedChapterId }
        val newIndex = currentList.indexOfFirst { it.id == chapterId }

        selectedChapterId = chapterId
        Log.d("FileUtil", "selectChapter: $chapterId")
        if (oldIndex != -1) notifyItemChanged(oldIndex)
        if (newIndex != -1) {
            notifyItemChanged(newIndex)
            Log.d("FileUtil", "Adapter scrollToPosition: $newIndex")
            recyclerView?.scrollToPosition(newIndex)
            recyclerView?.post{
                recyclerView?.scrollBy(0, 1)
                recyclerView?.scrollBy(0, -1)
            }
        }
    }

    class ChapterViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val titleTextView: TextView = itemView.findViewById(R.id.chapterTitleTextView)

        fun bind(chapter: ChapterLink,  onItemClicked: (ChapterLink) -> Unit, color: Int = android.graphics.Color.BLACK) {
            titleTextView.text = chapter.title
            titleTextView.setTextColor(color)
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
        val chapter = getItem(position)
        val isSelected = chapter.id == selectedChapterId
        holder.bind(chapter.copy(isSelected = isSelected), onItemClicked, titleColor)
        holder.itemView.setBackgroundResource(
            if (isSelected) android.R.color.holo_blue_light
            else android.R.color.transparent
        )
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

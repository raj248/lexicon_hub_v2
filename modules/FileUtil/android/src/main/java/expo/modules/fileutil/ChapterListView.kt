package expo.modules.fileutil

import android.content.Context
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

import android.util.Log
import android.graphics.Color // Needed for the default Color.BLACK check (though not strictly necessary here)

class ChapterListView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    
    private val onChapterPress by EventDispatcher()

    internal var chapterTitleColor: Int = android.graphics.Color.BLACK 
        private set

    // The adapter, which handles item clicks and calls our event dispatcher.
    internal val chaptersAdapter: ChaptersAdapter by lazy {
        // CORRECTED SYNTAX: Pass the click lambda AND the named argument 'titleColor'
        ChaptersAdapter(
            // 1. Lambda for the 'onItemClicked' constructor parameter
            onItemClicked = { chapter ->
                // Ensure 'chapter' is passed correctly to the selectChapter call
                chaptersAdapter.selectChapter(chapter.id)
                
                // 2. Dispatch the event to JavaScript
                onChapterPress(mapOf(
                    "id" to chapter.id,
                    "href" to chapter.href,
                    "title" to chapter.title,
                    "isSelected" to chapter.isSelected
                ))
            },
            // 3. Named argument for the 'titleColor' constructor parameter
            titleColor = chapterTitleColor 
        )
    }

    // Setter called by the Expo Module system
    fun setChapterTitleColor(colorInt: Int) {
        this.chapterTitleColor = colorInt
        // Assuming ChaptersAdapter has a public setTitleColor method
        chaptersAdapter.setTitleColor(colorInt)
        chaptersAdapter.notifyDataSetChanged()
    }

    internal val recyclerView = RecyclerView(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        layoutManager = LinearLayoutManager(context)
        adapter = chaptersAdapter
    }

    init {
        Log.d("FileUtil", "ChapterListView init")
        addView(recyclerView)
    }
}
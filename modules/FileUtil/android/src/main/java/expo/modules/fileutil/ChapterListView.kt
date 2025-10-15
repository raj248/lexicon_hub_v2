package expo.modules.fileutil

import android.content.Context
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

import android.util.Log

class ChapterListView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    // Event dispatcher to send an event to JavaScript when a chapter is pressed.
    // The name 'onChapterPress' must match the event name in the module definition.
    private val onChapterPress by EventDispatcher()

    // The adapter, which handles item clicks and calls our event dispatcher.
    internal val chaptersAdapter = ChaptersAdapter { chapter ->
        // When a chapter is clicked, send its data back to JS.
        onChapterPress(mapOf(
            "id" to chapter.id,
            "title" to chapter.title
        ))
    }

    // The actual native RecyclerView.
    internal val recyclerView = RecyclerView(context).apply {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        layoutManager = LinearLayoutManager(context)
        adapter = chaptersAdapter
    }

    init {
        // Add the RecyclerView to this view's hierarchy.
        Log.d("FileUtil", "ChapterListView init")
        addView(recyclerView)
    }
}

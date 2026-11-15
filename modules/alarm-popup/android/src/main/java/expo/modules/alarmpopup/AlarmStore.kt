package expo.modules.alarmpopup

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

data class StoredAlarm(val id: String, val label: String, val at: Long)

/**
 * Survives the app being killed: what is scheduled, what is ringing right now,
 * and what the user did on the pop-up (so the app can catch up when it opens).
 */
object AlarmStore {
  private const val PREFS = "cashtrack_alarm_popup"
  private const val SCHEDULED = "scheduled"
  private const val RINGING = "ringing"
  private const val ACTIONS = "actions"
  private const val MAX_ACTIONS = 50

  private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private fun readMap(context: Context, key: String): JSONObject =
    try {
      JSONObject(prefs(context).getString(key, null) ?: "{}")
    } catch (_: Exception) {
      JSONObject()
    }

  private fun writeMap(context: Context, key: String, map: JSONObject) {
    prefs(context).edit().putString(key, map.toString()).commit()
  }

  private fun list(context: Context, key: String): List<StoredAlarm> {
    val map = readMap(context, key)
    val out = mutableListOf<StoredAlarm>()
    for (id in map.keys()) {
      val item = map.optJSONObject(id) ?: continue
      out.add(StoredAlarm(id, item.optString("label", "Timer"), item.optLong("at", 0L)))
    }
    return out.sortedBy { it.at }
  }

  private fun put(context: Context, key: String, alarm: StoredAlarm) = synchronized(this) {
    val map = readMap(context, key)
    map.put(alarm.id, JSONObject().put("label", alarm.label).put("at", alarm.at))
    writeMap(context, key, map)
  }

  private fun remove(context: Context, key: String, id: String): StoredAlarm? = synchronized(this) {
    val map = readMap(context, key)
    val item = map.optJSONObject(id) ?: return null
    map.remove(id)
    writeMap(context, key, map)
    StoredAlarm(id, item.optString("label", "Timer"), item.optLong("at", 0L))
  }

  fun putScheduled(context: Context, alarm: StoredAlarm) = put(context, SCHEDULED, alarm)
  fun removeScheduled(context: Context, id: String) = remove(context, SCHEDULED, id)
  fun scheduled(context: Context) = list(context, SCHEDULED)

  fun putRinging(context: Context, alarm: StoredAlarm) = put(context, RINGING, alarm)
  fun removeRinging(context: Context, id: String) = remove(context, RINGING, id)
  fun ringing(context: Context) = list(context, RINGING)

  fun addAction(context: Context, id: String, action: String, endAt: Long? = null) = synchronized(this) {
    val current = try {
      JSONArray(prefs(context).getString(ACTIONS, null) ?: "[]")
    } catch (_: Exception) {
      JSONArray()
    }
    val entry = JSONObject().put("id", id).put("action", action).put("at", System.currentTimeMillis())
    if (endAt != null) entry.put("endAt", endAt)
    current.put(entry)
    val trimmed = JSONArray()
    val start = maxOf(0, current.length() - MAX_ACTIONS)
    for (i in start until current.length()) trimmed.put(current.get(i))
    prefs(context).edit().putString(ACTIONS, trimmed.toString()).commit()
  }

  /** Returns and clears what the user did on the pop-up since the last call. */
  fun takeActions(context: Context): List<Map<String, Any?>> = synchronized(this) {
    val raw = prefs(context).getString(ACTIONS, null) ?: return emptyList()
    prefs(context).edit().remove(ACTIONS).commit()
    val array = try {
      JSONArray(raw)
    } catch (_: Exception) {
      return emptyList()
    }
    val out = mutableListOf<Map<String, Any?>>()
    for (i in 0 until array.length()) {
      val item = array.optJSONObject(i) ?: continue
      out.add(
        mapOf(
          "id" to item.optString("id"),
          "action" to item.optString("action"),
          "at" to item.optLong("at").toDouble(),
          "endAt" to if (item.has("endAt")) item.optLong("endAt").toDouble() else null,
        ),
      )
    }
    return out
  }
}

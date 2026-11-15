package expo.modules.alarmpopup

import android.app.ActivityManager
import android.app.AlarmManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.Icon
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build

/**
 * Rings a timer like a real alarm clock even when the app is closed:
 * AlarmManager wakes the phone, a full-screen notification pops the alarm
 * screen up (over the lock screen too), and the sound repeats until stopped.
 */
object AlarmScheduler {
  const val ACTION_FIRE = "expo.modules.alarmpopup.FIRE"
  const val ACTION_STOP = "expo.modules.alarmpopup.STOP"
  const val ACTION_SNOOZE = "expo.modules.alarmpopup.SNOOZE"
  const val EXTRA_ID = "alarmId"
  const val EXTRA_LABEL = "alarmLabel"

  const val SNOOZE_MS = 5 * 60 * 1000L
  /** Insistent sound stops by itself after this, so a forgotten phone does not ring all day. */
  private const val RING_TIMEOUT_MS = 10 * 60 * 1000L
  /** After a reboot, alarms missed by more than this are dropped instead of rung late. */
  private const val LATE_FIRE_WINDOW_MS = 10 * 60 * 1000L

  private const val CHANNEL_ID = "cashtrack-alarm-popup-v1"
  private const val NOTIFICATION_ID = 7310
  private val VIBRATION = longArrayOf(0, 800, 400, 800, 400, 800, 1200)

  /** Set by the module while the app is running, so it hears about pop-up actions at once. */
  @Volatile var listener: (() -> Unit)? = null

  private fun notifyListener() {
    try {
      listener?.invoke()
    } catch (_: Exception) {}
  }

  private fun alarmManager(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  private fun notificationManager(context: Context) =
    context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun broadcast(context: Context, action: String, id: String): PendingIntent {
    // The id goes into the data URI so every alarm gets its own PendingIntent.
    val intent = Intent(context, AlarmReceiver::class.java)
      .setAction(action)
      .setData(Uri.parse("cashtrack-alarm://$action/${Uri.encode(id)}"))
      .putExtra(EXTRA_ID, id)
    return PendingIntent.getBroadcast(
      context,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun popupIntent(context: Context, id: String): PendingIntent {
    val intent = Intent(context, AlarmActivity::class.java)
      .setData(Uri.parse("cashtrack-alarm://popup/${Uri.encode(id)}"))
      .putExtra(EXTRA_ID, id)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_NO_USER_ACTION)
    return PendingIntent.getActivity(
      context,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }

  private fun launchAppIntent(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    return PendingIntent.getActivity(context, 1, launch, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
  }

  fun canScheduleExact(context: Context): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarmManager(context).canScheduleExactAlarms()

  fun canUseFullScreen(context: Context): Boolean =
    Build.VERSION.SDK_INT < 34 || notificationManager(context).canUseFullScreenIntent()

  /* ---------- Scheduling ---------- */

  fun schedule(context: Context, id: String, label: String, fireAt: Long) {
    AlarmStore.putScheduled(context, StoredAlarm(id, label, fireAt))
    setSystemAlarm(context, id, fireAt)
  }

  private fun setSystemAlarm(context: Context, id: String, fireAt: Long) {
    val manager = alarmManager(context)
    val operation = broadcast(context, ACTION_FIRE, id)
    try {
      if (canScheduleExact(context)) {
        // Alarm-clock alarms are exact, wake the phone from Doze, and show the
        // alarm icon in the status bar, just like the built-in Clock app.
        val show = launchAppIntent(context) ?: popupIntent(context, id)
        manager.setAlarmClock(AlarmManager.AlarmClockInfo(fireAt, show), operation)
      } else {
        manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, operation)
      }
    } catch (_: SecurityException) {
      manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, fireAt, operation)
    }
  }

  /** Cancels a pending alarm and silences it if it is ringing. */
  fun cancel(context: Context, id: String) {
    alarmManager(context).cancel(broadcast(context, ACTION_FIRE, id))
    AlarmStore.removeScheduled(context, id)
    silence(context, id)
  }

  /** Puts every stored alarm back after a reboot or an app update. */
  fun restoreAll(context: Context) {
    val now = System.currentTimeMillis()
    for (alarm in AlarmStore.scheduled(context)) {
      when {
        alarm.at > now -> setSystemAlarm(context, alarm.id, alarm.at)
        now - alarm.at <= LATE_FIRE_WINDOW_MS -> fire(context, alarm.id)
        else -> AlarmStore.removeScheduled(context, alarm.id)
      }
    }
  }

  /* ---------- Ringing ---------- */

  fun fire(context: Context, id: String, fallbackLabel: String? = null) {
    val stored = AlarmStore.removeScheduled(context, id)
    val label = stored?.label ?: fallbackLabel ?: "Timer"
    AlarmStore.putRinging(context, StoredAlarm(id, label, System.currentTimeMillis()))
    postRingingNotification(context, id, label)
    // With the phone unlocked and in use, Android shows a full-screen
    // notification as a small banner. If CashTrack itself is on screen it may
    // open the alarm screen directly, so do that.
    if (isAppInForeground()) {
      try {
        popupIntent(context, id).send()
      } catch (_: Exception) {}
    }
    notifyListener()
  }

  private fun isAppInForeground(): Boolean {
    val info = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(info)
    return info.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
  }

  private fun alarmSound(context: Context): Uri {
    val raw = context.resources.getIdentifier("quick_alarm", "raw", context.packageName)
    if (raw != 0) return Uri.parse("android.resource://${context.packageName}/$raw")
    return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
  }

  private val alarmAudio: AudioAttributes
    get() = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
      .build()

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = notificationManager(context)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(CHANNEL_ID, "Timer alarms (pop-up)", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Pops up and rings when a timer finishes, even if CashTrack is closed."
      setSound(alarmSound(context), alarmAudio)
      enableVibration(true)
      vibrationPattern = VIBRATION
      enableLights(true)
      lightColor = Color.parseColor("#0152F5")
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setBypassDnd(true)
    }
    manager.createNotificationChannel(channel)
  }

  private fun smallIcon(context: Context): Int {
    val icon = context.resources.getIdentifier("notification_icon", "drawable", context.packageName)
    return if (icon != 0) icon else context.applicationInfo.icon
  }

  @Suppress("DEPRECATION")
  private fun postRingingNotification(context: Context, id: String, label: String) {
    ensureChannel(context)
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(context, CHANNEL_ID).setTimeoutAfter(RING_TIMEOUT_MS)
    } else {
      Notification.Builder(context)
        .setPriority(Notification.PRIORITY_MAX)
        .setSound(alarmSound(context), alarmAudio)
        .setVibrate(VIBRATION)
    }
    val popup = popupIntent(context, id)
    val icon = Icon.createWithResource(context, smallIcon(context))
    val notification = builder
      .setSmallIcon(smallIcon(context))
      .setContentTitle("⏰ Time's up!")
      .setContentText("$label timer is ringing.")
      .setCategory(Notification.CATEGORY_ALARM)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setColor(Color.parseColor("#00109D"))
      .setOngoing(true)
      .setAutoCancel(false)
      .setShowWhen(true)
      .setWhen(System.currentTimeMillis())
      .setContentIntent(popup)
      .setFullScreenIntent(popup, true)
      .addAction(Notification.Action.Builder(icon, "Snooze 5 min", broadcast(context, ACTION_SNOOZE, id)).build())
      .addAction(Notification.Action.Builder(icon, "Stop", broadcast(context, ACTION_STOP, id)).build())
      .build()
    // Keep repeating the sound until the alarm is stopped, like a clock alarm.
    notification.flags = notification.flags or Notification.FLAG_INSISTENT or Notification.FLAG_NO_CLEAR
    notificationManager(context).notify(id, NOTIFICATION_ID, notification)
  }

  private fun silence(context: Context, id: String) {
    notificationManager(context).cancel(id, NOTIFICATION_ID)
    AlarmStore.removeRinging(context, id)
    AlarmActivity.onAlarmSilenced(id)
  }

  /** Ids whose ringing notification is still on screen. Cleans up ones that timed out. */
  fun ringingIds(context: Context): List<String> {
    val posted = try {
      notificationManager(context).activeNotifications
        .filter { it.id == NOTIFICATION_ID && it.tag != null }
        .map { it.tag }
        .toSet()
    } catch (_: Exception) {
      null
    }
    val stored = AlarmStore.ringing(context)
    if (posted == null) return stored.map { it.id }
    for (alarm in stored) {
      if (alarm.id !in posted) AlarmStore.removeRinging(context, alarm.id)
    }
    return stored.map { it.id }.filter { it in posted }
  }

  /* ---------- User actions from the pop-up or notification ---------- */

  fun stopFromPopup(context: Context, id: String) {
    silence(context, id)
    AlarmStore.addAction(context, id, "dismiss")
    notifyListener()
  }

  fun snoozeFromPopup(context: Context, id: String) {
    val label = AlarmStore.ringing(context).firstOrNull { it.id == id }?.label ?: "Timer"
    silence(context, id)
    val endAt = System.currentTimeMillis() + SNOOZE_MS
    schedule(context, id, label, endAt)
    AlarmStore.addAction(context, id, "snooze", endAt)
    notifyListener()
  }
}

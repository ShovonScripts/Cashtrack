package expo.modules.alarmpopup

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Fires a due alarm, or handles Stop / Snooze tapped on its notification. */
class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val id = intent.getStringExtra(AlarmScheduler.EXTRA_ID) ?: return
    when (intent.action) {
      AlarmScheduler.ACTION_FIRE -> AlarmScheduler.fire(context, id, intent.getStringExtra(AlarmScheduler.EXTRA_LABEL))
      AlarmScheduler.ACTION_STOP -> AlarmScheduler.stopFromPopup(context, id)
      AlarmScheduler.ACTION_SNOOZE -> AlarmScheduler.snoozeFromPopup(context, id)
    }
  }
}

/** Reboots and app updates wipe AlarmManager, so put the alarms back. */
class AlarmRestoreReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED -> AlarmScheduler.restoreAll(context)
    }
  }
}

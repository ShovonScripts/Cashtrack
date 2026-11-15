package expo.modules.alarmpopup

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AlarmPopupModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AlarmPopup")

    Events("onAlarmChange")

    OnCreate {
      AlarmScheduler.listener = { sendEvent("onAlarmChange", emptyMap<String, Any?>()) }
    }

    OnDestroy {
      AlarmScheduler.listener = null
    }

    Function("schedule") { id: String, label: String, fireAt: Double ->
      AlarmScheduler.schedule(context, id, label, fireAt.toLong())
    }

    Function("cancel") { id: String ->
      AlarmScheduler.cancel(context, id)
    }

    Function("getRingingIds") {
      AlarmScheduler.ringingIds(context)
    }

    Function("getScheduledIds") {
      AlarmStore.scheduled(context).map { it.id }
    }

    Function("takeActions") {
      AlarmStore.takeActions(context)
    }

    Function("canScheduleExactAlarms") {
      AlarmScheduler.canScheduleExact(context)
    }

    Function("canUseFullScreenIntent") {
      AlarmScheduler.canUseFullScreen(context)
    }

    /** Android 14+: opens the "Allow full-screen notifications" switch for this app. */
    Function("openFullScreenIntentSettings") {
      val ctx = context
      val intent = if (Build.VERSION.SDK_INT >= 34) {
        Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, Uri.parse("package:${ctx.packageName}"))
      } else {
        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE, ctx.packageName)
      }
      ctx.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
}

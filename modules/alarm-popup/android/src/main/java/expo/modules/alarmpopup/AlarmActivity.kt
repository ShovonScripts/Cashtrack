package expo.modules.alarmpopup

import android.animation.ObjectAnimator
import android.animation.PropertyValuesHolder
import android.animation.ValueAnimator
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.text.format.DateFormat
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.lang.ref.WeakReference
import java.util.Date

/**
 * The full-screen "Time's up!" screen. Shows over the lock screen and turns the
 * screen on. The sound comes from the alarm notification, so closing this
 * screen without choosing leaves the alarm ringing in the notification shade.
 */
class AlarmActivity : Activity() {
  private var alarmId: String? = null
  private lateinit var labelView: TextView
  private lateinit var clockView: TextView
  private var pulse: ObjectAnimator? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    current = WeakReference(this)
    showOverLockScreen()
    setContentView(buildLayout())
    showAlarm(intent?.getStringExtra(AlarmScheduler.EXTRA_ID))
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    showAlarm(intent.getStringExtra(AlarmScheduler.EXTRA_ID))
  }

  override fun onResume() {
    super.onResume()
    clockView.text = DateFormat.getTimeFormat(this).format(Date())
    // Opened from an old notification after the alarm was already handled.
    val id = alarmId
    if (id == null || id !in AlarmScheduler.ringingIds(this)) showNextOrFinish()
  }

  override fun onDestroy() {
    pulse?.cancel()
    if (current?.get() === this) current = null
    super.onDestroy()
  }

  @Suppress("DEPRECATION")
  private fun showOverLockScreen() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      window.addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON)
    }
    window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    window.statusBarColor = BACKGROUND
    window.navigationBarColor = BACKGROUND
  }

  private fun showAlarm(id: String?) {
    val ringing = AlarmStore.ringing(this)
    val alarm = ringing.firstOrNull { it.id == id } ?: ringing.lastOrNull()
    if (alarm == null) {
      finish()
      return
    }
    alarmId = alarm.id
    labelView.text = alarm.label
  }

  private fun showNextOrFinish() {
    val next = AlarmScheduler.ringingIds(this).lastOrNull()
    if (next == null) finish() else showAlarm(next)
  }

  private fun stop() {
    val id = alarmId ?: return finish()
    AlarmScheduler.stopFromPopup(this, id)
  }

  private fun snooze() {
    val id = alarmId ?: return finish()
    AlarmScheduler.snoozeFromPopup(this, id)
  }

  /* ---------- Layout (built in code so the module needs no resources) ---------- */

  private fun dp(value: Int) =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value.toFloat(), resources.displayMetrics).toInt()

  private fun text(size: Float, color: Int, bold: Boolean = false) = TextView(this).apply {
    setTextSize(TypedValue.COMPLEX_UNIT_SP, size)
    setTextColor(color)
    gravity = Gravity.CENTER
    if (bold) typeface = Typeface.DEFAULT_BOLD
  }

  private fun pill(label: String, fill: Int, textColor: Int, onClick: () -> Unit) = Button(this).apply {
    text = label
    isAllCaps = false
    setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
    setTextColor(textColor)
    typeface = Typeface.DEFAULT_BOLD
    stateListAnimator = null
    background = GradientDrawable().apply {
      cornerRadius = dp(32).toFloat()
      setColor(fill)
    }
    minHeight = dp(64)
    setOnClickListener { onClick() }
  }

  private fun buildLayout(): View {
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setBackgroundColor(BACKGROUND)
      setPadding(dp(24), dp(72), dp(24), dp(48))
    }

    clockView = text(20f, Color.argb(200, 255, 255, 255))
    root.addView(clockView)

    val spacerTop = View(this)
    root.addView(spacerTop, LinearLayout.LayoutParams(0, 0, 1f))

    val bell = text(84f, Color.WHITE).apply {
      text = "⏰"
      contentDescription = null
    }
    root.addView(bell)
    pulse = ObjectAnimator.ofPropertyValuesHolder(
      bell,
      PropertyValuesHolder.ofFloat(View.SCALE_X, 1f, 1.15f),
      PropertyValuesHolder.ofFloat(View.SCALE_Y, 1f, 1.15f),
    ).apply {
      duration = 600
      repeatCount = ValueAnimator.INFINITE
      repeatMode = ValueAnimator.REVERSE
      start()
    }

    root.addView(text(36f, Color.WHITE, bold = true).apply {
      text = "Time's up!"
      setPadding(0, dp(24), 0, dp(8))
    })
    labelView = text(22f, Color.argb(220, 255, 255, 255))
    root.addView(labelView)
    root.addView(text(14f, Color.argb(160, 255, 255, 255)).apply {
      text = "CashTrack timer"
      setPadding(0, dp(8), 0, 0)
    })

    val spacerBottom = View(this)
    root.addView(spacerBottom, LinearLayout.LayoutParams(0, 0, 1f))

    val buttonParams = LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT)
    root.addView(pill("Snooze 5 min", Color.argb(46, 255, 255, 255), Color.WHITE) { snooze() }, buttonParams)
    root.addView(View(this), LinearLayout.LayoutParams(0, dp(16)))
    root.addView(pill("Stop", Color.WHITE, BACKGROUND) { stop() }, buttonParams)
    return root
  }

  companion object {
    private val BACKGROUND = Color.parseColor("#00109D")
    private var current: WeakReference<AlarmActivity>? = null

    /** Called when an alarm stops ringing for any reason (pop-up, notification, or the app). */
    fun onAlarmSilenced(id: String) {
      val activity = current?.get() ?: return
      activity.runOnUiThread {
        if (activity.alarmId == id && !activity.isFinishing) activity.showNextOrFinish()
      }
    }
  }
}

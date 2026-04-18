package com.ossflix.mobile

import android.content.Context
import android.media.AudioManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SystemVolumeModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "SystemVolume"

  @ReactMethod
  fun getMusicVolume(promise: Promise) {
    val audioManager = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    if (audioManager == null) {
      promise.reject("AUDIO_MANAGER_UNAVAILABLE", "AudioManager is unavailable")
      return
    }

    val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    if (maxVolume <= 0) {
      promise.resolve(0.0)
      return
    }

    val currentVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
    promise.resolve(currentVolume.toDouble() / maxVolume.toDouble())
  }

  @ReactMethod
  fun setMusicVolume(volume: Double, promise: Promise) {
    val audioManager = reactApplicationContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    if (audioManager == null) {
      promise.reject("AUDIO_MANAGER_UNAVAILABLE", "AudioManager is unavailable")
      return
    }

    val normalized = volume.coerceIn(0.0, 1.0)
    val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    if (maxVolume <= 0) {
      promise.resolve(0.0)
      return
    }

    val targetVolume = Math.round(normalized * maxVolume).toInt().coerceIn(0, maxVolume)
    audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetVolume, 0)
    val appliedVolume = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
    promise.resolve(appliedVolume.toDouble() / maxVolume.toDouble())
  }
}

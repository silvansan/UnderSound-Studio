'use client'

type LiveAudioPlayerShellProps = {
  disabled?: boolean
  isBuffering?: boolean
  isMuted?: boolean
  isPlaying?: boolean
  label?: string
  mode?: string
  onToggleMute?: () => void
  onTogglePlayback?: () => void
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5.14v13.72L19 12 8 5.14z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
    </svg>
  )
}

function VolumeIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16.5 12a4.5 4.5 0 0 0-2.25-3.9v7.8A4.48 4.48 0 0 0 16.5 12zM5 9v6h4l5 5V4L9 9H5z" opacity="0.35" />
        <path d="M3.27 3 2 4.27l3.62 3.62H3v6h4l5 5v-1.73l4.01 4.01L21 19.73 3.27 3z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.25-3.9v7.8A4.48 4.48 0 0 0 16.5 12z" />
    </svg>
  )
}

export function LiveAudioPlayerShell({
  disabled = false,
  isBuffering = false,
  isMuted = false,
  isPlaying = false,
  label = 'Live',
  mode = 'WebRTC monitor',
  onToggleMute,
  onTogglePlayback,
}: LiveAudioPlayerShellProps) {
  const showPause = isPlaying && !isBuffering

  return (
    <div className="us-hls-player__shell mt-3">
      <button
        aria-label={showPause ? 'Pause playback' : 'Play playback'}
        className="us-hls-player__control"
        disabled={disabled}
        onClick={onTogglePlayback}
        type="button"
      >
        {isBuffering ? (
          <span aria-hidden="true" className="us-hls-player__spinner" />
        ) : showPause ? (
          <PauseIcon />
        ) : (
          <PlayIcon />
        )}
      </button>

      <div className="us-hls-player__meta">
        <span className={`us-hls-player__live ${isPlaying ? 'us-hls-player__live--active' : ''}`}>
          <span aria-hidden="true" className="us-hls-player__live-dot" />
          {label}
        </span>
        <span className="us-hls-player__mode">{mode}</span>
      </div>

      <button
        aria-label={isMuted ? 'Unmute playback' : 'Mute playback'}
        className="us-hls-player__control us-hls-player__control--secondary"
        disabled={disabled}
        onClick={onToggleMute}
        type="button"
      >
        <VolumeIcon muted={isMuted} />
      </button>
    </div>
  )
}

type AudioEffectTone = 'blue' | 'green'

type AudioEffectToggleProps = {
  checked?: boolean
  defaultChecked?: boolean
  disabled?: boolean
  hint?: string
  label: string
  name?: string
  onChange?: (checked: boolean) => void
  tone?: AudioEffectTone
}

export function AudioEffectToggle({
  checked,
  defaultChecked = false,
  disabled = false,
  hint,
  label,
  name,
  onChange,
  tone = 'green',
}: AudioEffectToggleProps) {
  const controlled = typeof checked === 'boolean' && typeof onChange === 'function'

  return (
    <label
      className={`us-audio-toggle-field${disabled ? ' us-audio-toggle-field--disabled' : ''}`}
      style={{ color: 'var(--us-text)' }}
    >
      <span className="us-audio-toggle-copy">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
            {hint}
          </span>
        ) : null}
      </span>
      <span className={`us-neu-toggle us-neu-toggle--${tone}`}>
        <input
          checked={controlled ? checked : undefined}
          className="us-neu-toggle-input"
          defaultChecked={controlled ? undefined : defaultChecked}
          disabled={disabled}
          name={name}
          onChange={
            controlled
              ? (event) => {
                  onChange(event.target.checked)
                }
              : undefined
          }
          type="checkbox"
        />
        <span aria-hidden className="us-neu-toggle-track">
          <span className="us-neu-toggle-thumb" />
        </span>
      </span>
    </label>
  )
}

'use client'

export default function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {items.map(it => {
        const active = it.key === value
        return (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            style={{
              padding: '8px 10px',
              borderRadius: 999,
              border: '1px solid #ddd',
              background: active ? '#111' : 'white',
              color: active ? 'white' : 'black',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

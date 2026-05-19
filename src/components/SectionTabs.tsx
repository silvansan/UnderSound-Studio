'use client'

import { useState, type ReactNode } from 'react'

export type SectionTab = {
  content: ReactNode
  id: string
  label: string
}

type SectionTabsProps = {
  defaultTabId?: string
  tabs: SectionTab[]
}

export function SectionTabs({ defaultTabId, tabs }: SectionTabsProps) {
  const visibleTabs = tabs.filter((tab) => tab.content)
  const [activeId, setActiveId] = useState(() => defaultTabId ?? visibleTabs[0]?.id ?? '')
  const activeTab = visibleTabs.find((tab) => tab.id === activeId) ?? visibleTabs[0]

  if (visibleTabs.length === 0) {
    return null
  }

  if (visibleTabs.length === 1) {
    return <>{visibleTabs[0].content}</>
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b pb-4" role="tablist" style={{ borderColor: 'var(--us-border)' }}>
        {visibleTabs.map((tab) => {
          const active = tab.id === activeTab.id

          return (
            <button
              key={tab.id}
              aria-selected={active}
              className="rounded-2xl border px-4 py-2 text-sm font-medium"
              onClick={() => setActiveId(tab.id)}
              role="tab"
              style={{
                backgroundColor: active ? 'var(--us-green-dark)' : 'white',
                borderColor: active ? 'var(--us-green-dark)' : 'var(--us-border)',
                color: active ? 'white' : 'var(--us-text)',
              }}
              type="button"
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="pt-5" role="tabpanel">
        {activeTab.content}
      </div>
    </div>
  )
}

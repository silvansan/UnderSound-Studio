import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'

type ListGroupRowProps<T extends ElementType = 'div'> = {
  as?: T
  children: ReactNode
  className?: string
  rowTint?: ListRowTint
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>

export function ListGroupRow<T extends ElementType = 'div'>({
  as,
  children,
  className = '',
  rowTint = 'white',
  ...props
}: ListGroupRowProps<T>) {
  const Component = as ?? 'div'
  const mergedClassName = [rowTintClass(rowTint), className].filter(Boolean).join(' ')

  return (
    <Component className={mergedClassName} {...props}>
      {children}
    </Component>
  )
}

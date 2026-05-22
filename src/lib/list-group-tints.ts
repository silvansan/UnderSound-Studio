export type ListRowTint = 'blue' | 'green' | 'white'

const TINT_CYCLE: ListRowTint[] = ['green', 'blue', 'white']

export function rowTintClass(tint: ListRowTint = 'white'): string {
  return `us-row-tint-${tint}`
}

export function assignGroupTints<T>(
  items: T[],
  getGroupKey: (item: T) => string,
): Array<T & { rowTint: ListRowTint }> {
  let lastKey: string | null = null
  let groupIndex = -1

  return items.map((item) => {
    const key = getGroupKey(item)

    if (key !== lastKey) {
      groupIndex += 1
      lastKey = key
    }

    return {
      ...item,
      rowTint: TINT_CYCLE[groupIndex % TINT_CYCLE.length] ?? 'white',
    }
  })
}

export function assignZebraTints<T>(items: T[]): Array<T & { rowTint: ListRowTint }> {
  return items.map((item, index) => ({
    ...item,
    rowTint: TINT_CYCLE[index % TINT_CYCLE.length] ?? 'white',
  }))
}

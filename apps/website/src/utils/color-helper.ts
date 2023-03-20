/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

interface ChartColor {
  border: string
  background: string
}
const rand = (): number => Math.round(Math.random() * 255)
export const randomChartColor = (): ChartColor => {
  const r = rand()
  const g = rand()
  const b = rand()

  return {
    border: `rgb(${r}, ${g}, ${b}, 1)`,
    background: `rgb(${r}, ${g}, ${b}, 0.2)`,
  }
}

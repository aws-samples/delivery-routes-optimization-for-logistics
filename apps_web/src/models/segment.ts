/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

export interface Point {
  lat: number
  long: number
}

export interface SegmentData {
  orderId: string
  index: number
  from: Point
  to: Point
  segmentType: string
  route: {
    distance: {
      unit: string
      value: number
    }
    time: {
      unit: string
      value: number
    }
    pointsEncoded: string
  }
}

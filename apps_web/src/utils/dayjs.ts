/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import dayjs, { extend } from 'dayjs'
import utc from 'dayjs/plugin/utc'

extend(utc)

export const dayjslocal = dayjs
export const dayjsutc = dayjs.utc

/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import type { SolverJobData } from '../../models'
import type { QueryService } from '../../services/base/queryService'
import { createQueryProvider, useQueryContext } from '../base/QueryContext'
import type { ContextInterface } from '../base/QueryContext'
import { appvars } from '../../config'
import SolverJobService from '../../services/solver-job'

const SolverJobQueryProvider = createQueryProvider<SolverJobData, QueryService<SolverJobData>>(
  appvars.ENTITY.SOLVER_JOB,
  SolverJobService,
)
const useSolverJobQueryContext = (): ContextInterface<SolverJobData> =>
  useQueryContext<SolverJobData>(appvars.ENTITY.SOLVER_JOB)

export { SolverJobQueryProvider, useSolverJobQueryContext }

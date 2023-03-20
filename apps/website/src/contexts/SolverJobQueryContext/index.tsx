/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { SolverJobData } from '../../models'
import { QueryService } from '../../services/base/queryService'
import { ContextInterface, createQueryProvider, useQueryContext } from '../base/QueryContext'
import { appvars } from '../../config'
import SolverJobService from '../../services/solver-job'

const SolverJobQueryProvider = createQueryProvider<SolverJobData, QueryService<SolverJobData>>(
  appvars.ENTITY.SOLVER_JOB,
  SolverJobService,
)
const useSolverJobQueryContext = (): ContextInterface<SolverJobData> =>
  useQueryContext<SolverJobData>(appvars.ENTITY.SOLVER_JOB)

export { SolverJobQueryProvider, useSolverJobQueryContext }

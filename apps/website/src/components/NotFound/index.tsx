/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent, PropsWithChildren } from 'react'

const NotFound: FunctionComponent<PropsWithChildren<{ what: string; backUrl: string }>> = ({ what, backUrl }) => {
  return (
    <>
      <div>
        <div className='mx-auto py-12 lg:py-16 lg:flex lg:items-center lg:justify-between'>
          <h2 className='text-xl tracking-tight text-gray-900 sm:text-xl'>
            <span className='block'>{what} not found</span>
          </h2>
          <div className='mt-8 lex lg:mt-0 lg:flex-shrink-0'>
            <div className='ml-3 inline-flex rounded-md shadow'>
              <a
                href={`/${backUrl}`}
                className='inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md'
              >
                Back to list
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotFound

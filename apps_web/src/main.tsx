/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@cloudscape-design/global-styles/index.css'
import './index.css'
import App from './App'
import { initializeAmplify } from './services/base/amplify'

// Bootstrap Amplify with runtime appvars before rendering.
initializeAmplify()

const rootEl = document.getElementById('root')

if (!rootEl) {
  throw new Error('Root element #root not found in index.html')
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

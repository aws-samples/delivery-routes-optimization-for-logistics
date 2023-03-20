/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

// eslint-disable-next-line no-use-before-define
import React from 'react'
import { render } from 'react-dom'
import { initializeAmplify } from './services/base/amplify'
import App from './components/AppRoot'
import reportWebVitals from './reportWebVitals'
import './index.css'

// :: - amplify
initializeAmplify()

// :: - react
render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root'),
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// By default, we do NOT enable this reporting
// reportWebVitals()

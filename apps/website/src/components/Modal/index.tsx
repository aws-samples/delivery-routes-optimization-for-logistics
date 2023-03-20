/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useState } from 'react'
import Button from 'aws-northstar/components/Button'
import Modal from 'aws-northstar/components/Modal'

const ModalViewer = () => {
  const [visible, setVisible] = useState(false)
  return (
    <>
      <Modal title='Modal' visible={visible} onClose={() => setVisible(false)}>
        Modal content goes here
      </Modal>
      <Button onClick={() => setVisible(true)}>Show Modal</Button>
    </>
  )
}

;<ModalViewer />

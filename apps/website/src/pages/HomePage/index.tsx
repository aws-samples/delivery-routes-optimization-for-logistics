/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent } from 'react'
import { Box, Container, Link } from 'aws-northstar'
import { useAuthContext } from '../../contexts/AuthenticatedUserContext'

const HomePage: FunctionComponent = () => {
  const authContext = useAuthContext()

  return (
    <>
      <Container headingVariant='h1' title='Route Optimization Sample'>
        <Container headingVariant='h2' title='Scenerio'>
          <Box style={{ fontSize: 18 }}>
            <p>Optimize order dispatching and delivery route for medical supplies</p>
          </Box>
          <Box style={{ fontSize: 16, paddingLeft: 10 }}>
            <ul>
              <li>Customers are hospitals in Seoul, Korea. And they order medical supplies daily.</li>
              <li>Orders are dispatched once a day.</li>
              <li>All deliveries start from a warehouse.</li>
              <li>The customer has delivery priority.</li>
              <li>There can be multiple orders by single customer.</li>
              <li>
                By default, the orders are delivered by company-owned vehicle,
                <br /> but if there are a lot of orders, it can use temporary contracted vehicles.
              </li>
            </ul>
          </Box>
        </Container>
        <Container headingVariant='h2' title='Business considerations'>
          <Box style={{ fontSize: 16, paddingLeft: 10 }}>
            <ul>
              <li>Orders are dispatched to vehicles with considering vehicle capacity.</li>
              <li>Find shorter distance for delivering trips.</li>
              <li>
                Orders must be delivered by vehicles with a time group earlier than the ordering customer's time group.
              </li>
              <li>Multiple orders from a single customer should preferably be delivered by a single vehicle.</li>
              <li>
                Orders must be assigned priority to company-owned vehicles.
                <br /> Temporary contract vehicles are used when all company-owned vehicles are used.
              </li>
            </ul>
          </Box>
        </Container>
      </Container>
    </>
  )
}

export default HomePage

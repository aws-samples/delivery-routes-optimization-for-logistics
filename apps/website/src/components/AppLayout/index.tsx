/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { FunctionComponent, useMemo } from 'react'
import { BreadcrumbGroup, SideNavigation, AppLayout as NSAppLayout } from 'aws-northstar'
import AppHeader from '../AppHeader'
import { SideNavigationItemType } from 'aws-northstar/components/SideNavigation'
import { appvars } from '../../config'

const AppLayout: FunctionComponent = ({ children }) => {
  const menuItems: any[] = useMemo(() => {
    const items = []
    items.push({ text: 'Home', type: SideNavigationItemType.LINK, href: '/' })

    items.push({ type: SideNavigationItemType.DIVIDER })
    items.push({
      text: 'Customer Locations',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.CUSTOMER_LOCATION}`,
    })
    items.push({
      text: 'Warehouses',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.WAREHOUSE}`,
    })
    items.push({
      text: 'Vehicles',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.VEHICLE}`,
    })
    items.push({
      text: 'Orders',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.ORDER}`,
    })

    items.push({ type: SideNavigationItemType.DIVIDER })

    items.push({
      text: 'Distance Cache',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.DISTANCE_CACHE}`,
    })

    items.push({
      text: 'Solver Jobs',
      type: SideNavigationItemType.LINK,
      href: `/${appvars.URL.SOLVER_JOB}`,
    })

    items.push({ type: SideNavigationItemType.DIVIDER })

    return items
  }, [])

  const sideNavigation = useMemo(() => {
    return <SideNavigation header={{ text: 'Menu', href: '/' }} items={menuItems}></SideNavigation>
  }, [menuItems])

  const breadcrumbs = useMemo(() => <BreadcrumbGroup rootPath='Home' />, [])
  const header = useMemo(() => <AppHeader />, [])

  return (
    <NSAppLayout header={header} navigation={sideNavigation} breadcrumbs={breadcrumbs}>
      {children}
    </NSAppLayout>
  )
}

export default AppLayout

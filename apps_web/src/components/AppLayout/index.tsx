/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import { useMemo, type FunctionComponent } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppLayout as CSAppLayout,
  BreadcrumbGroup,
  SideNavigation,
  type SideNavigationProps,
  type BreadcrumbGroupProps,
} from '@cloudscape-design/components'
import { appvars } from '../../config'
import AppHeader from '../AppHeader'

const SECTIONS: { url: string; label: string }[] = [
  { url: appvars.URL.CUSTOMER_LOCATION, label: 'Customer Locations' },
  { url: appvars.URL.WAREHOUSE, label: 'Warehouses' },
  { url: appvars.URL.VEHICLE, label: 'Vehicles' },
  { url: appvars.URL.ORDER, label: 'Orders' },
  { url: appvars.URL.DISTANCE_CACHE, label: 'Distance Cache' },
  { url: appvars.URL.SOLVER_JOB, label: 'Solver Jobs' },
]

const navigationItems: SideNavigationProps.Item[] = [
  { type: 'link', text: 'Home', href: '/' },
  { type: 'divider' },
  { type: 'link', text: 'Customer Locations', href: `/${appvars.URL.CUSTOMER_LOCATION}` },
  { type: 'link', text: 'Warehouses', href: `/${appvars.URL.WAREHOUSE}` },
  { type: 'link', text: 'Vehicles', href: `/${appvars.URL.VEHICLE}` },
  { type: 'link', text: 'Orders', href: `/${appvars.URL.ORDER}` },
  { type: 'divider' },
  { type: 'link', text: 'Distance Cache', href: `/${appvars.URL.DISTANCE_CACHE}` },
  { type: 'link', text: 'Solver Jobs', href: `/${appvars.URL.SOLVER_JOB}` },
  { type: 'divider' },
]

const buildBreadcrumbs = (pathname: string): BreadcrumbGroupProps.Item[] => {
  const items: BreadcrumbGroupProps.Item[] = [{ text: 'Home', href: '/' }]

  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) {
    return items
  }

  const rootSegment = segments[0]
  const section = SECTIONS.find((s) => s.url === rootSegment)
  if (section) {
    items.push({ text: section.label, href: `/${section.url}` })
  } else {
    items.push({ text: rootSegment, href: `/${rootSegment}` })
  }

  // Any subsequent segment (id, edit, etc.) appears as the current page, not a link.
  if (segments.length > 1) {
    const tail = segments.slice(1).join(' / ')
    items.push({ text: tail, href: `/${segments.join('/')}` })
  }

  return items
}

const AppLayout: FunctionComponent = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const breadcrumbs = useMemo<BreadcrumbGroupProps.Item[]>(
    () => buildBreadcrumbs(location.pathname),
    [location.pathname],
  )

  const activeHref = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    return segments.length === 0 ? '/' : `/${segments[0]}`
  }, [location.pathname])

  const navigation = (
    <SideNavigation
      header={{ text: 'Menu', href: '/' }}
      activeHref={activeHref}
      items={navigationItems}
      onFollow={(event) => {
        if (!event.detail.external) {
          event.preventDefault()
          navigate(event.detail.href)
        }
      }}
    />
  )

  return (
    <>
      <AppHeader />
      <CSAppLayout
        headerSelector='#app-header'
        navigation={navigation}
        breadcrumbs={
          <BreadcrumbGroup
            items={breadcrumbs}
            onFollow={(event) => {
              if (!event.detail.external) {
                event.preventDefault()
                navigate(event.detail.href)
              }
            }}
          />
        }
        content={<Outlet />}
        toolsHide
      />
    </>
  )
}

export default AppLayout

import { describe, expect, test } from 'vitest'

import { organisationSwitchTarget } from './organisation-switch-target'

describe('organisationSwitchTarget', () => {
  test('sends a document view to its collection list', () => {
    expect(organisationSwitchTarget('/admin/collections/task-flows/416')).toBe(
      '/admin/collections/task-flows',
    )
  })

  test('sends a nested document route to its collection list', () => {
    expect(organisationSwitchTarget('/admin/collections/activities/12/versions/3')).toBe(
      '/admin/collections/activities',
    )
  })

  test('keeps the create form in place', () => {
    expect(organisationSwitchTarget('/admin/collections/task-lists/create')).toBeNull()
  })

  test('keeps a collection list in place', () => {
    expect(organisationSwitchTarget('/admin/collections/task-flows')).toBeNull()
  })

  test('sends the flow block view to the start page', () => {
    expect(organisationSwitchTarget('/admin/flow/42')).toBe('/admin')
  })

  test('sends the list block view to the start page', () => {
    expect(organisationSwitchTarget('/admin/list/42')).toBe('/admin')
  })

  test('sends the activity block view to the start page', () => {
    expect(organisationSwitchTarget('/admin/activity/7/block/9')).toBe('/admin')
  })

  test('keeps the activity landscape in place', () => {
    expect(organisationSwitchTarget('/admin/activities')).toBeNull()
  })

  test('keeps the start page in place', () => {
    expect(organisationSwitchTarget('/admin')).toBeNull()
  })

  test('keeps the account view in place', () => {
    expect(organisationSwitchTarget('/admin/account')).toBeNull()
  })
})
